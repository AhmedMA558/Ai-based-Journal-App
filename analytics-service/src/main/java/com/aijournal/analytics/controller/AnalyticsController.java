package com.aijournal.analytics.controller;

import com.aijournal.analytics.service.AnalyticsService;
import com.aijournal.common.dto.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics & Insights API", description = "Deep Analytics: Streaks, Emotions Frequency, Mentioned People/Places, and Writing Patterns")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/insights")
    @Operation(summary = "Get deep journal insights and analytics dashboard data")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInsights(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        Map<String, Object> insights = analyticsService.getUserJournalInsights(userId, authorizationHeader);
        return ResponseEntity.ok(ApiResponse.success(insights));
    }
}
