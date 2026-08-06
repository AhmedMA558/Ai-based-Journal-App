package com.aijournal.notification.service;

public interface NotificationService {
    void sendEmail(String to, String subject, String body);
    void sendPushNotification(Long userId, String title, String message);
    void sendDailyJournalReminder(Long userId);
}
