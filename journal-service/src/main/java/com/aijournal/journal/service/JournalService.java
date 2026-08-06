package com.aijournal.journal.service;

import com.aijournal.common.dto.PagedResponse;
import com.aijournal.journal.entity.Journal;
import org.springframework.data.domain.Pageable;

public interface JournalService {
    Journal createJournal(Long userId, Journal journal);
    Journal updateJournal(Long userId, Long journalId, Journal journal);
    Journal getJournalById(Long userId, Long journalId);
    PagedResponse<Journal> getUserJournals(Long userId, Pageable pageable);
    PagedResponse<Journal> getPinnedJournals(Long userId, Pageable pageable);
    PagedResponse<Journal> getFavoriteJournals(Long userId, Pageable pageable);
    PagedResponse<Journal> getArchivedJournals(Long userId, Pageable pageable);
    Journal togglePin(Long userId, Long journalId);
    Journal toggleFavorite(Long userId, Long journalId);
    Journal toggleArchive(Long userId, Long journalId);
    void softDeleteJournal(Long userId, Long journalId);
    void permanentDeleteJournal(Long userId, Long journalId);
}
