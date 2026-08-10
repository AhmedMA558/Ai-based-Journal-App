package com.aijournal.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class MfaVerifyRequest {

    @NotBlank(message = "Challenge token is required")
    private String challengeToken;

    // Exactly one of code/recoveryCode is expected - validated in the
    // service layer (XOR isn't expressible cleanly via annotations here).
    private String code;
    private String recoveryCode;

    public MfaVerifyRequest() {
    }

    public String getChallengeToken() { return challengeToken; }
    public void setChallengeToken(String challengeToken) { this.challengeToken = challengeToken; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getRecoveryCode() { return recoveryCode; }
    public void setRecoveryCode(String recoveryCode) { this.recoveryCode = recoveryCode; }
}
