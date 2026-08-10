package com.aijournal.recommendation.service;

import com.aijournal.recommendation.service.impl.RecommendationServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RecommendationServiceTest {

    private final RecommendationServiceImpl service = new RecommendationServiceImpl();

    @Test
    void getPersonalizedRecommendations_LowercaseMood_IsUppercased() {
        Map<String, Object> result = service.getPersonalizedRecommendations(1L, "happy");

        assertThat(result.get("currentMood")).isEqualTo("HAPPY");
    }

    @Test
    void getPersonalizedRecommendations_NullMood_DefaultsToNeutral() {
        Map<String, Object> result = service.getPersonalizedRecommendations(1L, null);

        assertThat(result.get("currentMood")).isEqualTo("NEUTRAL");
    }

    @Test
    void getPersonalizedRecommendations_ReturnsAllExpectedKeys() {
        Map<String, Object> result = service.getPersonalizedRecommendations(1L, "sad");

        assertThat(result).containsKeys(
                "userId", "currentMood", "recommendedPrompts", "recommendedBooks",
                "recommendedMeditation", "recommendedMusicPlaylists", "recommendedExercises", "recommendedPodcasts"
        );
        assertThat(result.get("userId")).isEqualTo(1L);
    }

    @Test
    void getJournalPrompts_AnyCategory_ReturnsNonEmptyList() {
        assertThat(service.getJournalPrompts("gratitude")).isNotEmpty();
        assertThat(service.getJournalPrompts("anything-unrecognized")).isNotEmpty();
    }
}
