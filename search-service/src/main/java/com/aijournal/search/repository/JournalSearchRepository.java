package com.aijournal.search.repository;

import com.aijournal.search.document.JournalDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalSearchRepository extends ElasticsearchRepository<JournalDocument, String> {

    List<JournalDocument> findByUserIdAndTitleContainingOrContentContaining(Long userId, String titleQuery, String contentQuery);

    List<JournalDocument> findByUserIdAndMood(Long userId, String mood);
}
