package com.aijournal.notification.dto;

import java.time.Instant;

public class NotificationResponse {
    private Long id;
    private String type;
    private String message;
    private boolean read;
    private Instant createdAt;

    public NotificationResponse() {
    }

    public NotificationResponse(Long id, String type, String message, boolean read, Instant createdAt) {
        this.id = id;
        this.type = type;
        this.message = message;
        this.read = read;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
