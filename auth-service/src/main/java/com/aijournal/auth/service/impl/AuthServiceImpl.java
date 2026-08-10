package com.aijournal.auth.service.impl;

import com.aijournal.auth.dto.*;
import com.aijournal.auth.entity.MfaChallenge;
import com.aijournal.auth.entity.MfaRecoveryCode;
import com.aijournal.auth.entity.RefreshToken;
import com.aijournal.auth.entity.Role;
import com.aijournal.auth.entity.User;
import com.aijournal.auth.repository.MfaChallengeRepository;
import com.aijournal.auth.repository.MfaRecoveryCodeRepository;
import com.aijournal.auth.repository.RefreshTokenRepository;
import com.aijournal.auth.repository.RoleRepository;
import com.aijournal.auth.repository.UserRepository;
import com.aijournal.auth.service.AuthService;
import com.aijournal.auth.service.TotpEncryptionService;
import com.aijournal.auth.service.TotpService;
import com.aijournal.common.exception.BadRequestException;
import com.aijournal.common.exception.ResourceNotFoundException;
import com.aijournal.common.exception.UnauthorizedException;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AuthServiceImpl implements AuthService {

    private static final int RECOVERY_CODE_COUNT = 10;
    private static final int MFA_CHALLENGE_TTL_MINUTES = 5;
    private static final SecureRandom RECOVERY_CODE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final MfaChallengeRepository mfaChallengeRepository;
    private final MfaRecoveryCodeRepository mfaRecoveryCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;
    private final TotpEncryptionService totpEncryptionService;

    @Value("${jwt.secret:defaultSecretKeyForTestingJwtTokenValidation1234567890}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms:900000}") // 15 mins default
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration-ms:604800000}") // 7 days default
    private long refreshExpirationMs;

    public AuthServiceImpl(UserRepository userRepository, RoleRepository roleRepository,
            RefreshTokenRepository refreshTokenRepository, MfaChallengeRepository mfaChallengeRepository,
            MfaRecoveryCodeRepository mfaRecoveryCodeRepository, PasswordEncoder passwordEncoder,
            TotpService totpService, TotpEncryptionService totpEncryptionService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.mfaChallengeRepository = mfaChallengeRepository;
        this.mfaRecoveryCodeRepository = mfaRecoveryCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.totpService = totpService;
        this.totpEncryptionService = totpEncryptionService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use");
        }

        Role userRole = roleRepository.findByName(Role.RoleName.ROLE_USER)
                .orElseGet(() -> roleRepository.save(new Role(null, Role.RoleName.ROLE_USER)));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

        User user = new User(
                null,
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                true,
                true,
                User.AuthProvider.LOCAL,
                null,
                roles);

        User savedUser = userRepository.save(user);
        return generateTokensForUser(savedUser);
    }

    @Override
    @Transactional
    public Object login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsernameOrEmail())
                .orElseGet(() -> userRepository.findByEmail(request.getUsernameOrEmail())
                        .orElseThrow(() -> new UnauthorizedException("Invalid username/email or password")));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid username/email or password");
        }

        if (Boolean.TRUE.equals(user.getMfaEnabled())) {
            String challengeToken = UUID.randomUUID().toString();
            MfaChallenge challenge = new MfaChallenge(null, user, challengeToken,
                    Instant.now().plus(MFA_CHALLENGE_TTL_MINUTES, ChronoUnit.MINUTES));
            mfaChallengeRepository.save(challenge);
            return new MfaChallengeResponse(challengeToken, "Enter your 6-digit authenticator code");
        }

        return generateTokensForUser(user);
    }

    @Override
    @Transactional
    public AuthResponse verifyMfa(MfaVerifyRequest request) {
        MfaChallenge challenge = mfaChallengeRepository.findByChallengeToken(request.getChallengeToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired challenge"));

        if (challenge.getExpiresAt().isBefore(Instant.now())) {
            mfaChallengeRepository.delete(challenge);
            throw new UnauthorizedException("Challenge expired, please log in again");
        }

        User user = challenge.getUser();
        boolean verified;
        if (StringUtils.hasText(request.getCode())) {
            String decryptedSecret = totpEncryptionService.decrypt(user.getTotpSecret());
            verified = totpService.verify(decryptedSecret, request.getCode());
        } else if (StringUtils.hasText(request.getRecoveryCode())) {
            verified = consumeRecoveryCode(user, request.getRecoveryCode());
        } else {
            verified = false;
        }

        if (!verified) {
            throw new UnauthorizedException("Invalid verification code");
        }

        mfaChallengeRepository.delete(challenge);
        return generateTokensForUser(user);
    }

    @Override
    @Transactional
    public MfaSetupResponse setupMfa(Long userId) {
        User user = getUserOrThrow(userId);
        String secret = totpService.generateSecret();
        user.setTotpSecret(totpEncryptionService.encrypt(secret));
        userRepository.save(user);

        String uri = totpService.buildOtpAuthUri(user.getEmail(), secret);
        return new MfaSetupResponse(secret, uri);
    }

    @Override
    @Transactional
    public MfaEnableResponse enableMfa(Long userId, MfaEnableRequest request) {
        User user = getUserOrThrow(userId);
        if (user.getTotpSecret() == null) {
            throw new BadRequestException("Call /mfa/setup first");
        }

        String decryptedSecret = totpEncryptionService.decrypt(user.getTotpSecret());
        if (!totpService.verify(decryptedSecret, request.getCode())) {
            throw new BadRequestException("Invalid verification code");
        }

        user.setMfaEnabled(true);
        userRepository.save(user);

        mfaRecoveryCodeRepository.deleteByUser(user);
        List<String> plainCodes = generateRecoveryCodes(RECOVERY_CODE_COUNT);
        plainCodes.forEach(code ->
                mfaRecoveryCodeRepository.save(new MfaRecoveryCode(null, user, passwordEncoder.encode(code))));

        return new MfaEnableResponse(true, plainCodes);
    }

    @Override
    @Transactional
    public void disableMfa(Long userId, MfaDisableRequest request) {
        User user = getUserOrThrow(userId);
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid password");
        }
        if (!Boolean.TRUE.equals(user.getMfaEnabled())) {
            throw new BadRequestException("MFA is not enabled");
        }

        String decryptedSecret = totpEncryptionService.decrypt(user.getTotpSecret());
        if (!totpService.verify(decryptedSecret, request.getCode())) {
            throw new UnauthorizedException("Invalid verification code");
        }

        user.setMfaEnabled(false);
        user.setTotpSecret(null);
        userRepository.save(user);
        mfaRecoveryCodeRepository.deleteByUser(user);
        mfaChallengeRepository.deleteByUser(user);
    }

    @Override
    @Transactional(readOnly = true)
    public MfaStatusResponse getMfaStatus(Long userId) {
        User user = getUserOrThrow(userId);
        return new MfaStatusResponse(Boolean.TRUE.equals(user.getMfaEnabled()));
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getUserOrThrow(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        // Force re-login everywhere else - a stolen-device session shouldn't
        // survive a password change made because of suspected compromise.
        refreshTokenRepository.deleteByUser(user);
    }

    @Override
    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(Long userId) {
        User user = getUserOrThrow(userId);
        List<String> roleNames = user.getRoles().stream().map(r -> r.getName().name()).toList();
        return new CurrentUserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getFullName(), roleNames);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken token = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (Boolean.TRUE.equals(token.getRevoked()) || token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new UnauthorizedException("Refresh token was expired or revoked. Please login again");
        }

        User user = token.getUser();
        refreshTokenRepository.delete(token); // Refresh token rotation
        return generateTokensForUser(user);
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(refreshTokenRepository::delete);
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private boolean consumeRecoveryCode(User user, String rawCode) {
        List<MfaRecoveryCode> unusedCodes = mfaRecoveryCodeRepository.findByUserAndUsedFalse(user);
        for (MfaRecoveryCode recoveryCode : unusedCodes) {
            if (passwordEncoder.matches(rawCode, recoveryCode.getCodeHash())) {
                recoveryCode.setUsed(true);
                recoveryCode.setUsedAt(Instant.now());
                mfaRecoveryCodeRepository.save(recoveryCode);
                return true;
            }
        }
        return false;
    }

    private List<String> generateRecoveryCodes(int count) {
        List<String> codes = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            codes.add(randomRecoveryCode());
        }
        return codes;
    }

    private String randomRecoveryCode() {
        // 10 random hex digits, formatted as XXXXX-XXXXX for readability.
        StringBuilder sb = new StringBuilder(11);
        String chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no O/I to avoid ambiguity
        for (int i = 0; i < 10; i++) {
            if (i == 5) sb.append('-');
            sb.append(chars.charAt(RECOVERY_CODE_RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private AuthResponse generateTokensForUser(User user) {
        List<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .toList();

        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Instant now = Instant.now();
        Instant expiryDate = now.plusMillis(jwtExpirationMs);

        String accessToken = Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("email", user.getEmail())
                .claim("roles", roleNames)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiryDate))
                .signWith(key)
                .compact();

        String refreshTokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken(
                null,
                refreshTokenValue,
                user,
                Instant.now().plusMillis(refreshExpirationMs),
                false);
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                refreshTokenValue,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                roleNames);
    }
}
