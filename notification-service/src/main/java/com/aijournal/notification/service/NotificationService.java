package com.aijournal.notification.service;

import com.aijournal.common.dto.PagedResponse;
import com.aijournal.notification.dto.NotificationResponse;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    void sendEmail(String to, String subject, String body);
    void sendPushNotification(Long userId, String title, String message);
    void sendDailyJournalReminder(Long userId);
    void registerDeviceToken(Long userId, String expoPushToken, String platform);
    void unregisterDeviceToken(Long userId, String expoPushToken);
    void createNotification(Long userId, String type, String message);
    PagedResponse<NotificationResponse> listNotifications(Long userId, Pageable pageable);
    void markAllAsRead(Long userId);
}
