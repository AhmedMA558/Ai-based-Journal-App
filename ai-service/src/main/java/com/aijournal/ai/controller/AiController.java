package com.aijournal.ai.controller;

import com.aijournal.ai.entity.MoodHistory;
import com.aijournal.ai.service.AiService;
import com.aijournal.ai.strategy.AiProviderStrategy.*;
import com.aijournal.common.dto.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI Features API", description = "Summaries, Mood Detection with Emojis, Recommendations, Auto-Tags, and AI Chat")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/summarize")
    @Operation(summary = "Generate Short, Detailed, and Bullet Journal Summaries")
    public ResponseEntity<ApiResponse<SummaryResult>> summarize(@RequestBody Map<String, String> request) {
        SummaryResult result = aiService.summarizeJournal(request.get("content"));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/mood")
    @Operation(summary = "Detect Mood (Happy, Sad, Anxious, Angry, Stress, etc.) with Confidence Score and Emoji")
    public ResponseEntity<ApiResponse<MoodResult>> detectMood(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(required = false) Long journalId,
            @RequestBody Map<String, String> request) {
        Long uid = userId != null ? userId : 1L;
        MoodResult result = aiService.detectAndSaveMood(uid, journalId != null ? journalId : 0L, request.get("content"));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/emotion-timeline")
    @Operation(summary = "Get Weekly, Monthly, or Yearly Emotional Analytics Timeline")
    public ResponseEntity<ApiResponse<List<MoodHistory>>> getEmotionTimeline(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(defaultValue = "weekly") String period) {
        Long uid = userId != null ? userId : 1L;
        List<MoodHistory> timeline = aiService.getEmotionTimeline(uid, period);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }

    @PostMapping("/recommendations")
    @Operation(summary = "Generate Context-Aware AI Recommendations (Walk, Meditate, Sleep early, etc.)")
    public ResponseEntity<ApiResponse<List<String>>> getRecommendations(@RequestBody Map<String, String> request) {
        List<String> recommendations = aiService.getRecommendations(request.get("content"), request.getOrDefault("mood", "NEUTRAL"));
        return ResponseEntity.ok(ApiResponse.success(recommendations));
    }

    @PostMapping("/tags")
    @Operation(summary = "Auto-Generate Journal Tags (#career, #health, #family, etc.)")
    public ResponseEntity<ApiResponse<List<String>>> generateTags(@RequestBody Map<String, String> request) {
        List<String> tags = aiService.generateTags(request.get("content"));
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @PostMapping("/chat")
    @Operation(summary = "Chat with your Journal History (RAG / AI Memory)")
    public ResponseEntity<ApiResponse<String>> chatWithJournal(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody Map<String, String> request) {
        Long uid = userId != null ? userId : 1L;
        String answer = aiService.chatWithJournal(uid, request.get("query"), request.getOrDefault("context", ""), authorizationHeader);
        return ResponseEntity.ok(ApiResponse.success("AI Response generated", answer));
    }

    @PostMapping("/rephrase")
    @Operation(summary = "Rephrase Journal Text via AI")
    public ResponseEntity<ApiResponse<RephraseResult>> rephrase(@RequestBody Map<String, String> request) {
        RephraseResult result = aiService.rephrase(request.get("content"));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/grammar")
    @Operation(summary = "Fix Grammar & Spelling via AI")
    public ResponseEntity<ApiResponse<GrammarResult>> fixGrammar(@RequestBody Map<String, String> request) {
        GrammarResult result = aiService.fixGrammar(request.get("content"));
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
