package com.aijournal.search.controller;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.common.dto.PagedResponse;
import com.aijournal.search.service.SearchService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
@Tag(name = "Search API", description = "Natural Language Smart Semantic Search & Multi-Filter Fulltext Search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    @Operation(summary = "Search journals with multi-filters (Date, Mood, Tags, Category)")
    public ResponseEntity<ApiResponse<PagedResponse<Map<String, Object>>>> search(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<Map<String, Object>> response = searchService.searchJournals(userId, query, mood, tag, category, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/semantic")
    @Operation(summary = "Natural Language Smart Semantic Search ('Show entries where I was happy', 'When did I talk about my father?')")
    public ResponseEntity<ApiResponse<PagedResponse<Map<String, Object>>>> semanticSearch(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<Map<String, Object>> response = searchService.semanticSearch(userId, query, page, size);
        return ResponseEntity.ok(ApiResponse.success("Semantic search results retrieved", response));
    }
}
