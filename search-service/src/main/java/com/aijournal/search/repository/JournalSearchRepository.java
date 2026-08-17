package com.aijournal.search.repository;

import com.aijournal.search.document.JournalDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JournalSearchRepository extends ElasticsearchRepository<JournalDocument, String> {
}
