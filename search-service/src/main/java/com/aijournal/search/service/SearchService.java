package com.aijournal.search.service;

import com.aijournal.common.dto.PagedResponse;
import com.aijournal.search.document.JournalDocument;

public interface SearchService {
    PagedResponse<JournalDocument> searchJournals(Long userId, String query, String mood, String tag, String category, int page, int size);
    PagedResponse<JournalDocument> semanticSearch(Long userId, String naturalQuery, int page, int size);
}
