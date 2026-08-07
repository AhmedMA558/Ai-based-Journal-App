package com.aijournal.auth.service.impl;

import com.aijournal.auth.dto.AuthResponse;
import com.aijournal.auth.dto.LoginRequest;
import com.aijournal.auth.dto.RefreshTokenRequest;
import com.aijournal.auth.dto.RegisterRequest;
import com.aijournal.auth.entity.RefreshToken;
import com.aijournal.auth.entity.Role;
import com.aijournal.auth.entity.User;
import com.aijournal.auth.repository.RefreshTokenRepository;
import com.aijournal.auth.repository.RoleRepository;
import com.aijournal.auth.repository.UserRepository;
import com.aijournal.auth.service.AuthService;
import com.aijournal.common.exception.BadRequestException;
import com.aijournal.common.exception.UnauthorizedException;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.secret:defaultSecretKeyForTestingJwtTokenValidation1234567890}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms:900000}") // 15 mins default
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration-ms:604800000}") // 7 days default
    private long refreshExpirationMs;

    public AuthServiceImpl(UserRepository userRepository, RoleRepository roleRepository,
            RefreshTokenRepository refreshTokenRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
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
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsernameOrEmail())
                .orElseGet(() -> userRepository.findByEmail(request.getUsernameOrEmail())
                        .orElseThrow(() -> new UnauthorizedException("Invalid username/email or password")));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid username/email or password");
        }

        return generateTokensForUser(user);
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
