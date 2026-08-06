package com.aijournal.common.event;

import java.io.Serializable;
import java.time.LocalDateTime;

public class UserRegisteredEvent implements Serializable {
    private Long userId;
    private String email;
    private String username;
    private String fullName;
    private LocalDateTime registeredAt;

    public UserRegisteredEvent() {
    }

    public UserRegisteredEvent(Long userId, String email, String username, String fullName, LocalDateTime registeredAt) {
        this.userId = userId;
        this.email = email;
        this.username = username;
        this.fullName = fullName;
        this.registeredAt = registeredAt;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    public void setRegisteredAt(LocalDateTime registeredAt) {
        this.registeredAt = registeredAt;
    }
}
