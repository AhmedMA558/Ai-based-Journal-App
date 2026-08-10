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
}
