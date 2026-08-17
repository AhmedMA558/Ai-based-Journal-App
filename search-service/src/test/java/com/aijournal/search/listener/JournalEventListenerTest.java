package com.aijournal.search.listener;

import com.aijournal.common.event.JournalCreatedEvent;
import com.aijournal.common.event.JournalDeletedEvent;
import com.aijournal.common.event.JournalUpdatedEvent;
import com.aijournal.search.document.JournalDocument;
import com.aijournal.search.repository.JournalSearchRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JournalEventListenerTest {

    @Mock
    private JournalSearchRepository journalSearchRepository;

    @InjectMocks
    private JournalEventListener listener;

    @Test
    void handleJournalCreated_UsesRealMoodAndTagsFromEvent_NotHardcodedNeutral() {
        // Regression guard: mood/tags used to be entirely absent from this
        // event, so every indexed document was hardcoded to NEUTRAL/[]
        // regardless of the journal's real mood/tags - mood/tag search
        // filters returned zero results, always.
        JournalCreatedEvent event = new JournalCreatedEvent(1L, 2L, "Title", "Content", "EXCITED", List.of("travel", "gratitude"), "Home", "Sunny", LocalDateTime.now());

        listener.handleJournalCreated(event);

        ArgumentCaptor<JournalDocument> captor = ArgumentCaptor.forClass(JournalDocument.class);
        verify(journalSearchRepository).save(captor.capture());
        assertThat(captor.getValue().getJournalId()).isEqualTo(1L);
        assertThat(captor.getValue().getTitle()).isEqualTo("Title");
        assertThat(captor.getValue().getMood()).isEqualTo("EXCITED");
        assertThat(captor.getValue().getTags()).containsExactly("travel", "gratitude");
    }

    @Test
    void handleJournalCreated_NullMoodAndTagsOnEvent_FallsBackToNeutralAndEmpty() {
        // Defensive fallback only - a real journal-service-published event
        // always carries real values now, but a null-safe default is still
        // worth keeping rather than NPEing on a malformed/legacy message.
        JournalCreatedEvent event = new JournalCreatedEvent(1L, 2L, "Title", "Content", null, null, "Home", "Sunny", LocalDateTime.now());

        listener.handleJournalCreated(event);

        ArgumentCaptor<JournalDocument> captor = ArgumentCaptor.forClass(JournalDocument.class);
        verify(journalSearchRepository).save(captor.capture());
        assertThat(captor.getValue().getMood()).isEqualTo("NEUTRAL");
        assertThat(captor.getValue().getTags()).isEmpty();
    }

    @Test
    void handleJournalCreated_RepositoryThrows_ExceptionIsSwallowed() {
        JournalCreatedEvent event = new JournalCreatedEvent(1L, 2L, "Title", "Content", null, null, null, null, LocalDateTime.now());
        doThrow(new RuntimeException("ES down")).when(journalSearchRepository).save(any());

        assertThatCode(() -> listener.handleJournalCreated(event)).doesNotThrowAnyException();
    }

    @Test
    void handleJournalUpdated_ExistingDocument_MergesTitleContentMoodAndTagsFromEvent() {
        // Regression guard: the update handler previously never touched
        // mood/tags at all, so an existing indexed document's mood/tags
        // could never change even once a journal's real mood/tags did.
        JournalDocument existing = new JournalDocument("1", 1L, 2L, "Old Title", "Old Content", "HAPPY", List.of("travel"), "2024-01-01T00:00:00");
        when(journalSearchRepository.findById("1")).thenReturn(Optional.of(existing));
        JournalUpdatedEvent event = new JournalUpdatedEvent(1L, 2L, "New Title", "New Content", "SAD", List.of("work"), LocalDateTime.now());

        listener.handleJournalUpdated(event);

        ArgumentCaptor<JournalDocument> captor = ArgumentCaptor.forClass(JournalDocument.class);
        verify(journalSearchRepository).save(captor.capture());
        assertThat(captor.getValue().getTitle()).isEqualTo("New Title");
        assertThat(captor.getValue().getContent()).isEqualTo("New Content");
        assertThat(captor.getValue().getMood()).isEqualTo("SAD");
        assertThat(captor.getValue().getTags()).containsExactly("work");
    }

    @Test
    void handleJournalUpdated_NoExistingDocument_FindOrCreatesWithRealMoodAndTags() {
        when(journalSearchRepository.findById("5")).thenReturn(Optional.empty());
        JournalUpdatedEvent event = new JournalUpdatedEvent(5L, 2L, "Title", "Content", "CALM", List.of("meditation"), LocalDateTime.now());

        listener.handleJournalUpdated(event);

        ArgumentCaptor<JournalDocument> captor = ArgumentCaptor.forClass(JournalDocument.class);
        verify(journalSearchRepository).save(captor.capture());
        assertThat(captor.getValue().getJournalId()).isEqualTo(5L);
        assertThat(captor.getValue().getTitle()).isEqualTo("Title");
        assertThat(captor.getValue().getMood()).isEqualTo("CALM");
        assertThat(captor.getValue().getTags()).containsExactly("meditation");
    }

    @Test
    void handleJournalUpdated_RepositoryThrows_ExceptionIsSwallowed() {
        when(journalSearchRepository.findById(eq("1"))).thenThrow(new RuntimeException("ES down"));
        JournalUpdatedEvent event = new JournalUpdatedEvent(1L, 2L, "Title", "Content", null, null, LocalDateTime.now());

        assertThatCode(() -> listener.handleJournalUpdated(event)).doesNotThrowAnyException();
    }

    @Test
    void handleJournalDeleted_ExistingDocument_RemovesItFromIndex() {
        // Regression guard for the bug this listener exists to fix: a
        // deleted (soft- or permanently-) journal previously stayed fully
        // searchable forever, since nothing ever removed it from the index.
        JournalDocument existing = new JournalDocument("1", 1L, 2L, "Title", "Content", "HAPPY", List.of(), "2024-01-01T00:00:00");
        when(journalSearchRepository.findById("1")).thenReturn(Optional.of(existing));
        JournalDeletedEvent event = new JournalDeletedEvent(1L, 2L);

        listener.handleJournalDeleted(event);

        verify(journalSearchRepository).delete(existing);
    }

    @Test
    void handleJournalDeleted_NoExistingDocument_NoOp() {
        when(journalSearchRepository.findById("99")).thenReturn(Optional.empty());
        JournalDeletedEvent event = new JournalDeletedEvent(99L, 2L);

        assertThatCode(() -> listener.handleJournalDeleted(event)).doesNotThrowAnyException();
        verify(journalSearchRepository, never()).delete(any(JournalDocument.class));
    }

    @Test
    void handleJournalDeleted_RepositoryThrows_ExceptionIsSwallowed() {
        when(journalSearchRepository.findById(eq("1"))).thenThrow(new RuntimeException("ES down"));
        JournalDeletedEvent event = new JournalDeletedEvent(1L, 2L);

        assertThatCode(() -> listener.handleJournalDeleted(event)).doesNotThrowAnyException();
    }
}
