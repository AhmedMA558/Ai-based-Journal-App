package com.aijournal.auth.dto;

import java.util.List;

public class CurrentUserResponse {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private List<String> roles;
    private Boolean emailVerified;

    public CurrentUserResponse() {
    }

    public CurrentUserResponse(Long id, String username, String email, String fullName, List<String> roles, Boolean emailVerified) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
        this.emailVerified = emailVerified;
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
    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }
}
