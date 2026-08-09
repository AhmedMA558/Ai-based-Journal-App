package com.aijournal.journal.service.impl;

import com.aijournal.common.dto.PagedResponse;
import com.aijournal.common.event.JournalCreatedEvent;
import com.aijournal.common.event.JournalUpdatedEvent;
import com.aijournal.common.exception.ResourceNotFoundException;
import com.aijournal.common.messaging.JournalEventRouting;
import com.aijournal.journal.entity.Journal;
import com.aijournal.journal.repository.JournalRepository;
import com.aijournal.journal.service.JournalService;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;

@Service
public class JournalServiceImpl implements JournalService {

    private final JournalRepository journalRepository;
    private final RabbitTemplate rabbitTemplate;

    public JournalServiceImpl(JournalRepository journalRepository, RabbitTemplate rabbitTemplate) {
        this.journalRepository = journalRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    @Transactional
    public Journal createJournal(Long userId, Journal journal) {
        journal.setUserId(userId != null ? userId : 1L);
        if (journal.getTitle() == null || journal.getTitle().isBlank()) {
            journal.setTitle("Untitled Journal Entry");
        }
        if (journal.getContent() == null) {
            journal.setContent("");
        }
        if (journal.getMood() == null) {
            journal.setMood("HAPPY");
        }
        if (journal.getTags() == null) {
            journal.setTags(new HashSet<>());
        }
        if (journal.getIsDraft() == null) journal.setIsDraft(false);
        if (journal.getIsPinned() == null) journal.setIsPinned(false);
        if (journal.getIsFavorite() == null) journal.setIsFavorite(false);
        if (journal.getIsArchived() == null) journal.setIsArchived(false);
        if (journal.getContentEncrypted() == null) journal.setContentEncrypted(false);

        Journal saved = journalRepository.save(journal);

        // Async event dispatch to RabbitMQ for AI Service & Search Service
        try {
            JournalCreatedEvent event = new JournalCreatedEvent(
                    saved.getId(),
                    saved.getUserId(),
                    saved.getTitle(),
                    saved.getContent(),
                    saved.getLocation(),
                    saved.getWeather(),
                    LocalDateTime.now()
            );
            rabbitTemplate.convertAndSend(JournalEventRouting.EXCHANGE_NAME, JournalEventRouting.ROUTING_KEY_CREATED, event);
        } catch (Exception e) {
            // Log fallback if RabbitMQ broker is offline
        }

        return saved;
    }

    @Override
    @Transactional
    public Journal updateJournal(Long userId, Long journalId, Journal updated) {
        Long activeUserId = userId != null ? userId : 1L;
        Journal existing = getJournalById(activeUserId, journalId);
        existing.setTitle(updated.getTitle());
        existing.setContent(updated.getContent());
        existing.setMood(updated.getMood());
        existing.setLocation(updated.getLocation());
        existing.setWeather(updated.getWeather());
        existing.setTags(updated.getTags() != null ? updated.getTags() : new HashSet<>());
        if (updated.getIsDraft() != null) existing.setIsDraft(updated.getIsDraft());
        if (updated.getFolderId() != null) existing.setFolderId(updated.getFolderId());
        if (updated.getCategoryId() != null) existing.setCategoryId(updated.getCategoryId());

        Journal saved = journalRepository.save(existing);

        try {
            JournalUpdatedEvent event = new JournalUpdatedEvent(
                    saved.getId(),
                    saved.getUserId(),
                    saved.getTitle(),
                    saved.getContent(),
                    LocalDateTime.now()
            );
            rabbitTemplate.convertAndSend(JournalEventRouting.EXCHANGE_NAME, JournalEventRouting.ROUTING_KEY_UPDATED, event);
        } catch (Exception e) {
            // Log fallback
        }

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Journal getJournalById(Long userId, Long journalId) {
        Long activeUserId = userId != null ? userId : 1L;
        return journalRepository.findByIdAndUserId(journalId, activeUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Journal", "id", journalId));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<Journal> getUserJournals(Long userId, Pageable pageable) {
        Long activeUserId = userId != null ? userId : 1L;
        Page<Journal> page = journalRepository.findByUserIdAndIsArchivedFalse(activeUserId, pageable);
        return toPagedResponse(page);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<Journal> getPinnedJournals(Long userId, Pageable pageable) {
        Long activeUserId = userId != null ? userId : 1L;
        Page<Journal> page = journalRepository.findByUserIdAndIsPinnedTrue(activeUserId, pageable);
        return toPagedResponse(page);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<Journal> getFavoriteJournals(Long userId, Pageable pageable) {
        Long activeUserId = userId != null ? userId : 1L;
        Page<Journal> page = journalRepository.findByUserIdAndIsFavoriteTrue(activeUserId, pageable);
        return toPagedResponse(page);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<Journal> getArchivedJournals(Long userId, Pageable pageable) {
        Long activeUserId = userId != null ? userId : 1L;
        Page<Journal> page = journalRepository.findByUserIdAndIsArchivedTrue(activeUserId, pageable);
        return toPagedResponse(page);
    }

    @Override
    @Transactional
    public Journal togglePin(Long userId, Long journalId) {
        Long activeUserId = userId != null ? userId : 1L;
        Journal journal = getJournalById(activeUserId, journalId);
        journal.setIsPinned(!journal.getIsPinned());
        return journalRepository.save(journal);
    }

    @Override
    @Transactional
    public Journal toggleFavorite(Long userId, Long journalId) {
        Long activeUserId = userId != null ? userId : 1L;
        Journal journal = getJournalById(activeUserId, journalId);
        journal.setIsFavorite(!journal.getIsFavorite());
        return journalRepository.save(journal);
    }

    @Override
    @Transactional
    public Journal toggleArchive(Long userId, Long journalId) {
        Long activeUserId = userId != null ? userId : 1L;
        Journal journal = getJournalById(activeUserId, journalId);
        journal.setIsArchived(!journal.getIsArchived());
        return journalRepository.save(journal);
    }

    @Override
    @Transactional
    public void softDeleteJournal(Long userId, Long journalId) {
        Long activeUserId = userId != null ? userId : 1L;
        Journal journal = getJournalById(activeUserId, journalId);
        journalRepository.delete(journal);
    }

    @Override
    @Transactional
    public void permanentDeleteJournal(Long userId, Long journalId) {
        Long activeUserId = userId != null ? userId : 1L;
        Journal journal = getJournalById(activeUserId, journalId);
        journalRepository.delete(journal);
    }

    private PagedResponse<Journal> toPagedResponse(Page<Journal> page) {
        return new PagedResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast(),
                page.isFirst()
        );
    }
}
