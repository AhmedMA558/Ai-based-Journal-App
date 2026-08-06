package com.aijournal.auth.service;

import com.aijournal.auth.dto.AuthResponse;
import com.aijournal.auth.dto.LoginRequest;
import com.aijournal.auth.dto.RefreshTokenRequest;
import com.aijournal.auth.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void logout(String refreshToken);
}
