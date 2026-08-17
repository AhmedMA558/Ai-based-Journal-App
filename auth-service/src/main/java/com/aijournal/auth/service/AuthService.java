package com.aijournal.auth.service;

import com.aijournal.auth.dto.*;
import com.aijournal.common.dto.PagedResponse;
import org.springframework.data.domain.Pageable;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    // AuthResponse when MFA is off (unchanged shape), MfaChallengeResponse when it's on.
    // ipAddress/userAgent are the real client's, resolved by the controller,
    // recorded to LoginHistory best-effort on both the success and failure paths.
    Object login(LoginRequest request, String ipAddress, String userAgent);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void logout(String refreshToken);

    AuthResponse verifyMfa(MfaVerifyRequest request, String ipAddress, String userAgent);
    PagedResponse<LoginHistoryResponse> getLoginHistory(Long userId, Pageable pageable);
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
