package com.aijournal.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateNotificationRequest {

    @NotNull(message = "userId is required")
    private Long userId;

    @NotBlank(message = "type is required")
    private String type;

    @NotBlank(message = "message is required")
    private String message;

    public CreateNotificationRequest() {
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
