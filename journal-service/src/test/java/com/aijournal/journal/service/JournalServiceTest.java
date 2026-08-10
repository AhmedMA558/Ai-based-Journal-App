package com.aijournal.journal.service;

import com.aijournal.common.dto.PagedResponse;
import com.aijournal.common.event.JournalCreatedEvent;
import com.aijournal.common.event.JournalUpdatedEvent;
import com.aijournal.common.exception.ResourceNotFoundException;
import com.aijournal.common.messaging.JournalEventRouting;
import com.aijournal.journal.entity.Journal;
import com.aijournal.journal.repository.JournalRepository;
import com.aijournal.journal.service.impl.JournalServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JournalServiceTest {

    @Mock
    private JournalRepository journalRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private JournalServiceImpl journalService;

    private Journal existingJournal(Long id, Long userId) {
        Journal journal = new Journal();
        journal.setId(id);
        journal.setUserId(userId);
        journal.setTitle("Existing");
        journal.setContent("existing content");
        journal.setMood("HAPPY");
        journal.setTags(new HashSet<>());
        journal.setIsPinned(false);
        journal.setIsFavorite(false);
        journal.setIsArchived(false);
        return journal;
    }

    @BeforeEach
    void stubSaveReturnsArgument() {
        lenient().when(journalRepository.save(any(Journal.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createJournal_BlankTitle_DefaultsToUntitled() {
        Journal input = new Journal();
        input.setTitle("  ");
        input.setContent("some content");

        Journal created = journalService.createJournal(1L, input);

        assertThat(created.getTitle()).isEqualTo("Untitled Journal Entry");
    }

    @Test
    void createJournal_NullFields_AppliesAllDefaults() {
        // Journal's own field initializers already default content/tags/booleans, so this
        // exercises createJournal()'s null-guards on top of those (both should agree).
        Journal input = new Journal();

        Journal created = journalService.createJournal(5L, input);

        assertThat(created.getUserId()).isEqualTo(5L);
        assertThat(created.getContent()).isEqualTo("");
        assertThat(created.getTags()).isNotNull().isEmpty();
        assertThat(created.getIsDraft()).isFalse();
        assertThat(created.getIsPinned()).isFalse();
        assertThat(created.getIsFavorite()).isFalse();
        assertThat(created.getIsArchived()).isFalse();
        assertThat(created.getContentEncrypted()).isFalse();
    }

    @Test
    void createJournal_ExplicitNullMood_DefaultsToHappy() {
        // Journal's field initializer defaults mood to "NEUTRAL", so the service's own
        // null-guard only actually fires when a caller (e.g. JSON body with "mood": null)
        // explicitly nulls it out - this proves that guard is live, not dead code.
        Journal input = new Journal();
        input.setMood(null);

        Journal created = journalService.createJournal(5L, input);

        assertThat(created.getMood()).isEqualTo("HAPPY");
    }

    @Test
    void createJournal_MoodOmitted_RetainsEntityDefaultNeutral() {
        Journal input = new Journal();

        Journal created = journalService.createJournal(5L, input);

        assertThat(created.getMood()).isEqualTo("NEUTRAL");
    }

    @Test
    void createJournal_NullUserId_FallsBackToUserOne() {
        Journal input = new Journal();

        Journal created = journalService.createJournal(null, input);

        assertThat(created.getUserId()).isEqualTo(1L);
    }

    @Test
    void createJournal_Success_PublishesJournalCreatedEvent() {
        Journal input = new Journal();
        input.setTitle("My Entry");
        input.setContent("content");

        journalService.createJournal(9L, input);

        ArgumentCaptor<JournalCreatedEvent> captor = ArgumentCaptor.forClass(JournalCreatedEvent.class);
        verify(rabbitTemplate).convertAndSend(eq(JournalEventRouting.EXCHANGE_NAME), eq(JournalEventRouting.ROUTING_KEY_CREATED), captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(9L);
        assertThat(captor.getValue().getTitle()).isEqualTo("My Entry");
    }

    @Test
    void createJournal_BrokerThrows_ExceptionIsSwallowedAndJournalStillReturned() {
        doThrow(new RuntimeException("broker down")).when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(JournalCreatedEvent.class));
        Journal input = new Journal();
        input.setTitle("My Entry");
        input.setContent("content");

        Journal created = journalService.createJournal(1L, input);

        assertThat(created).isNotNull();
    }

    @Test
    void updateJournal_OwnedJournal_MergesFieldsAndPublishesEvent() {
        Journal existing = existingJournal(10L, 1L);
        when(journalRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));

        Journal updates = new Journal();
        updates.setTitle("New Title");
        updates.setContent("New Content");
        updates.setMood("SAD");
        updates.setTags(Set.of("tag1"));

        Journal result = journalService.updateJournal(1L, 10L, updates);

        assertThat(result.getTitle()).isEqualTo("New Title");
        assertThat(result.getContent()).isEqualTo("New Content");
        assertThat(result.getMood()).isEqualTo("SAD");
        assertThat(result.getTags()).containsExactly("tag1");
        verify(rabbitTemplate).convertAndSend(eq(JournalEventRouting.EXCHANGE_NAME), eq(JournalEventRouting.ROUTING_KEY_UPDATED), any(JournalUpdatedEvent.class));
    }

    @Test
    void updateJournal_NotOwnedByCaller_ThrowsResourceNotFoundException() {
        when(journalRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> journalService.updateJournal(2L, 10L, new Journal()))
                .isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(rabbitTemplate);
    }

    @Test
    void updateJournal_NullTags_DefaultsToEmptySet() {
        Journal existing = existingJournal(10L, 1L);
        when(journalRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        Journal updates = new Journal();
        updates.setTags(null);

        Journal result = journalService.updateJournal(1L, 10L, updates);

        assertThat(result.getTags()).isNotNull().isEmpty();
    }

    @Test
    void getJournalById_NotFound_ThrowsResourceNotFoundException() {
        when(journalRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> journalService.getJournalById(1L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getUserJournals_DelegatesToArchivedFalseFinder() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Journal> page = new PageImpl<>(List.of(existingJournal(1L, 1L)), pageable, 1);
        when(journalRepository.findByUserIdAndIsArchivedFalse(1L, pageable)).thenReturn(page);

        PagedResponse<Journal> response = journalService.getUserJournals(1L, pageable);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getTotalElements()).isEqualTo(1);
    }

    @Test
    void togglePin_FlipsCurrentValue() {
        Journal existing = existingJournal(1L, 1L);
        existing.setIsPinned(false);
        when(journalRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(existing));

        Journal result = journalService.togglePin(1L, 1L);

        assertThat(result.getIsPinned()).isTrue();
    }

    @Test
    void toggleFavorite_FlipsCurrentValue() {
        Journal existing = existingJournal(1L, 1L);
        existing.setIsFavorite(true);
        when(journalRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(existing));

        Journal result = journalService.toggleFavorite(1L, 1L);

        assertThat(result.getIsFavorite()).isFalse();
    }

    @Test
    void toggleArchive_FlipsCurrentValue() {
        Journal existing = existingJournal(1L, 1L);
        existing.setIsArchived(false);
        when(journalRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(existing));

        Journal result = journalService.toggleArchive(1L, 1L);

        assertThat(result.getIsArchived()).isTrue();
    }

    @Test
    void softDeleteJournal_OwnedJournal_DeletesIt() {
        Journal existing = existingJournal(1L, 1L);
        when(journalRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(existing));

        journalService.softDeleteJournal(1L, 1L);

        verify(journalRepository).delete(existing);
    }

    @Test
    void permanentDeleteJournal_NotOwnedByCaller_ThrowsAndDoesNotDelete() {
        when(journalRepository.findByIdAndUserId(1L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> journalService.permanentDeleteJournal(2L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(journalRepository, never()).delete(any(Journal.class));
        verify(journalRepository, never()).deleteById(any(Long.class));
    }

    @Test
    void permanentDeleteJournal_OwnedByCaller_DeletesIt() {
        Journal existing = existingJournal(1L, 1L);
        when(journalRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(existing));

        journalService.permanentDeleteJournal(1L, 1L);

        verify(journalRepository).delete(existing);
    }
}
