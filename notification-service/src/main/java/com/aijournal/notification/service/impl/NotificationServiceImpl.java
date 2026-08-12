package com.aijournal.notification.service.impl;

import com.aijournal.notification.entity.DeviceToken;
import com.aijournal.notification.repository.DeviceTokenRepository;
import com.aijournal.notification.service.ExpoPushService;
import com.aijournal.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final DeviceTokenRepository deviceTokenRepository;
    private final ExpoPushService expoPushService;

    public NotificationServiceImpl(DeviceTokenRepository deviceTokenRepository, ExpoPushService expoPushService) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.expoPushService = expoPushService;
    }

    @Override
    public void sendEmail(String to, String subject, String body) {
        log.info("Sending Email to: {}, Subject: '{}', Body: '{}'", to, subject, body);
    }

    @Override
    public void sendPushNotification(Long userId, String title, String message) {
        List<String> tokens = deviceTokenRepository.findByUserId(userId).stream()
                .map(DeviceToken::getExpoPushToken)
                .toList();
        if (tokens.isEmpty()) {
            log.info("No registered device token for user {} - skipping push \"{}\"", userId, title);
            return;
        }
        expoPushService.sendPush(tokens, title, message);
    }

    @Override
    public void sendDailyJournalReminder(Long userId) {
        sendPushNotification(userId, "Daily Reminder", "Don't forget to reflect on your day and write your journal entry!");
    }

    @Override
    @Transactional
    public void registerDeviceToken(Long userId, String expoPushToken, String platform) {
        Optional<DeviceToken> existing = deviceTokenRepository.findByUserIdAndExpoPushToken(userId, expoPushToken);
        DeviceToken token = existing.orElseGet(() -> new DeviceToken(userId, expoPushToken, platform));
        token.setPlatform(platform);
        deviceTokenRepository.save(token);
    }

    @Override
    @Transactional
    public void unregisterDeviceToken(Long userId, String expoPushToken) {
        deviceTokenRepository.deleteByUserIdAndExpoPushToken(userId, expoPushToken);
    }
}
