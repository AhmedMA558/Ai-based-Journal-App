package com.aijournal.search.service;

import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import com.aijournal.common.dto.PagedResponse;
import com.aijournal.search.document.JournalDocument;
import com.aijournal.search.service.impl.SearchServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private ElasticsearchOperations elasticsearchOperations;

    @SuppressWarnings("unchecked")
    private SearchHits<JournalDocument> emptyHitsWithTotal(long total) {
        SearchHits<JournalDocument> hits = mock(SearchHits.class);
        when(hits.getSearchHits()).thenReturn(List.of());
        when(hits.getTotalHits()).thenReturn(total);
        return hits;
    }

    private void stubSearch(ArgumentCaptor<NativeQuery> captor, long total) {
        SearchHits<JournalDocument> hits = emptyHitsWithTotal(total);
        when(elasticsearchOperations.search(captor.capture(), eq(JournalDocument.class))).thenReturn(hits);
    }

    private void stubSearchAnyQuery(long total) {
        SearchHits<JournalDocument> hits = emptyHitsWithTotal(total);
        when(elasticsearchOperations.search(any(NativeQuery.class), eq(JournalDocument.class))).thenReturn(hits);
    }

    @Test
    void searchJournals_UserIdOnly_BuildsSingleMustClause() {
        SearchServiceImpl service = new SearchServiceImpl(elasticsearchOperations);
        ArgumentCaptor<NativeQuery> captor = ArgumentCaptor.forClass(NativeQuery.class);
        stubSearch(captor, 0);

        service.searchJournals(1L, null, null, null, null, 0, 10);

        Query combined = captor.getValue().getQuery();
        assertThat(combined.bool().must()).hasSize(1);
    }

    @Test
    void searchJournals_QueryOnly_AddsTitleOrContentMatchClause() {
        SearchServiceImpl service = new SearchServiceImpl(elasticsearchOperations);
        ArgumentCaptor<NativeQuery> captor = ArgumentCaptor.forClass(NativeQuery.class);
        stubSearch(captor, 0);

        service.searchJournals(1L, "vacation", null, null, null, 0, 10);

        Query combined = captor.getValue().getQuery();
        assertThat(combined.bool().must()).hasSize(2);
    }

    @Test
    void searchJournals_AllFilters_BuildsFourMustClauses() {
        SearchServiceImpl service = new SearchServiceImpl(elasticsearchOperations);
        ArgumentCaptor<NativeQuery> captor = ArgumentCaptor.forClass(NativeQuery.class);
        stubSearch(captor, 0);

        service.searchJournals(1L, "vacation", "happy", "travel", "ignored-category", 0, 10);

        Query combined = captor.getValue().getQuery();
        assertThat(combined.bool().must()).hasSize(4);
    }

    @Test
    void searchJournals_MoodFilter_IsUppercased() {
        SearchServiceImpl service = new SearchServiceImpl(elasticsearchOperations);
        ArgumentCaptor<NativeQuery> captor = ArgumentCaptor.forClass(NativeQuery.class);
        stubSearch(captor, 0);

        service.searchJournals(1L, null, "happy", null, null, 0, 10);

        Query combined = captor.getValue().getQuery();
        Query moodClause = combined.bool().must().get(1);
        assertThat(moodClause.term().value().stringValue()).isEqualTo("HAPPY");
    }

    @Test
    void semanticSearch_BuildsUserIdAndTextMatchOnly() {
        SearchServiceImpl service = new SearchServiceImpl(elasticsearchOperations);
        ArgumentCaptor<NativeQuery> captor = ArgumentCaptor.forClass(NativeQuery.class);
        stubSearch(captor, 0);

        service.semanticSearch(1L, "beach trip", 0, 10);

        Query combined = captor.getValue().getQuery();
        assertThat(combined.bool().must()).hasSize(2);
    }

    @Test
    void executeSearch_MiddlePage_ComputesTotalPagesAndNeitherFirstNorLast() {
        SearchServiceImpl service = new SearchServiceImpl(elasticsearchOperations);
        stubSearchAnyQuery(25);

        PagedResponse<JournalDocument> response = service.searchJournals(1L, null, null, null, null, 1, 10);

        assertThat(response.getTotalPages()).isEqualTo(3);
        assertThat(response.isFirst()).isFalse();
        assertThat(response.isLast()).isFalse();
    }

    @Test
    void executeSearch_LastPage_IsLastTrue() {
        SearchServiceImpl service = new SearchServiceImpl(elasticsearchOperations);
        stubSearchAnyQuery(25);

        PagedResponse<JournalDocument> response = service.searchJournals(1L, null, null, null, null, 2, 10);

        assertThat(response.isLast()).isTrue();
    }

    @Test
    void executeSearch_NoResults_ZeroTotalPagesAndBothFirstAndLast() {
        SearchServiceImpl service = new SearchServiceImpl(elasticsearchOperations);
        stubSearchAnyQuery(0);

        PagedResponse<JournalDocument> response = service.searchJournals(1L, null, null, null, null, 0, 10);

        assertThat(response.getTotalPages()).isEqualTo(0);
        assertThat(response.isFirst()).isTrue();
        assertThat(response.isLast()).isTrue();
    }
}
