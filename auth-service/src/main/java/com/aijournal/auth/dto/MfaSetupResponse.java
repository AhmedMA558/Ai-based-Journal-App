package com.aijournal.auth.dto;

public class MfaSetupResponse {

    private String secret;
    private String otpAuthUri;

    public MfaSetupResponse() {
    }

    public MfaSetupResponse(String secret, String otpAuthUri) {
        this.secret = secret;
        this.otpAuthUri = otpAuthUri;
    }

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public String getOtpAuthUri() { return otpAuthUri; }
    public void setOtpAuthUri(String otpAuthUri) { this.otpAuthUri = otpAuthUri; }
}
