package com.aijournal.search.controller;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.common.dto.PagedResponse;
import com.aijournal.search.document.JournalDocument;
import com.aijournal.search.service.SearchService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/search")
@Tag(name = "Search API", description = "Natural Language Smart Semantic Search & Multi-Filter Fulltext Search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    private Long resolveUserId(Long userId) {
        return (userId != null) ? userId : 1L;
    }

    @GetMapping
    @Operation(summary = "Search user-scoped journals with multi-filters (Date, Mood, Tags, Category)")
    public ResponseEntity<ApiResponse<PagedResponse<JournalDocument>>> search(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long activeUserId = resolveUserId(userId);
        PagedResponse<JournalDocument> response = searchService.searchJournals(activeUserId, query, mood, tag, category, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/semantic")
    @Operation(summary = "Natural Language Smart Semantic Search scoped to current user")
    public ResponseEntity<ApiResponse<PagedResponse<JournalDocument>>> semanticSearch(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long activeUserId = resolveUserId(userId);
        PagedResponse<JournalDocument> response = searchService.semanticSearch(activeUserId, query, page, size);
        return ResponseEntity.ok(ApiResponse.success("Semantic search results retrieved", response));
    }
}
