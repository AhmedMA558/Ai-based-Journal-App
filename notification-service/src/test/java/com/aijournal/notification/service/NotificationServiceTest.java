package com.aijournal.notification.service;

import com.aijournal.common.dto.PagedResponse;
import com.aijournal.notification.dto.NotificationResponse;
import com.aijournal.notification.entity.DeviceToken;
import com.aijournal.notification.entity.Notification;
import com.aijournal.notification.repository.DeviceTokenRepository;
import com.aijournal.notification.repository.NotificationRepository;
import com.aijournal.notification.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private DeviceTokenRepository deviceTokenRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ExpoPushService expoPushService;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private NotificationServiceImpl service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "fromAddress", "noreply@mindora.local");
    }

    @Test
    void sendEmail_Success_SendsViaJavaMailSender() {
        service.sendEmail("user@example.com", "Subject", "Body");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();
        assertThat(sent.getTo()).containsExactly("user@example.com");
        assertThat(sent.getSubject()).isEqualTo("Subject");
        assertThat(sent.getText()).isEqualTo("Body");
        assertThat(sent.getFrom()).isEqualTo("noreply@mindora.local");
    }

    @Test
    void sendEmail_MailSenderThrows_DoesNotPropagate() {
        doThrow(new RuntimeException("SMTP down")).when(mailSender).send(any(SimpleMailMessage.class));

        assertThatCode(() -> service.sendEmail("user@example.com", "Subject", "Body"))
                .doesNotThrowAnyException();
    }

    @Test
    void sendPushNotification_UserHasRegisteredTokens_SendsToAllOfThem() {
        DeviceToken tokenA = new DeviceToken(1L, "ExponentPushToken[aaa]", "android");
        DeviceToken tokenB = new DeviceToken(1L, "ExponentPushToken[bbb]", "android");
        when(deviceTokenRepository.findByUserId(1L)).thenReturn(List.of(tokenA, tokenB));

        service.sendPushNotification(1L, "Title", "Message");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<String>> tokensCaptor = ArgumentCaptor.forClass(List.class);
        verify(expoPushService).sendPush(tokensCaptor.capture(), eq("Title"), eq("Message"));
        assertThat(tokensCaptor.getValue()).containsExactlyInAnyOrder("ExponentPushToken[aaa]", "ExponentPushToken[bbb]");
    }

    @Test
    void sendPushNotification_UserHasNoRegisteredToken_SkipsWithoutCallingExpoPushService() {
        when(deviceTokenRepository.findByUserId(1L)).thenReturn(List.of());

        service.sendPushNotification(1L, "Title", "Message");

        verifyNoInteractions(expoPushService);
    }

    @Test
    void sendDailyJournalReminder_DelegatesToSendPushNotificationWithFixedCopy() {
        DeviceToken token = new DeviceToken(7L, "ExponentPushToken[ccc]", "android");
        when(deviceTokenRepository.findByUserId(7L)).thenReturn(List.of(token));

        service.sendDailyJournalReminder(7L);

        verify(expoPushService).sendPush(anyList(), eq("Daily Reminder"),
                eq("Don't forget to reflect on your day and write your journal entry!"));
    }

    @Test
    void registerDeviceToken_NoExistingRow_SavesANewOne() {
        when(deviceTokenRepository.findByUserIdAndExpoPushToken(1L, "tok")).thenReturn(Optional.empty());

        service.registerDeviceToken(1L, "tok", "android");

        ArgumentCaptor<DeviceToken> captor = ArgumentCaptor.forClass(DeviceToken.class);
        verify(deviceTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(1L);
        assertThat(captor.getValue().getExpoPushToken()).isEqualTo("tok");
        assertThat(captor.getValue().getPlatform()).isEqualTo("android");
    }

    @Test
    void registerDeviceToken_ExistingRowForSameUserAndToken_UpdatesPlatformInPlaceRatherThanDuplicating() {
        DeviceToken existing = new DeviceToken(1L, "tok", "ios");
        when(deviceTokenRepository.findByUserIdAndExpoPushToken(1L, "tok")).thenReturn(Optional.of(existing));

        service.registerDeviceToken(1L, "tok", "android");

        ArgumentCaptor<DeviceToken> captor = ArgumentCaptor.forClass(DeviceToken.class);
        verify(deviceTokenRepository).save(captor.capture());
        assertThat(captor.getValue()).isSameAs(existing);
        assertThat(captor.getValue().getPlatform()).isEqualTo("android");
    }

    @Test
    void unregisterDeviceToken_DelegatesToRepositoryDelete() {
        service.unregisterDeviceToken(1L, "tok");

        verify(deviceTokenRepository).deleteByUserIdAndExpoPushToken(1L, "tok");
    }

    @Test
    void createNotification_SavesRealRow() {
        service.createNotification(1L, "SECURITY", "Your password was changed.");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(1L);
        assertThat(captor.getValue().getType()).isEqualTo("SECURITY");
        assertThat(captor.getValue().getMessage()).isEqualTo("Your password was changed.");
    }

    @Test
    void listNotifications_MapsPageToNotificationResponses() {
        Notification n = new Notification(1L, "SECURITY", "msg");
        n.setId(5L);
        n.setCreatedAt(Instant.now());
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(n), PageRequest.of(0, 20), 1));

        PagedResponse<NotificationResponse> result = service.listNotifications(1L, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo(5L);
        assertThat(result.getContent().get(0).getType()).isEqualTo("SECURITY");
        assertThat(result.getContent().get(0).isRead()).isFalse();
    }

    @Test
    void markAllAsRead_DelegatesToRepository() {
        service.markAllAsRead(1L);

        verify(notificationRepository).markAllAsReadForUser(1L);
    }
}
