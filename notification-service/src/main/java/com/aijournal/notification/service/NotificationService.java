package com.aijournal.notification.service;

public interface NotificationService {
    void sendEmail(String to, String subject, String body);
    void sendPushNotification(Long userId, String title, String message);
    void sendDailyJournalReminder(Long userId);
    void registerDeviceToken(Long userId, String expoPushToken, String platform);
    void unregisterDeviceToken(Long userId, String expoPushToken);
}
