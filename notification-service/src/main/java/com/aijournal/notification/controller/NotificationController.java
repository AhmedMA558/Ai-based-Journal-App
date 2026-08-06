package com.aijournal.notification.controller;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.notification.service.NotificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
}
