package com.aijournal.notification.service.impl;

import com.aijournal.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    @Override
    public void sendEmail(String to, String subject, String body) {
        log.info("Sending Email to: {}, Subject: '{}', Body: '{}'", to, subject, body);
    }

    @Override
    public void sendPushNotification(Long userId, String title, String message) {
        log.info("Sending Push Notification to User {}: [{}] {}", userId, title, message);
    }

    @Override
    public void sendDailyJournalReminder(Long userId) {
        sendPushNotification(userId, "Daily Reminder", "Don't forget to reflect on your day and write your journal entry!");
    }
}
