package com.aijournal.notification.scheduler;

import com.aijournal.notification.repository.DeviceTokenRepository;
import com.aijournal.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// Fires the same daily-reminder message to every registered device at a
// fixed UTC time - a real, working nudge, just not personalized. No
// per-user timezone and no "did they already journal today" check (the
// latter would need a new cross-service call to journal-service that
// doesn't exist today) - documented as a known simplification, not silently
// glossed over, in notification-service/README.md.
@Component
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final DeviceTokenRepository deviceTokenRepository;
    private final NotificationService notificationService;

    public ReminderScheduler(DeviceTokenRepository deviceTokenRepository, NotificationService notificationService) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(cron = "0 0 20 * * *", zone = "UTC")
    public void sendDailyReminders() {
        var userIds = deviceTokenRepository.findAll().stream()
                .map(t -> t.getUserId())
                .distinct()
                .toList();
        log.info("Running daily journal reminder broadcast for {} user(s) with a registered device", userIds.size());
        for (Long userId : userIds) {
            notificationService.sendDailyJournalReminder(userId);
        }
    }
}
