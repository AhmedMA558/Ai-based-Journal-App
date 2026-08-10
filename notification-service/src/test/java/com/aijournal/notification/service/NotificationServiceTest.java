package com.aijournal.notification.service;

import com.aijournal.notification.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;

class NotificationServiceTest {

    private final NotificationServiceImpl service = spy(new NotificationServiceImpl());

    @Test
    void sendDailyJournalReminder_DelegatesToSendPushNotificationWithFixedCopy() {
        service.sendDailyJournalReminder(7L);

        verify(service).sendPushNotification(7L, "Daily Reminder",
                "Don't forget to reflect on your day and write your journal entry!");
    }

    @Test
    void sendEmail_DoesNotThrow() {
        assertThatCode(() -> service.sendEmail("user@example.com", "Subject", "Body"))
                .doesNotThrowAnyException();
    }

    @Test
    void sendPushNotification_DoesNotThrow() {
        assertThatCode(() -> service.sendPushNotification(1L, "Title", "Message"))
                .doesNotThrowAnyException();
    }
}
