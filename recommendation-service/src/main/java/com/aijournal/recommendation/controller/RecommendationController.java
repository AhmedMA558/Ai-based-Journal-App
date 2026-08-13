package com.aijournal.recommendation.controller;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.recommendation.service.RecommendationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/recommendations")
@Tag(name = "Recommendation Engine API", description = "Context-Aware Recommendations for Prompts, Books, Habits, Meditation, Music, Exercise, Podcasts & Articles")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    @Operation(summary = "Get personalized recommendations based on mood & journal history - if currentMood is omitted, it's computed from the caller's real recent journal entries")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRecommendations(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestParam(required = false) String currentMood) {
        Map<String, Object> response = recommendationService.getPersonalizedRecommendations(userId, currentMood, authorizationHeader);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/prompts")
    @Operation(summary = "Get guided journal prompts by category")
    public ResponseEntity<ApiResponse<List<String>>> getPrompts(@RequestParam(defaultValue = "general") String category) {
        List<String> prompts = recommendationService.getJournalPrompts(category);
        return ResponseEntity.ok(ApiResponse.success(prompts));
    }
}
