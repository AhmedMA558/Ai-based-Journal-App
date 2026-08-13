package com.aijournal.journal.service.impl;

import com.aijournal.common.dto.PagedResponse;
import com.aijournal.common.event.JournalCreatedEvent;
import com.aijournal.common.event.JournalUpdatedEvent;
import com.aijournal.common.exception.ResourceNotFoundException;
import com.aijournal.common.messaging.JournalEventRouting;
import com.aijournal.journal.entity.Journal;
import com.aijournal.journal.repository.JournalRepository;
import com.aijournal.journal.service.JournalEncryptionService;
import com.aijournal.journal.service.JournalService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
    private final JournalEncryptionService journalEncryptionService;

    @PersistenceContext
    private EntityManager entityManager;

    public JournalServiceImpl(JournalRepository journalRepository, RabbitTemplate rabbitTemplate,
                               JournalEncryptionService journalEncryptionService) {
        this.journalRepository = journalRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.journalEncryptionService = journalEncryptionService;
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
        // Compute word/char/reading-time metrics from the real plaintext
        // before encrypting - calculateMetrics() is a no-op once
        // contentEncrypted is true, so this must happen first or the
        // lifecycle-triggered recompute at flush time would silently skip it.
        journal.calculateMetrics();
        journal.setContent(journalEncryptionService.encrypt(journal.getContent()));
        journal.setContentEncrypted(true);

        Journal saved = persistAndDecrypt(journalRepository.save(journal));

        // Async event dispatch to RabbitMQ for AI Service & Search Service.
        // Built from `saved` AFTER persistAndDecrypt(), so the event (and the
        // Elasticsearch index it feeds) carries real plaintext, not ciphertext.
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
        Journal existing = findOwnedJournal(activeUserId, journalId);
        existing.setTitle(updated.getTitle());
        // existing.contentEncrypted may already be true from a prior save -
        // force it false while the field briefly holds real plaintext so
        // calculateMetrics() actually recomputes instead of no-op'ing.
        existing.setContentEncrypted(false);
        existing.setContent(updated.getContent());
        existing.calculateMetrics();
        existing.setContent(journalEncryptionService.encrypt(updated.getContent()));
        existing.setContentEncrypted(true);
        existing.setMood(updated.getMood());
        existing.setLocation(updated.getLocation());
        existing.setWeather(updated.getWeather());
        existing.setTags(updated.getTags() != null ? updated.getTags() : new HashSet<>());
        if (updated.getIsDraft() != null) existing.setIsDraft(updated.getIsDraft());
        if (updated.getFolderId() != null) existing.setFolderId(updated.getFolderId());
        if (updated.getCategoryId() != null) existing.setCategoryId(updated.getCategoryId());

        Journal saved = persistAndDecrypt(journalRepository.save(existing));

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
        return decryptForRead(findOwnedJournal(activeUserId, journalId));
    }

    // Raw fetch, content left exactly as stored (ciphertext for encrypted rows).
    // Used by every internal mutation path so a subsequent save() never risks
    // persisting the decrypted-for-display content back over the ciphertext -
    // only getJournalById()/list reads route through decryptForRead().
    private Journal findOwnedJournal(Long activeUserId, Long journalId) {
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
        Journal journal = findOwnedJournal(activeUserId, journalId);
        journal.setIsPinned(!journal.getIsPinned());
        return persistAndDecrypt(journalRepository.save(journal));
    }

    @Override
    @Transactional
    public Journal toggleFavorite(Long userId, Long journalId) {
        Long activeUserId = userId != null ? userId : 1L;
        Journal journal = findOwnedJournal(activeUserId, journalId);
        journal.setIsFavorite(!journal.getIsFavorite());
        return persistAndDecrypt(journalRepository.save(journal));
    }

    @Override
    @Transactional
    public Journal toggleArchive(Long userId, Long journalId) {
        Long activeUserId = userId != null ? userId : 1L;
        Journal journal = findOwnedJournal(activeUserId, journalId);
        journal.setIsArchived(!journal.getIsArchived());
        return persistAndDecrypt(journalRepository.save(journal));
    }

    @Override
    @Transactional
    public void softDeleteJournal(Long userId, Long journalId) {
        Long activeUserId = userId != null ? userId : 1L;
        Journal journal = findOwnedJournal(activeUserId, journalId);
        journalRepository.delete(journal);
    }

    @Override
    @Transactional
    public void permanentDeleteJournal(Long userId, Long journalId) {
        Long activeUserId = userId != null ? userId : 1L;
        Journal journal = findOwnedJournal(activeUserId, journalId);
        journalRepository.delete(journal);
    }

    private PagedResponse<Journal> toPagedResponse(Page<Journal> page) {
        page.getContent().forEach(this::decryptForRead);
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

    // Write paths (create/update/toggle): the entity was just save()'d in the
    // current transaction, so its pending change must be flushed to the DB
    // *before* detaching - otherwise the encrypted content set on the entity
    // earlier in the method would still be sitting unflushed in the
    // persistence context, and detaching would just discard it.
    private Journal persistAndDecrypt(Journal managed) {
        entityManager.flush();
        entityManager.detach(managed);
        if (Boolean.TRUE.equals(managed.getContentEncrypted())) {
            managed.setContent(journalEncryptionService.decrypt(managed.getContent()));
        }
        return managed;
    }

    // Read paths: nothing was written this transaction, so no flush is
    // needed - but still detach before mutating, so correctness doesn't
    // depend on readOnly=true's FlushMode.MANUAL behavior.
    private Journal decryptForRead(Journal managed) {
        entityManager.detach(managed);
        if (Boolean.TRUE.equals(managed.getContentEncrypted())) {
            managed.setContent(journalEncryptionService.decrypt(managed.getContent()));
        }
        return managed;
    }
}
