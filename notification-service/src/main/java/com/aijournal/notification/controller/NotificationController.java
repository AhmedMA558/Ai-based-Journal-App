package com.aijournal.notification.controller;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.notification.dto.RegisterDeviceTokenRequest;
import com.aijournal.notification.service.NotificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notification API", description = "Email & Push Notifications Pipeline for Daily Reminders and Milestone Alerts")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/send-email")
    @Operation(summary = "Send an email notification")
    public ResponseEntity<ApiResponse<Void>> sendEmail(@RequestBody Map<String, String> request) {
        notificationService.sendEmail(request.get("to"), request.get("subject"), request.get("body"));
        return ResponseEntity.ok(ApiResponse.success("Email sent successfully", null));
    }

    @PostMapping("/reminder")
    @Operation(summary = "Trigger daily journal reminder for user")
    public ResponseEntity<ApiResponse<Void>> triggerReminder(@RequestHeader("X-User-Id") Long userId) {
        notificationService.sendDailyJournalReminder(userId);
        return ResponseEntity.ok(ApiResponse.success("Daily reminder sent successfully", null));
    }

    @PostMapping("/device-token")
    @Operation(summary = "Register (or refresh) a device's Expo push token for the authenticated user")
    public ResponseEntity<ApiResponse<Void>> registerDeviceToken(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody RegisterDeviceTokenRequest request) {
        notificationService.registerDeviceToken(userId, request.getExpoPushToken(), request.getPlatform());
        return ResponseEntity.ok(ApiResponse.success("Device token registered", null));
    }

    @DeleteMapping("/device-token")
    @Operation(summary = "Unregister a device's Expo push token, e.g. on logout")
    public ResponseEntity<ApiResponse<Void>> unregisterDeviceToken(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("expoPushToken") String expoPushToken) {
        notificationService.unregisterDeviceToken(userId, expoPushToken);
        return ResponseEntity.ok(ApiResponse.success("Device token unregistered", null));
    }
}
