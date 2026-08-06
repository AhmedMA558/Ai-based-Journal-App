package com.aijournal.search.service;

import com.aijournal.common.dto.PagedResponse;

import java.util.Map;

public interface SearchService {
    PagedResponse<Map<String, Object>> searchJournals(Long userId, String query, String mood, String tag, String category, int page, int size);
    PagedResponse<Map<String, Object>> semanticSearch(Long userId, String naturalQuery, int page, int size);
}
