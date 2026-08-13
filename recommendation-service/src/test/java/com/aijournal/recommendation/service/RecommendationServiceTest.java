package com.aijournal.recommendation.service;

import com.aijournal.recommendation.service.impl.RecommendationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private RecommendationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new RecommendationServiceImpl();
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(service, "journalServiceUrl", "http://journal-service:8083");
    }

    private static Map<String, Object> journalsResponse(String... moods) {
        List<Map<String, Object>> content = List.of(moods).stream()
                .map(m -> Map.<String, Object>of("mood", m))
                .toList();
        return Map.of("data", Map.of("content", content));
    }

    @SuppressWarnings("unchecked")
    private void mockJournalServiceResponse(Map<String, Object> body) {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok(body));
    }

    @Test
    void getPersonalizedRecommendations_CallerSuppliedMood_SkipsJournalFetchEntirely() {
        Map<String, Object> result = service.getPersonalizedRecommendations(1L, "happy", "Bearer token");

        assertThat(result.get("currentMood")).isEqualTo("HAPPY");
        verifyNoInteractions(restTemplate);
    }

    @Test
    void getPersonalizedRecommendations_NoMoodSupplied_ComputesDominantMoodFromRecentJournals() {
        mockJournalServiceResponse(journalsResponse("STRESSED", "STRESSED", "HAPPY"));

        Map<String, Object> result = service.getPersonalizedRecommendations(1L, null, "Bearer token");

        assertThat(result.get("currentMood")).isEqualTo("STRESSED");
    }

    @Test
    void getPersonalizedRecommendations_TiedMoodCounts_BreaksTieTowardTheMoreRecentEntry() {
        // Journals arrive newest-first; HAPPY appears first (most recent) and
        // both moods tie at count 1 - the more recent one should win.
        mockJournalServiceResponse(journalsResponse("HAPPY", "SAD"));

        Map<String, Object> result = service.getPersonalizedRecommendations(1L, null, "Bearer token");

        assertThat(result.get("currentMood")).isEqualTo("HAPPY");
    }

    @Test
    void getPersonalizedRecommendations_NoJournalsYet_DefaultsToNeutral() {
        mockJournalServiceResponse(journalsResponse());

        Map<String, Object> result = service.getPersonalizedRecommendations(1L, null, "Bearer token");

        assertThat(result.get("currentMood")).isEqualTo("NEUTRAL");
    }

    @Test
    void getPersonalizedRecommendations_JournalServiceUnreachable_FallsBackToNeutralGracefully() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), any(ParameterizedTypeReference.class)))
                .thenThrow(new RestClientException("connection refused"));

        Map<String, Object> result = service.getPersonalizedRecommendations(1L, null, "Bearer token");

        assertThat(result.get("currentMood")).isEqualTo("NEUTRAL");
    }

    @Test
    void getPersonalizedRecommendations_ContentDiffersByMoodBucket() {
        Map<String, Object> happy = service.getPersonalizedRecommendations(1L, "happy", null);
        Map<String, Object> sad = service.getPersonalizedRecommendations(1L, "sad", null);

        assertThat(happy.get("recommendedBooks")).isNotEqualTo(sad.get("recommendedBooks"));
        assertThat(happy.get("recommendedPrompts")).isNotEqualTo(sad.get("recommendedPrompts"));
    }

    @Test
    void getPersonalizedRecommendations_ReturnsAllExpectedKeys() {
        Map<String, Object> result = service.getPersonalizedRecommendations(1L, "sad", null);

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
