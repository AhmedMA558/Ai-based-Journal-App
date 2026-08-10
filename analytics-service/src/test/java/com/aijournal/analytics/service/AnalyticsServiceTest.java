package com.aijournal.analytics.service;

import com.aijournal.analytics.service.impl.AnalyticsServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AnalyticsServiceTest {

    private final AnalyticsServiceImpl service = new AnalyticsServiceImpl();

    @Test
    void getUserJournalInsights_ReturnsAllExpectedKeysWithNonNullValues() {
        Map<String, Object> insights = service.getUserJournalInsights(42L);

        assertThat(insights).containsKeys(
                "userId", "longestStreakDays", "currentStreakDays", "totalWordsWritten",
                "averageWordsPerEntry", "mostCommonEmotions", "mostMentionedPeople",
                "mostMentionedPlaces", "mostProductiveDays", "writingFrequency", "topTopics"
        );
        insights.values().forEach(value -> assertThat(value).isNotNull());
    }

    @Test
    void getUserJournalInsights_EchoesRequestedUserId() {
        Map<String, Object> insights = service.getUserJournalInsights(42L);

        assertThat(insights.get("userId")).isEqualTo(42L);
    }
}
