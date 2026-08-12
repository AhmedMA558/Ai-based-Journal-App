package com.aijournal.notification.controller;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.notification.dto.RegisterDeviceTokenRequest;
import com.aijournal.notification.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

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
}
