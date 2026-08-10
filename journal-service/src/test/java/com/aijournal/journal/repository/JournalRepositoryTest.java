package com.aijournal.journal.repository;

import com.aijournal.journal.entity.Journal;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class JournalRepositoryTest {

    @Container
    @ServiceConnection
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0");

    @DynamicPropertySource
    static void flywayProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @org.springframework.beans.factory.annotation.Autowired
    private JournalRepository journalRepository;

    private Journal newJournal(Long userId, boolean pinned, boolean favorite, boolean archived) {
        Journal journal = new Journal();
        journal.setUserId(userId);
        journal.setTitle("Title");
        journal.setContent("Some real content persisted through Flyway-migrated MySQL");
        journal.setIsPinned(pinned);
        journal.setIsFavorite(favorite);
        journal.setIsArchived(archived);
        return journalRepository.save(journal);
    }

    @Test
    void save_PopulatesComputedMetricsAndTimestamps() {
        Journal saved = newJournal(1L, false, false, false);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getWordCount()).isGreaterThan(0);
        assertThat(saved.getCharacterCount()).isGreaterThan(0);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void findByUserIdAndIsArchivedFalse_ExcludesArchivedEntries() {
        newJournal(2L, false, false, false);
        newJournal(2L, false, false, true);

        var page = journalRepository.findByUserIdAndIsArchivedFalse(2L, PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getIsArchived()).isFalse();
    }

    @Test
    void findByUserIdAndIsArchivedTrue_OnlyReturnsArchivedEntries() {
        newJournal(3L, false, false, false);
        Journal archived = newJournal(3L, false, false, true);

        var page = journalRepository.findByUserIdAndIsArchivedTrue(3L, PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(Journal::getId).containsExactly(archived.getId());
    }

    @Test
    void findByUserIdAndIsPinnedTrue_OnlyReturnsPinnedEntries() {
        Journal pinned = newJournal(4L, true, false, false);
        newJournal(4L, false, false, false);

        var page = journalRepository.findByUserIdAndIsPinnedTrue(4L, PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(Journal::getId).containsExactly(pinned.getId());
    }

    @Test
    void findByUserIdAndIsFavoriteTrue_OnlyReturnsFavoriteEntries() {
        Journal favorite = newJournal(5L, false, true, false);
        newJournal(5L, false, false, false);

        var page = journalRepository.findByUserIdAndIsFavoriteTrue(5L, PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(Journal::getId).containsExactly(favorite.getId());
    }

    @Test
    void findByIdAndUserId_WrongUser_ReturnsEmpty() {
        Journal journal = newJournal(6L, false, false, false);

        Optional<Journal> result = journalRepository.findByIdAndUserId(journal.getId(), 999L);

        assertThat(result).isEmpty();
    }

    @Test
    void findByIdAndUserId_CorrectOwner_ReturnsJournal() {
        Journal journal = newJournal(7L, false, false, false);

        Optional<Journal> result = journalRepository.findByIdAndUserId(journal.getId(), 7L);

        assertThat(result).isPresent();
        assertThat(result.get().getUserId()).isEqualTo(7L);
    }
}
