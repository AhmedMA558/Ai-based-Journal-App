package com.aijournal.journal.entity;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class JournalTest {

    private static final Validator VALIDATOR;
    static {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            VALIDATOR = factory.getValidator();
        }
    }

    @Test
    void validation_ContentOverMaxLength_RejectedWithConstraintViolation() {
        // Previously nothing capped this field's size at all beyond the LONGTEXT
        // column's own ~4GB limit - a single request could submit an arbitrarily
        // large entry and have it fully AES-GCM encrypted, published to
        // RabbitMQ, and indexed into Elasticsearch with no bound.
        Journal journal = new Journal();
        journal.setTitle("Title");
        journal.setContent("x".repeat(100_001));

        Set<ConstraintViolation<Journal>> violations = VALIDATOR.validate(journal);

        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("content"));
    }

    @Test
    void validation_ContentAtMaxLength_NoViolation() {
        Journal journal = new Journal();
        journal.setTitle("Title");
        journal.setContent("x".repeat(100_000));

        Set<ConstraintViolation<Journal>> violations = VALIDATOR.validate(journal);

        assertThat(violations).noneMatch(v -> v.getPropertyPath().toString().equals("content"));
    }

    @Test
    void validation_TitleOverMaxLength_RejectedWithConstraintViolation() {
        Journal journal = new Journal();
        journal.setTitle("x".repeat(201));
        journal.setContent("content");

        Set<ConstraintViolation<Journal>> violations = VALIDATOR.validate(journal);

        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("title"));
    }

    @Test
    void validation_NullContentDuringPartialUpdate_NoViolation() {
        // @Size only fires on a present value - a PUT that omits content (the
        // established partial-update convention JournalServiceImpl relies on)
        // must not be rejected by this new constraint.
        Journal journal = new Journal();
        journal.setTitle("Title");
        journal.setContent(null);

        Set<ConstraintViolation<Journal>> violations = VALIDATOR.validate(journal);

        assertThat(violations).noneMatch(v -> v.getPropertyPath().toString().equals("content"));
    }

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
    void calculateMetrics_ContentEncrypted_DoesNotRecomputeFromCiphertext() {
        // Regression guard: Hibernate's @PrePersist/@PreUpdate calls
        // calculateMetrics() again at flush time, after JournalServiceImpl has
        // already overwritten `content` with ciphertext - it must not
        // silently replace the real plaintext-derived metrics with
        // ciphertext-derived nonsense.
        Journal journal = new Journal();
        journal.setContent("one two three four five");
        journal.calculateMetrics();
        journal.setContent("aGVsbG8gd29ybGQ=someBase64LookingCiphertextBlobWithNoSpaces");
        journal.setContentEncrypted(true);

        journal.calculateMetrics();

        assertThat(journal.getWordCount()).isEqualTo(5);
        assertThat(journal.getCharacterCount()).isEqualTo(23);
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
