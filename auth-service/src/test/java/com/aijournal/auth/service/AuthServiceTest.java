package com.aijournal.auth.service;

import com.aijournal.auth.dto.*;
import com.aijournal.auth.entity.EmailVerificationToken;
import com.aijournal.auth.entity.MfaChallenge;
import com.aijournal.auth.entity.MfaRecoveryCode;
import com.aijournal.auth.entity.PasswordResetToken;
import com.aijournal.auth.entity.RefreshToken;
import com.aijournal.auth.entity.Role;
import com.aijournal.auth.entity.User;
import com.aijournal.auth.repository.EmailVerificationTokenRepository;
import com.aijournal.auth.repository.MfaChallengeRepository;
import com.aijournal.auth.repository.MfaRecoveryCodeRepository;
import com.aijournal.auth.repository.PasswordResetTokenRepository;
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
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Executor;

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
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TotpService totpService;

    @Mock
    private TotpEncryptionService totpEncryptionService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "jwtSecret", "defaultSecretKeyForTestingJwtTokenValidation1234567890");
        ReflectionTestUtils.setField(authService, "jwtExpirationMs", 900000L);
        ReflectionTestUtils.setField(authService, "refreshExpirationMs", 604800000L);
        ReflectionTestUtils.setField(authService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(authService, "notificationServiceUrl", "http://notification-service:8087");
        // Best-effort notification sends run on this executor in production
        // (see notifyAccountEventBestEffort/sendWelcomeEmailBestEffort/
        // sendPasswordResetEmailBestEffort) to close the forgotPassword
        // timing side-channel - swapped for a same-thread executor here so
        // every restTemplate-verification assertion below stays deterministic.
        ReflectionTestUtils.setField(authService, "notificationExecutor", (Executor) Runnable::run);
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
    void register_Success_TriggersWelcomeEmailWithSystemToken() {
        // notification-service's /send-email is now ROLE_SYSTEM-only (it was
        // an open relay before - any authenticated user could hit it with
        // their own JWT), so the welcome-email trigger must authenticate the
        // same way sendPasswordResetEmailBestEffort already does: a minted
        // system token, not the newly-registered user's own access token.
        RegisterRequest request = new RegisterRequest("testuser", "test@example.com", "password123", "Test User");
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(roleRepository.findByName(Role.RoleName.ROLE_USER))
                .thenReturn(Optional.of(new Role(1L, Role.RoleName.ROLE_USER)));
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        User savedUser = new User(1L, "testuser", "test@example.com", "encodedPassword", "Test User", true, true, User.AuthProvider.LOCAL, null, Set.of(new Role(1L, Role.RoleName.ROLE_USER)));
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        AuthResponse response = authService.register(request);

        // register() now sends two separate best-effort emails (welcome +
        // email-verification) to the same endpoint - capture both and pick
        // out the welcome one by its subject line.
        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<Map<String, String>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(2)).postForEntity(eq("http://notification-service:8087/api/v1/notifications/send-email"),
                captor.capture(), eq(Void.class));
        HttpEntity<Map<String, String>> entity = captor.getAllValues().stream()
                .filter(e -> "Welcome to Mindora!".equals(e.getBody().get("subject")))
                .findFirst().orElseThrow();
        String authHeader = entity.getHeaders().getFirst("Authorization");
        assertNotNull(authHeader);
        assertTrue(authHeader.startsWith("Bearer "));
        assertNotEquals("Bearer " + response.getAccessToken(), authHeader,
                "welcome email must authenticate with a system token, not the new user's own access token");
        assertEquals("test@example.com", entity.getBody().get("to"));
    }

    @Test
    void register_Success_CreatesUnverifiedEmailAndSendsVerificationEmail() {
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
        assertFalse(savedUser.getEmailVerified(), "newly registered users start unverified");

        ArgumentCaptor<EmailVerificationToken> tokenCaptor = ArgumentCaptor.forClass(EmailVerificationToken.class);
        verify(emailVerificationTokenRepository).save(tokenCaptor.capture());
        assertEquals(savedUser, tokenCaptor.getValue().getUser());
        assertNotNull(tokenCaptor.getValue().getVerificationCode());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<Map<String, String>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(2)).postForEntity(eq("http://notification-service:8087/api/v1/notifications/send-email"),
                captor.capture(), eq(Void.class));
        HttpEntity<Map<String, String>> verificationEmail = captor.getAllValues().stream()
                .filter(e -> "Verify your Mindora email address".equals(e.getBody().get("subject")))
                .findFirst().orElseThrow();
        assertEquals("test@example.com", verificationEmail.getBody().get("to"));
        assertTrue(verificationEmail.getBody().get("body").contains(tokenCaptor.getValue().getVerificationCode()));
    }

    @Test
    void register_NotificationServiceUnreachable_RegistrationStillSucceeds() {
        RegisterRequest request = new RegisterRequest("testuser", "test@example.com", "password123", "Test User");
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(roleRepository.findByName(Role.RoleName.ROLE_USER))
                .thenReturn(Optional.of(new Role(1L, Role.RoleName.ROLE_USER)));
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        User savedUser = new User(1L, "testuser", "test@example.com", "encodedPassword", "Test User", true, true, User.AuthProvider.LOCAL, null, Set.of(new Role(1L, Role.RoleName.ROLE_USER)));
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
                .thenThrow(new RestClientException("connection refused"));

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
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
    void verifyMfa_DisabledAccount_ThrowsForbiddenAndDeletesChallenge() {
        // A disabled account must not be able to complete a login it already
        // started before an admin disabled it - a still-valid MfaChallenge
        // created before disablement previously let verifyMfa mint fresh
        // tokens regardless of the account's enabled state.
        User user = mfaUser(true, "encryptedSecret");
        user.setEnabled(false);
        MfaChallenge challenge = new MfaChallenge(1L, user, "challenge-token", Instant.now().plusSeconds(60));
        MfaVerifyRequest request = new MfaVerifyRequest();
        request.setChallengeToken("challenge-token");
        request.setCode("123456");

        when(mfaChallengeRepository.findByChallengeToken("challenge-token")).thenReturn(Optional.of(challenge));

        assertThrows(ForbiddenException.class, () -> authService.verifyMfa(request));
        verify(mfaChallengeRepository, times(1)).delete(challenge);
        verify(totpService, never()).verify(anyString(), anyString());
        verifyNoInteractions(refreshTokenRepository);
    }

    @Test
    void refreshToken_ValidToken_RotatesAndReturnsNewTokens() {
        User user = mfaUser(false, null);
        RefreshToken token = new RefreshToken(1L, "old-refresh-token", user, Instant.now().plusSeconds(3600), false);
        RefreshTokenRequest request = new RefreshTokenRequest("old-refresh-token");
        when(refreshTokenRepository.findByToken("old-refresh-token")).thenReturn(Optional.of(token));

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("testuser", response.getUsername());
        verify(refreshTokenRepository, times(1)).delete(token);
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void refreshToken_ExpiredOrRevoked_ThrowsUnauthorized() {
        User user = mfaUser(false, null);
        RefreshToken token = new RefreshToken(1L, "old-refresh-token", user, Instant.now().minusSeconds(60), false);
        RefreshTokenRequest request = new RefreshTokenRequest("old-refresh-token");
        when(refreshTokenRepository.findByToken("old-refresh-token")).thenReturn(Optional.of(token));

        assertThrows(UnauthorizedException.class, () -> authService.refreshToken(request));
        verify(refreshTokenRepository, times(1)).delete(token);
        verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
    }

    @Test
    void refreshToken_DisabledAccount_ThrowsForbiddenAndDeletesToken() {
        // A refresh token issued before an account was disabled must stop
        // working immediately - otherwise disabling an account wouldn't
        // actually revoke access for as long as the token's full lifetime.
        User user = mfaUser(false, null);
        user.setEnabled(false);
        RefreshToken token = new RefreshToken(1L, "old-refresh-token", user, Instant.now().plusSeconds(3600), false);
        RefreshTokenRequest request = new RefreshTokenRequest("old-refresh-token");
        when(refreshTokenRepository.findByToken("old-refresh-token")).thenReturn(Optional.of(token));

        assertThrows(ForbiddenException.class, () -> authService.refreshToken(request));
        verify(refreshTokenRepository, times(1)).delete(token);
        verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
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

    @Test
    void changePassword_Success_TriggersAccountEventNotification() {
        // Real account-security events (password change, password reset, MFA
        // toggle, admin disable) now log a real notification instead of the
        // web bell always showing 3 hardcoded fictional items - this is the
        // representative case for the shared notifyAccountEventBestEffort
        // mechanism all four call sites use identically.
        User user = mfaUser(false, null);
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("password123");
        request.setNewPassword("newpassword123");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newpassword123")).thenReturn("newEncodedPassword");

        authService.changePassword(1L, request);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<Map<String, Object>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("http://notification-service:8087/api/v1/notifications"),
                captor.capture(), eq(Void.class));
        HttpEntity<Map<String, Object>> entity = captor.getValue();
        assertTrue(entity.getHeaders().getFirst("Authorization").startsWith("Bearer "));
        assertEquals(1L, entity.getBody().get("userId"));
        assertEquals("SECURITY", entity.getBody().get("type"));
    }

    @Test
    void forgotPassword_ExistingEmail_GeneratesCodeAndTriggersEmail() {
        User user = mfaUser(false, null);
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        authService.forgotPassword(request);

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(tokenCaptor.capture());
        assertEquals(user, tokenCaptor.getValue().getUser());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<Map<String, String>>> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("http://notification-service:8087/api/v1/notifications/send-email"),
                entityCaptor.capture(), eq(Void.class));
        HttpEntity<Map<String, String>> entity = entityCaptor.getValue();
        assertTrue(entity.getHeaders().getFirst("Authorization").startsWith("Bearer "));
        assertEquals("test@example.com", entity.getBody().get("to"));
        assertTrue(entity.getBody().get("body").contains(tokenCaptor.getValue().getResetCode()));
    }

    @Test
    void forgotPassword_UnknownEmail_DoesNothingButDoesNotThrow() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nobody@example.com");
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> authService.forgotPassword(request));

        verify(passwordResetTokenRepository, never()).save(any());
        verifyNoInteractions(restTemplate);
    }

    @Test
    void forgotPassword_ExistingCode_IsInvalidatedBeforeNewOneIssued() {
        User user = mfaUser(false, null);
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        authService.forgotPassword(request);

        InOrder inOrder = inOrder(passwordResetTokenRepository);
        inOrder.verify(passwordResetTokenRepository).deleteByUser(user);
        inOrder.verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void forgotPassword_NotificationServiceUnreachable_StillGeneratesAndSavesCode() {
        User user = mfaUser(false, null);
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
                .thenThrow(new RestClientException("connection refused"));

        assertDoesNotThrow(() -> authService.forgotPassword(request));

        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void resetPassword_ValidCode_UpdatesPasswordAndRevokesRefreshTokens() {
        User user = mfaUser(false, null);
        PasswordResetToken token = new PasswordResetToken(1L, user, "ABCDE-12345", Instant.now().plus(10, ChronoUnit.MINUTES));
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setResetCode("ABCDE-12345");
        request.setNewPassword("newpassword123");
        when(passwordResetTokenRepository.findByResetCode("ABCDE-12345")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newpassword123")).thenReturn("newEncodedPassword");

        authService.resetPassword(request);

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUser.capture());
        assertEquals("newEncodedPassword", savedUser.getValue().getPassword());
        verify(refreshTokenRepository).deleteByUser(user);
        verify(passwordResetTokenRepository).delete(token);
    }

    @Test
    void resetPassword_ExpiredCode_ThrowsAndDeletesToken() {
        User user = mfaUser(false, null);
        PasswordResetToken token = new PasswordResetToken(1L, user, "ABCDE-12345", Instant.now().minus(1, ChronoUnit.MINUTES));
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setResetCode("ABCDE-12345");
        request.setNewPassword("newpassword123");
        when(passwordResetTokenRepository.findByResetCode("ABCDE-12345")).thenReturn(Optional.of(token));

        assertThrows(UnauthorizedException.class, () -> authService.resetPassword(request));

        verify(passwordResetTokenRepository).delete(token);
        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPassword_InvalidCode_ThrowsUnauthorized() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setResetCode("NOPE-NOPE");
        request.setNewPassword("newpassword123");
        when(passwordResetTokenRepository.findByResetCode("NOPE-NOPE")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () -> authService.resetPassword(request));
    }

    @Test
    void getCurrentUser_ReturnsEmailVerifiedField() {
        User user = mfaUser(false, null);
        user.setEmailVerified(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        CurrentUserResponse response = authService.getCurrentUser(1L);

        assertTrue(response.getEmailVerified());
    }

    @Test
    void verifyEmail_ValidCode_MarksVerifiedAndDeletesToken() {
        User user = mfaUser(false, null);
        EmailVerificationToken token = new EmailVerificationToken(1L, user, "ABCDE-12345", Instant.now().plus(1, ChronoUnit.HOURS));
        VerifyEmailRequest request = new VerifyEmailRequest();
        request.setCode("ABCDE-12345");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(emailVerificationTokenRepository.findByVerificationCode("ABCDE-12345")).thenReturn(Optional.of(token));

        authService.verifyEmail(1L, request);

        assertTrue(user.getEmailVerified());
        verify(userRepository).save(user);
        verify(emailVerificationTokenRepository).delete(token);
    }

    @Test
    void verifyEmail_CodeBelongsToAnotherUser_ThrowsUnauthorized() {
        User caller = mfaUser(false, null);
        User otherUser = new User(2L, "otheruser", "other@example.com", "encodedPassword", "Other User", true, true, User.AuthProvider.LOCAL, null, Set.of(new Role(1L, Role.RoleName.ROLE_USER)));
        EmailVerificationToken token = new EmailVerificationToken(1L, otherUser, "ABCDE-12345", Instant.now().plus(1, ChronoUnit.HOURS));
        VerifyEmailRequest request = new VerifyEmailRequest();
        request.setCode("ABCDE-12345");
        when(userRepository.findById(1L)).thenReturn(Optional.of(caller));
        when(emailVerificationTokenRepository.findByVerificationCode("ABCDE-12345")).thenReturn(Optional.of(token));

        assertThrows(UnauthorizedException.class, () -> authService.verifyEmail(1L, request));

        verify(userRepository, never()).save(any());
        verify(emailVerificationTokenRepository, never()).delete(any());
    }

    @Test
    void verifyEmail_ExpiredCode_ThrowsAndDeletesToken() {
        User user = mfaUser(false, null);
        EmailVerificationToken token = new EmailVerificationToken(1L, user, "ABCDE-12345", Instant.now().minus(1, ChronoUnit.MINUTES));
        VerifyEmailRequest request = new VerifyEmailRequest();
        request.setCode("ABCDE-12345");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(emailVerificationTokenRepository.findByVerificationCode("ABCDE-12345")).thenReturn(Optional.of(token));

        assertThrows(UnauthorizedException.class, () -> authService.verifyEmail(1L, request));

        verify(emailVerificationTokenRepository).delete(token);
        verify(userRepository, never()).save(any());
    }

    @Test
    void verifyEmail_AlreadyVerified_NoOp() {
        User user = mfaUser(false, null);
        user.setEmailVerified(true);
        VerifyEmailRequest request = new VerifyEmailRequest();
        request.setCode("ABCDE-12345");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertDoesNotThrow(() -> authService.verifyEmail(1L, request));

        verifyNoInteractions(emailVerificationTokenRepository);
        verify(userRepository, never()).save(any());
    }

    @Test
    void resendVerificationEmail_UnverifiedUser_GeneratesNewCode() {
        User user = mfaUser(false, null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        authService.resendVerificationEmail(1L);

        InOrder inOrder = inOrder(emailVerificationTokenRepository);
        inOrder.verify(emailVerificationTokenRepository).deleteByUser(user);
        inOrder.verify(emailVerificationTokenRepository).save(any(EmailVerificationToken.class));
    }

    @Test
    void resendVerificationEmail_AlreadyVerified_ThrowsBadRequest() {
        User user = mfaUser(false, null);
        user.setEmailVerified(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () -> authService.resendVerificationEmail(1L));

        verifyNoInteractions(emailVerificationTokenRepository);
    }
}
