package com.aijournal.search.service.impl;

import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import com.aijournal.common.dto.PagedResponse;
import com.aijournal.search.document.JournalDocument;
import com.aijournal.search.service.SearchService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SearchServiceImpl implements SearchService {

    private final ElasticsearchOperations elasticsearchOperations;

    public SearchServiceImpl(ElasticsearchOperations elasticsearchOperations) {
        this.elasticsearchOperations = elasticsearchOperations;
    }

    @Override
    public PagedResponse<JournalDocument> searchJournals(Long userId, String query, String mood, String tag, String category, int page, int size) {
        // `category` is accepted for API compatibility but currently unsupported -
        // JournalDocument's index schema has no category field, and adding one is a
        // data-model change out of scope for wiring up search.
        List<Query> filters = new ArrayList<>();
        filters.add(userIdFilter(userId));

        if (query != null && !query.isBlank()) {
            filters.add(titleOrContentMatch(query));
        }
        if (mood != null && !mood.isBlank()) {
            filters.add(termFilter("mood", mood.toUpperCase()));
        }
        if (tag != null && !tag.isBlank()) {
            filters.add(termFilter("tags", tag));
        }

        return executeSearch(filters, page, size);
    }

    @Override
    public PagedResponse<JournalDocument> semanticSearch(Long userId, String naturalQuery, int page, int size) {
        // "Semantic" here means relevance-ranked full-text search across title/content
        // (Elasticsearch's standard match-query scoring) - not ML-embeddings-based vector
        // search, which would need a dedicated embeddings pipeline to do properly.
        List<Query> filters = List.of(userIdFilter(userId), titleOrContentMatch(naturalQuery));
        return executeSearch(filters, page, size);
    }

    private Query userIdFilter(Long userId) {
        return Query.of(q -> q.term(t -> t.field("userId").value(userId)));
    }

    private Query termFilter(String field, String value) {
        return Query.of(q -> q.term(t -> t.field(field).value(value)));
    }

    // Every real boolean-logic combination (userId AND mood AND tag AND (title OR content))
    // needs the modern query_dsl Query builder, not the legacy Criteria API - Criteria
    // represents a flat AND/OR chain with no grouping/parentheses concept, so
    // `criteria.and(x.or(y))` does NOT produce "AND (x OR y)" the way its shape implies.
    private Query titleOrContentMatch(String text) {
        return Query.of(q -> q.bool(b -> b
                .should(s -> s.match(m -> m.field("title").query(text).boost(2f)))
                .should(s -> s.match(m -> m.field("content").query(text)))
                .minimumShouldMatch("1")
        ));
    }

    private PagedResponse<JournalDocument> executeSearch(List<Query> mustClauses, int page, int size) {
        Query combined = Query.of(q -> q.bool(b -> b.must(mustClauses)));

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(combined)
                .withPageable(PageRequest.of(page, size))
                .build();

        SearchHits<JournalDocument> hits = elasticsearchOperations.search(nativeQuery, JournalDocument.class);

        List<JournalDocument> content = hits.getSearchHits().stream().map(SearchHit::getContent).toList();
        long totalElements = hits.getTotalHits();
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        boolean isFirst = page == 0;
        boolean isLast = page >= totalPages - 1;

        return new PagedResponse<>(content, page, size, totalElements, totalPages, isLast, isFirst);
    }
}
