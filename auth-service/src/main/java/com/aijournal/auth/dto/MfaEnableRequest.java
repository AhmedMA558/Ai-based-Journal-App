package com.aijournal.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class MfaEnableRequest {

    @NotBlank(message = "Verification code is required")
    private String code;

    public MfaEnableRequest() {
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
