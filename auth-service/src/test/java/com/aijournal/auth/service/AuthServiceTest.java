package com.aijournal.auth.service;

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
import com.aijournal.auth.service.impl.AuthServiceImpl;
import com.aijournal.common.exception.BadRequestException;
import com.aijournal.common.exception.ForbiddenException;
import com.aijournal.common.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private MfaChallengeRepository mfaChallengeRepository;

    @Mock
    private MfaRecoveryCodeRepository mfaRecoveryCodeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TotpService totpService;

    @Mock
    private TotpEncryptionService totpEncryptionService;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "jwtSecret", "defaultSecretKeyForTestingJwtTokenValidation1234567890");
        ReflectionTestUtils.setField(authService, "jwtExpirationMs", 900000L);
        ReflectionTestUtils.setField(authService, "refreshExpirationMs", 604800000L);
    }

    private User mfaUser(boolean mfaEnabled, String encryptedSecret) {
        User user = new User(1L, "testuser", "test@example.com", "encodedPassword", "Test User", true, true, User.AuthProvider.LOCAL, null, Set.of(new Role(1L, Role.RoleName.ROLE_USER)));
        user.setMfaEnabled(mfaEnabled);
        user.setTotpSecret(encryptedSecret);
        return user;
    }

    @Test
    void register_Success() {
        RegisterRequest request = new RegisterRequest("testuser", "test@example.com", "password123", "Test User");

        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(roleRepository.findByName(Role.RoleName.ROLE_USER))
                .thenReturn(Optional.of(new Role(1L, Role.RoleName.ROLE_USER)));
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        User savedUser = new User(1L, "testuser", "test@example.com", "encodedPassword", "Test User", true, true, User.AuthProvider.LOCAL, null, Set.of(new Role(1L, Role.RoleName.ROLE_USER)));
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("testuser", response.getUsername());
        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void register_DuplicateUsername_ThrowsBadRequest() {
        RegisterRequest request = new RegisterRequest("testuser", "test@example.com", "password123", "Test User");
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
    }

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest("testuser", "password123");
        User user = mfaUser(false, null);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        AuthResponse response = (AuthResponse) authService.login(request);

        assertNotNull(response);
        assertEquals("testuser", response.getUsername());
        assertNotNull(response.getAccessToken());
        assertFalse(response.isMfaRequired());
    }

    @Test
    void login_InvalidPassword_ThrowsUnauthorized() {
        LoginRequest request = new LoginRequest("testuser", "wrongpassword");
        User user = mfaUser(false, null);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }

    @Test
    void login_DisabledAccount_ThrowsForbidden() {
        LoginRequest request = new LoginRequest("testuser", "password123");
        User user = mfaUser(false, null);
        user.setEnabled(false);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        assertThrows(ForbiddenException.class, () -> authService.login(request));
    }

    @Test
    void login_MfaEnabled_ReturnsChallengeNotTokens() {
        LoginRequest request = new LoginRequest("testuser", "password123");
        User user = mfaUser(true, "encryptedSecret");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        Object result = authService.login(request);

        assertInstanceOf(MfaChallengeResponse.class, result);
        assertTrue(((MfaChallengeResponse) result).isMfaRequired());
        verify(mfaChallengeRepository, times(1)).save(any(MfaChallenge.class));
        verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
    }

    @Test
    void verifyMfa_ValidCode_ReturnsAuthResponseAndDeletesChallenge() {
        User user = mfaUser(true, "encryptedSecret");
        MfaChallenge challenge = new MfaChallenge(1L, user, "challenge-token", Instant.now().plusSeconds(60));
        MfaVerifyRequest request = new MfaVerifyRequest();
        request.setChallengeToken("challenge-token");
        request.setCode("123456");

        when(mfaChallengeRepository.findByChallengeToken("challenge-token")).thenReturn(Optional.of(challenge));
        when(totpEncryptionService.decrypt("encryptedSecret")).thenReturn("plainSecret");
        when(totpService.verify("plainSecret", "123456")).thenReturn(true);

        AuthResponse response = authService.verifyMfa(request);

        assertNotNull(response);
        assertEquals("testuser", response.getUsername());
        verify(mfaChallengeRepository, times(1)).delete(challenge);
    }

    @Test
    void verifyMfa_ExpiredChallenge_ThrowsUnauthorized() {
        User user = mfaUser(true, "encryptedSecret");
        MfaChallenge challenge = new MfaChallenge(1L, user, "challenge-token", Instant.now().minusSeconds(60));
        MfaVerifyRequest request = new MfaVerifyRequest();
        request.setChallengeToken("challenge-token");
        request.setCode("123456");

        when(mfaChallengeRepository.findByChallengeToken("challenge-token")).thenReturn(Optional.of(challenge));

        assertThrows(UnauthorizedException.class, () -> authService.verifyMfa(request));
        verify(mfaChallengeRepository, times(1)).delete(challenge);
    }

    @Test
    void verifyMfa_InvalidCode_ThrowsUnauthorized() {
        User user = mfaUser(true, "encryptedSecret");
        MfaChallenge challenge = new MfaChallenge(1L, user, "challenge-token", Instant.now().plusSeconds(60));
        MfaVerifyRequest request = new MfaVerifyRequest();
        request.setChallengeToken("challenge-token");
        request.setCode("000000");

        when(mfaChallengeRepository.findByChallengeToken("challenge-token")).thenReturn(Optional.of(challenge));
        when(totpEncryptionService.decrypt("encryptedSecret")).thenReturn("plainSecret");
        when(totpService.verify("plainSecret", "000000")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.verifyMfa(request));
        verify(mfaChallengeRepository, never()).delete(any());
    }

    @Test
    void verifyMfa_ValidRecoveryCode_ConsumesCodeAndReturnsTokens() {
        User user = mfaUser(true, "encryptedSecret");
        MfaChallenge challenge = new MfaChallenge(1L, user, "challenge-token", Instant.now().plusSeconds(60));
        MfaVerifyRequest request = new MfaVerifyRequest();
        request.setChallengeToken("challenge-token");
        request.setRecoveryCode("ABCDE-12345");

        MfaRecoveryCode recoveryCode = new MfaRecoveryCode(1L, user, "hashedCode");

        when(mfaChallengeRepository.findByChallengeToken("challenge-token")).thenReturn(Optional.of(challenge));
        when(mfaRecoveryCodeRepository.findByUserAndUsedFalse(user)).thenReturn(List.of(recoveryCode));
        when(passwordEncoder.matches("ABCDE-12345", "hashedCode")).thenReturn(true);

        AuthResponse response = authService.verifyMfa(request);

        assertNotNull(response);
        assertTrue(recoveryCode.getUsed());
        verify(mfaRecoveryCodeRepository, times(1)).save(recoveryCode);
        verify(mfaChallengeRepository, times(1)).delete(challenge);
    }

    @Test
    void setupMfa_PersistsSecretAndReturnsUri() {
        User user = mfaUser(false, null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(totpService.generateSecret()).thenReturn("PLAINSECRET");
        when(totpEncryptionService.encrypt("PLAINSECRET")).thenReturn("ciphertext");
        when(totpService.buildOtpAuthUri("test@example.com", "PLAINSECRET")).thenReturn("otpauth://totp/...");

        MfaSetupResponse response = authService.setupMfa(1L);

        assertEquals("PLAINSECRET", response.getSecret());
        assertEquals("otpauth://totp/...", response.getOtpAuthUri());
        assertEquals("ciphertext", user.getTotpSecret());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void enableMfa_ValidCode_SetsEnabledAndReturnsTenRecoveryCodes() {
        User user = mfaUser(false, "encryptedSecret");
        MfaEnableRequest request = new MfaEnableRequest();
        request.setCode("123456");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(totpEncryptionService.decrypt("encryptedSecret")).thenReturn("plainSecret");
        when(totpService.verify("plainSecret", "123456")).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedCode");

        MfaEnableResponse response = authService.enableMfa(1L, request);

        assertTrue(response.isMfaEnabled());
        assertTrue(user.getMfaEnabled());
        assertEquals(10, response.getRecoveryCodes().size());
        assertEquals(10, response.getRecoveryCodes().stream().distinct().count());
        verify(mfaRecoveryCodeRepository, times(1)).deleteByUser(user);
        verify(mfaRecoveryCodeRepository, times(10)).save(any(MfaRecoveryCode.class));
    }

    @Test
    void enableMfa_InvalidCode_ThrowsBadRequest() {
        User user = mfaUser(false, "encryptedSecret");
        MfaEnableRequest request = new MfaEnableRequest();
        request.setCode("000000");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(totpEncryptionService.decrypt("encryptedSecret")).thenReturn("plainSecret");
        when(totpService.verify("plainSecret", "000000")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.enableMfa(1L, request));
        assertFalse(user.getMfaEnabled());
    }

    @Test
    void disableMfa_WrongPassword_ThrowsUnauthorized() {
        User user = mfaUser(true, "encryptedSecret");
        MfaDisableRequest request = new MfaDisableRequest();
        request.setPassword("wrongpassword");
        request.setCode("123456");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.disableMfa(1L, request));
        assertTrue(user.getMfaEnabled());
    }

    @Test
    void disableMfa_Success_ClearsSecretAndRecoveryCodes() {
        User user = mfaUser(true, "encryptedSecret");
        MfaDisableRequest request = new MfaDisableRequest();
        request.setPassword("password123");
        request.setCode("123456");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(totpEncryptionService.decrypt("encryptedSecret")).thenReturn("plainSecret");
        when(totpService.verify("plainSecret", "123456")).thenReturn(true);

        authService.disableMfa(1L, request);

        assertFalse(user.getMfaEnabled());
        assertNull(user.getTotpSecret());
        verify(mfaRecoveryCodeRepository, times(1)).deleteByUser(user);
        verify(mfaChallengeRepository, times(1)).deleteByUser(user);
    }

    @Test
    void changePassword_WrongCurrentPassword_ThrowsUnauthorized() {
        User user = mfaUser(false, null);
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongpassword");
        request.setNewPassword("newpassword123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.changePassword(1L, request));
        verify(refreshTokenRepository, never()).deleteByUser(any());
    }

    @Test
    void changePassword_Success_RevokesExistingRefreshTokens() {
        User user = mfaUser(false, null);
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("password123");
        request.setNewPassword("newpassword123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newpassword123")).thenReturn("newEncodedPassword");

        authService.changePassword(1L, request);

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUser.capture());
        assertEquals("newEncodedPassword", savedUser.getValue().getPassword());
        verify(refreshTokenRepository, times(1)).deleteByUser(user);
    }
}
