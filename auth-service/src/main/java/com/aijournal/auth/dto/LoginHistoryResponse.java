package com.aijournal.auth.dto;

import java.time.LocalDateTime;

public class LoginHistoryResponse {

    private Long id;
    private LocalDateTime loginTime;
    private String ipAddress;
    private String userAgent;
    private String status;

    public LoginHistoryResponse() {
    }

    public LoginHistoryResponse(Long id, LocalDateTime loginTime, String ipAddress, String userAgent, String status) {
        this.id = id;
        this.loginTime = loginTime;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getLoginTime() { return loginTime; }
    public void setLoginTime(LocalDateTime loginTime) { this.loginTime = loginTime; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
