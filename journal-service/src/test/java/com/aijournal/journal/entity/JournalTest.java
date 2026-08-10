package com.aijournal.journal.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JournalTest {

    @Test
    void calculateMetrics_NormalContent_ComputesWordCharCountAndReadingTime() {
        Journal journal = new Journal();
        journal.setContent("one two three four five");

        journal.calculateMetrics();

        assertThat(journal.getWordCount()).isEqualTo(5);
        assertThat(journal.getCharacterCount()).isEqualTo(23);
        assertThat(journal.getReadingTimeMinutes()).isEqualTo(1);
    }

    @Test
    void calculateMetrics_BlankContent_ZeroWordCount() {
        Journal journal = new Journal();
        journal.setContent("   ");

        journal.calculateMetrics();

        assertThat(journal.getWordCount()).isEqualTo(0);
        assertThat(journal.getReadingTimeMinutes()).isEqualTo(1);
    }

    @Test
    void calculateMetrics_NullContent_DefaultsAllMetricsToZeroOrMinimum() {
        Journal journal = new Journal();
        journal.setContent(null);

        journal.calculateMetrics();

        assertThat(journal.getWordCount()).isEqualTo(0);
        assertThat(journal.getCharacterCount()).isEqualTo(0);
        assertThat(journal.getReadingTimeMinutes()).isEqualTo(1);
    }

    @Test
    void calculateMetrics_LongContent_ReadingTimeRoundsUpPer200Words() {
        Journal journal = new Journal();
        String content = String.join(" ", java.util.Collections.nCopies(450, "word"));
        journal.setContent(content);

        journal.calculateMetrics();

        assertThat(journal.getWordCount()).isEqualTo(450);
        assertThat(journal.getReadingTimeMinutes()).isEqualTo(3);
    }

    @Test
    void constructor_NullMoodAndTags_DefaultsToNeutralAndEmptySet() {
        Journal journal = new Journal(null, 1L, null, null, "Title", "content",
                null, null, null, null, null, null, null, null, null);

        assertThat(journal.getMood()).isEqualTo("NEUTRAL");
        assertThat(journal.getTags()).isEmpty();
        assertThat(journal.getContentEncrypted()).isFalse();
        assertThat(journal.getIsDraft()).isFalse();
    }
}
