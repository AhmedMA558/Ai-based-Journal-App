package com.aijournal.notification.dto;

import jakarta.validation.constraints.NotBlank;

public class RegisterDeviceTokenRequest {

    @NotBlank(message = "expoPushToken is required")
    private String expoPushToken;

    @NotBlank(message = "platform is required")
    private String platform;

    public RegisterDeviceTokenRequest() {
    }

    public String getExpoPushToken() { return expoPushToken; }
    public void setExpoPushToken(String expoPushToken) { this.expoPushToken = expoPushToken; }
    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }
}
