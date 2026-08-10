package com.aijournal.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class MfaDisableRequest {

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Verification code is required")
    private String code;

    public MfaDisableRequest() {
    }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
