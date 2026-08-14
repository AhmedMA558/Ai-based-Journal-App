package com.aijournal.auth.service;

import com.aijournal.auth.dto.*;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    // AuthResponse when MFA is off (unchanged shape), MfaChallengeResponse when it's on.
    Object login(LoginRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void logout(String refreshToken);

    AuthResponse verifyMfa(MfaVerifyRequest request);
    MfaSetupResponse setupMfa(Long userId);
    MfaEnableResponse enableMfa(Long userId, MfaEnableRequest request);
    void disableMfa(Long userId, MfaDisableRequest request);
    MfaStatusResponse getMfaStatus(Long userId);
    void changePassword(Long userId, ChangePasswordRequest request);
    CurrentUserResponse getCurrentUser(Long userId);

    // Always completes without revealing whether the email is registered -
    // enumeration protection lives at this layer, not just the controller.
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);

    // Authenticated (not public, unlike password reset) - the caller is
    // always logged in by the time they'd submit a code, since register()
    // issues tokens unconditionally.
    void verifyEmail(Long userId, VerifyEmailRequest request);
    void resendVerificationEmail(Long userId);
}
