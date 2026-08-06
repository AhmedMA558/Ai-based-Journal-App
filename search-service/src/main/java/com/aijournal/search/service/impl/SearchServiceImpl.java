package com.aijournal.search.service.impl;

import com.aijournal.common.dto.PagedResponse;
import com.aijournal.search.service.SearchService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class SearchServiceImpl implements SearchService {

    @Override
    public PagedResponse<Map<String, Object>> searchJournals(Long userId, String query, String mood, String tag, String category, int page, int size) {
        Map<String, Object> mockResult = Map.of(
                "journalId", 101L,
                "title", "Great Day at Work & Park Walk",
                "snippet", "Today I felt extremely happy after finishing my project presentation...",
                "mood", mood != null ? mood : "Happy",
                "tags", List.of("#career", "#health"),
                "createdAt", LocalDateTime.now().toString()
        );
        return new PagedResponse<>(List.of(mockResult), page, size, 1L, 1, true, true);
    }

    @Override
    public PagedResponse<Map<String, Object>> semanticSearch(Long userId, String naturalQuery, int page, int size) {
        Map<String, Object> semanticMatch = Map.of(
                "journalId", 102L,
                "title", "Family Dinner and Father Insights",
                "snippet", "Had a long heart-to-heart conversation with my father regarding career advice...",
                "relevanceScore", 0.94,
                "matchedQuery", naturalQuery,
                "createdAt", LocalDateTime.now().minusDays(3).toString()
        );
        return new PagedResponse<>(List.of(semanticMatch), page, size, 1L, 1, true, true);
    }
}
