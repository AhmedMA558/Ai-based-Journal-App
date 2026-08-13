package com.aijournal.notification.controller;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.common.dto.PagedResponse;
import com.aijournal.notification.dto.CreateNotificationRequest;
import com.aijournal.notification.dto.NotificationResponse;
import com.aijournal.notification.dto.RegisterDeviceTokenRequest;
import com.aijournal.notification.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController controller;

    @Test
    void triggerReminder_DelegatesToServiceWithHeaderUserId() {
        ResponseEntity<ApiResponse<Void>> response = controller.triggerReminder(5L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(notificationService).sendDailyJournalReminder(5L);
    }

    @Test
    void registerDeviceToken_DelegatesToServiceWithHeaderUserIdAndRequestFields() {
        RegisterDeviceTokenRequest request = new RegisterDeviceTokenRequest();
        request.setExpoPushToken("ExponentPushToken[xyz]");
        request.setPlatform("android");

        ResponseEntity<ApiResponse<Void>> response = controller.registerDeviceToken(5L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(notificationService).registerDeviceToken(5L, "ExponentPushToken[xyz]", "android");
    }

    @Test
    void unregisterDeviceToken_DelegatesToServiceWithHeaderUserIdAndQueryToken() {
        ResponseEntity<ApiResponse<Void>> response = controller.unregisterDeviceToken(5L, "ExponentPushToken[xyz]");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(notificationService).unregisterDeviceToken(5L, "ExponentPushToken[xyz]");
    }

    @Test
    void createNotification_DelegatesToServiceWithRequestFields() {
        CreateNotificationRequest request = new CreateNotificationRequest();
        request.setUserId(5L);
        request.setType("SECURITY");
        request.setMessage("Your password was changed.");

        ResponseEntity<ApiResponse<Void>> response = controller.createNotification(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(notificationService).createNotification(5L, "SECURITY", "Your password was changed.");
    }

    @Test
    void listNotifications_DelegatesToServiceWithHeaderUserIdAndPageParams() {
        PagedResponse<NotificationResponse> paged = new PagedResponse<>(List.of(), 0, 20, 0, 0, true, true);
        when(notificationService.listNotifications(eq(5L), any(Pageable.class))).thenReturn(paged);

        ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> response =
                controller.listNotifications(5L, 0, 20);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(notificationService).listNotifications(eq(5L), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue()).isEqualTo(PageRequest.of(0, 20));
    }

    @Test
    void markAllAsRead_DelegatesToServiceWithHeaderUserId() {
        ResponseEntity<ApiResponse<Void>> response = controller.markAllAsRead(5L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(notificationService).markAllAsRead(5L);
    }
}
