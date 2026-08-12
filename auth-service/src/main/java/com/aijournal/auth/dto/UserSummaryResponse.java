package com.aijournal.auth.dto;

import java.time.LocalDateTime;
import java.util.List;

public class UserSummaryResponse {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private List<String> roles;
    private Boolean enabled;
    private Boolean mfaEnabled;
    private LocalDateTime createdAt;

    public UserSummaryResponse() {
    }

    public UserSummaryResponse(Long id, String username, String email, String fullName, List<String> roles,
                                Boolean enabled, Boolean mfaEnabled, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
        this.enabled = enabled;
        this.mfaEnabled = mfaEnabled;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public Boolean getMfaEnabled() { return mfaEnabled; }
    public void setMfaEnabled(Boolean mfaEnabled) { this.mfaEnabled = mfaEnabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
