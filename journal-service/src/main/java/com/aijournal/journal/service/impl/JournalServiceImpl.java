package com.aijournal.journal.service.impl;

import com.aijournal.common.dto.PagedResponse;
import com.aijournal.common.event.JournalCreatedEvent;
import com.aijournal.common.event.JournalUpdatedEvent;
import com.aijournal.common.exception.ResourceNotFoundException;
import com.aijournal.journal.entity.Journal;
import com.aijournal.journal.repository.JournalRepository;
import com.aijournal.journal.service.JournalService;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class JournalServiceImpl implements JournalService {

    private final JournalRepository journalRepository;
    private final RabbitTemplate rabbitTemplate;

    public static final String EXCHANGE_NAME = "journal.exchange";
    public static final String ROUTING_KEY_CREATED = "journal.created";
    public static final String ROUTING_KEY_UPDATED = "journal.updated";

    public JournalServiceImpl(JournalRepository journalRepository, RabbitTemplate rabbitTemplate) {
        this.journalRepository = journalRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    @Transactional
    public Journal createJournal(Long userId, Journal journal) {
        journal.setUserId(userId);
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
            rabbitTemplate.convertAndSend(EXCHANGE_NAME, ROUTING_KEY_CREATED, event);
        } catch (Exception e) {
            // Log fallback if RabbitMQ broker is offline in local test
        }

        return saved;
    }

    @Override
    @Transactional
    public Journal updateJournal(Long userId, Long journalId, Journal updated) {
        Journal existing = getJournalById(userId, journalId);
        existing.setTitle(updated.getTitle());
        existing.setContent(updated.getContent());
        existing.setMood(updated.getMood());
        existing.setLocation(updated.getLocation());
        existing.setWeather(updated.getWeather());
        existing.setTags(updated.getTags());
        existing.setIsDraft(updated.getIsDraft());
        existing.setFolderId(updated.getFolderId());
        existing.setCategoryId(updated.getCategoryId());

        Journal saved = journalRepository.save(existing);

        try {
            JournalUpdatedEvent event = new JournalUpdatedEvent(
                    saved.getId(),
                    saved.getUserId(),
                    saved.getTitle(),
                    saved.getContent(),
                    LocalDateTime.now()
            );
            rabbitTemplate.convertAndSend(EXCHANGE_NAME, ROUTING_KEY_UPDATED, event);
        } catch (Exception e) {
            // Log fallback
        }

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Journal getJournalById(Long userId, Long journalId) {
        return journalRepository.findByIdAndUserId(journalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Journal", "id", journalId));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<Journal> getUserJournals(Long userId, Pageable pageable) {
        Page<Journal> page = journalRepository.findByUserIdAndIsArchivedFalse(userId, pageable);
        return toPagedResponse(page);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<Journal> getPinnedJournals(Long userId, Pageable pageable) {
        Page<Journal> page = journalRepository.findByUserIdAndIsPinnedTrue(userId, pageable);
        return toPagedResponse(page);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<Journal> getFavoriteJournals(Long userId, Pageable pageable) {
        Page<Journal> page = journalRepository.findByUserIdAndIsFavoriteTrue(userId, pageable);
        return toPagedResponse(page);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<Journal> getArchivedJournals(Long userId, Pageable pageable) {
        Page<Journal> page = journalRepository.findByUserIdAndIsArchivedTrue(userId, pageable);
        return toPagedResponse(page);
    }

    @Override
    @Transactional
    public Journal togglePin(Long userId, Long journalId) {
        Journal journal = getJournalById(userId, journalId);
        journal.setIsPinned(!journal.getIsPinned());
        return journalRepository.save(journal);
    }

    @Override
    @Transactional
    public Journal toggleFavorite(Long userId, Long journalId) {
        Journal journal = getJournalById(userId, journalId);
        journal.setIsFavorite(!journal.getIsFavorite());
        return journalRepository.save(journal);
    }

    @Override
    @Transactional
    public Journal toggleArchive(Long userId, Long journalId) {
        Journal journal = getJournalById(userId, journalId);
        journal.setIsArchived(!journal.getIsArchived());
        return journalRepository.save(journal);
    }

    @Override
    @Transactional
    public void softDeleteJournal(Long userId, Long journalId) {
        Journal journal = getJournalById(userId, journalId);
        journalRepository.delete(journal);
    }

    @Override
    @Transactional
    public void permanentDeleteJournal(Long userId, Long journalId) {
        journalRepository.deleteById(journalId);
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
