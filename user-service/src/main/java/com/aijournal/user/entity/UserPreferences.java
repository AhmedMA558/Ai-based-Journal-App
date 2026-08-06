package com.aijournal.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
public class UserPreferences {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "dark_mode", nullable = false)
    private Boolean darkMode = true;

    @Column(name = "time_zone", nullable = false, length = 50)
    private String timeZone = "UTC";

    @Column(nullable = false, length = 10)
    private String language = "en";

    @Column(name = "email_notifications", nullable = false)
    private Boolean emailNotifications = true;

    @Column(name = "push_notifications", nullable = false)
    private Boolean pushNotifications = true;

    @Column(name = "daily_reminder_time", length = 10)
    private String dailyReminderTime = "20:00";

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public UserPreferences() {
    }

    public UserPreferences(Long userId, Boolean darkMode, String timeZone, String language, Boolean emailNotifications, Boolean pushNotifications, String dailyReminderTime) {
        this.userId = userId;
        this.darkMode = darkMode != null ? darkMode : true;
        this.timeZone = timeZone != null ? timeZone : "UTC";
        this.language = language != null ? language : "en";
        this.emailNotifications = emailNotifications != null ? emailNotifications : true;
        this.pushNotifications = pushNotifications != null ? pushNotifications : true;
        this.dailyReminderTime = dailyReminderTime != null ? dailyReminderTime : "20:00";
    }

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Boolean getDarkMode() { return darkMode; }
    public void setDarkMode(Boolean darkMode) { this.darkMode = darkMode; }
    public String getTimeZone() { return timeZone; }
    public void setTimeZone(String timeZone) { this.timeZone = timeZone; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public Boolean getEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(Boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    public Boolean getPushNotifications() { return pushNotifications; }
    public void setPushNotifications(Boolean pushNotifications) { this.pushNotifications = pushNotifications; }
    public String getDailyReminderTime() { return dailyReminderTime; }
    public void setDailyReminderTime(String dailyReminderTime) { this.dailyReminderTime = dailyReminderTime; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
