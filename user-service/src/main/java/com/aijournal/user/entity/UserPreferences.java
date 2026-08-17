package com.aijournal.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
public class UserPreferences {

    @Id
    @Column(name = "user_id")
    private Long userId;

    // Deliberately no field initializers here (unlike this project's usual
    // convention, e.g. Journal.mood) - Jackson's no-arg-constructor-then-
    // setters deserialization would otherwise backfill every JSON key a
    // partial PUT omits with these defaults instead of leaving it null,
    // silently defeating updatePreferences()'s skip-if-null guard for real
    // HTTP callers. The one real defaulting path (a brand-new user's row)
    // already goes through the explicit multi-arg constructor below, which
    // null-coalesces to the same values - defaulting lives there only.
    @Column(name = "dark_mode", nullable = false)
    private Boolean darkMode;

    @Column(name = "time_zone", nullable = false, length = 50)
    private String timeZone;

    @Column(nullable = false, length = 10)
    private String language;

    @Column(name = "email_notifications", nullable = false)
    private Boolean emailNotifications;

    @Column(name = "push_notifications", nullable = false)
    private Boolean pushNotifications;

    @Column(name = "daily_reminder_time", length = 10)
    private String dailyReminderTime;

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
