package com.aijournal.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class MfaDisableRequest {

    @NotBlank(message = "Password is required")
    private String password;

    // Exactly one of code/recoveryCode is expected - a user who lost their
    // authenticator device and already fell back to a recovery code to log in
    // has no other way to ever disable MFA. Neither is @NotBlank here since
    // either one alone satisfies the request; AuthServiceImpl.disableMfa()
    // rejects if both or neither are present, mirroring MfaVerifyRequest's
    // handling of the same either/or shape.
    private String code;
    private String recoveryCode;

    public MfaDisableRequest() {
    }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getRecoveryCode() { return recoveryCode; }
    public void setRecoveryCode(String recoveryCode) { this.recoveryCode = recoveryCode; }
}
