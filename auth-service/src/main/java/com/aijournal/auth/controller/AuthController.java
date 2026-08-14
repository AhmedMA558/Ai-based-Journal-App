package com.aijournal.auth.controller;

import com.aijournal.auth.dto.*;
import com.aijournal.auth.service.AuthService;
import com.aijournal.common.dto.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication API", description = "Endpoints for User Registration, Login, Token Refresh, MFA, and Account Security")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user account")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and receive JWT tokens, or an MFA challenge if 2FA is enabled")
    public ResponseEntity<ApiResponse<Object>> login(@Valid @RequestBody LoginRequest request) {
        Object response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/mfa/verify")
    @Operation(summary = "Complete login by verifying a TOTP code or recovery code against an MFA challenge")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyMfa(@Valid @RequestBody MfaVerifyRequest request) {
        AuthResponse response = authService.verifyMfa(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT access token using sliding refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke refresh token and logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @GetMapping("/me")
    @Operation(summary = "Get the authenticated user's identity")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> getCurrentUser(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(authService.getCurrentUser(userId)));
    }

    @PutMapping("/password")
    @Operation(summary = "Change the authenticated user's password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader("X-User-Id") Long userId, @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PostMapping("/password/forgot")
    @Operation(summary = "Request a password reset code by email - always returns the same generic response")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("If that email is registered, a reset code has been sent.", null));
    }

    @PostMapping("/password/reset")
    @Operation(summary = "Reset a password using a code emailed by /password/forgot")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }

    @GetMapping("/mfa/status")
    @Operation(summary = "Check whether the authenticated user has 2FA enabled")
    public ResponseEntity<ApiResponse<MfaStatusResponse>> getMfaStatus(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(authService.getMfaStatus(userId)));
    }

    @PostMapping("/mfa/setup")
    @Operation(summary = "Generate a new TOTP secret for 2FA enrollment (not yet enabled)")
    public ResponseEntity<ApiResponse<MfaSetupResponse>> setupMfa(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(authService.setupMfa(userId)));
    }

    @PostMapping("/mfa/enable")
    @Operation(summary = "Confirm 2FA enrollment with a verification code and receive one-time recovery codes")
    public ResponseEntity<ApiResponse<MfaEnableResponse>> enableMfa(
            @RequestHeader("X-User-Id") Long userId, @Valid @RequestBody MfaEnableRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.enableMfa(userId, request)));
    }

    @PostMapping("/mfa/disable")
    @Operation(summary = "Disable 2FA (requires current password and a valid code)")
    public ResponseEntity<ApiResponse<Void>> disableMfa(
            @RequestHeader("X-User-Id") Long userId, @Valid @RequestBody MfaDisableRequest request) {
        authService.disableMfa(userId, request);
        return ResponseEntity.ok(ApiResponse.success("2FA disabled", null));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify the authenticated user's email address with a code sent at registration")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @RequestHeader("X-User-Id") Long userId, @Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", null));
    }

    @PostMapping("/verify-email/resend")
    @Operation(summary = "Resend the authenticated user's email verification code")
    public ResponseEntity<ApiResponse<Void>> resendVerificationEmail(@RequestHeader("X-User-Id") Long userId) {
        authService.resendVerificationEmail(userId);
        return ResponseEntity.ok(ApiResponse.success("Verification email sent", null));
    }
}
