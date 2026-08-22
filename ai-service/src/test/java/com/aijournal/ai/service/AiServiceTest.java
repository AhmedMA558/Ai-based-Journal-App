package com.aijournal.ai.service;

import com.aijournal.ai.entity.MoodHistory;
import com.aijournal.ai.repository.MoodHistoryRepository;
import com.aijournal.ai.service.impl.AiServiceImpl;
import com.aijournal.ai.strategy.AiProviderStrategy;
import com.aijournal.ai.strategy.AiProviderStrategy.*;
import com.aijournal.ai.strategy.AiStrategyFactory;
import com.aijournal.ai.strategy.impl.MockAiStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private AiStrategyFactory aiStrategyFactory;

    @Mock
    private MoodHistoryRepository moodHistoryRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AiServiceImpl aiService;

    private MockAiStrategy mockStrategy;

    @BeforeEach
    void setUp() {
        mockStrategy = new MockAiStrategy();
        lenient().when(aiStrategyFactory.getActiveStrategy()).thenReturn(mockStrategy);
        ReflectionTestUtils.setField(aiService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(aiService, "journalServiceUrl", "http://journal-service:8083");
    }

    @SuppressWarnings("unchecked")
    private void stubJournalFetch(List<Map<String, Object>> journals) {
        Map<String, Object> page = Map.of("content", journals);
        Map<String, Object> body = Map.of("data", page);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok(body));
    }

    private Map<String, Object> journalEntry(String title, String content, String mood, String createdAt) {
        return Map.of("title", title, "content", content, "mood", mood, "createdAt", createdAt);
    }

    @Test
    void summarizeJournal_Success() {
        SummaryResult result = aiService.summarizeJournal("I accomplished all my goals today and feel amazing!");
        assertNotNull(result);
        assertNotNull(result.shortSummary());
        assertNotNull(result.detailedSummary());
        assertNotNull(result.bulletSummary());
    }

    @Test
    void detectAndSaveMood_Success() {
        when(moodHistoryRepository.save(any(MoodHistory.class))).thenAnswer(i -> i.getArguments()[0]);

        // journalId=0 is the real shape both clients send (mood detection
        // fires while typing, before the journal is ever saved) - skips the
        // ownership-check call entirely, matching chatWithJournal_NonMoodQuestion's
        // established verifyNoInteractions(restTemplate) style below.
        MoodResult result = aiService.detectAndSaveMood(1L, 0L, "I feel super happy and excited about life!", "Bearer test-token");
        assertNotNull(result);
        assertEquals("HAPPY", result.primaryMood());
        assertTrue(result.confidenceScore() > 0.8);
        verify(moodHistoryRepository, times(1)).save(any(MoodHistory.class));
        verifyNoInteractions(restTemplate);
    }

    @Test
    void detectAndSaveMood_JournalIdOwnedByCaller_SavesMoodHistory() {
        when(restTemplate.exchange(eq("http://journal-service:8083/api/v1/journals/100"), eq(HttpMethod.GET), any(HttpEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok(Map.of("data", Map.of("id", 100))));
        when(moodHistoryRepository.save(any(MoodHistory.class))).thenAnswer(i -> i.getArguments()[0]);

        MoodResult result = aiService.detectAndSaveMood(1L, 100L, "Feeling great today", "Bearer test-token");

        assertNotNull(result);
        verify(moodHistoryRepository, times(1)).save(any(MoodHistory.class));
    }

    @Test
    void detectAndSaveMood_JournalIdNotOwnedByCaller_ThrowsForbiddenAndDoesNotSave() {
        when(restTemplate.exchange(eq("http://journal-service:8083/api/v1/journals/999"), eq(HttpMethod.GET), any(HttpEntity.class), any(ParameterizedTypeReference.class)))
                .thenThrow(new org.springframework.web.client.HttpClientErrorException(org.springframework.http.HttpStatus.NOT_FOUND));

        assertThrows(com.aijournal.common.exception.ForbiddenException.class,
                () -> aiService.detectAndSaveMood(1L, 999L, "Trying to attach mood to someone else's journal", "Bearer test-token"));
        verify(moodHistoryRepository, never()).save(any(MoodHistory.class));
    }

    @Test
    void getRecommendations_Success() {
        List<String> recommendations = aiService.getRecommendations("Feeling tired and stressed", "STRESSED");
        assertNotNull(recommendations);
        assertFalse(recommendations.isEmpty());
    }

    @Test
    void generateTags_Success() {
        List<String> tags = aiService.generateTags("Worked on my project today");
        assertNotNull(tags);
        assertFalse(tags.isEmpty());
        assertTrue(tags.contains("#journal"));
    }

    @Test
    void chatWithJournal_WhenWasIHappy_ReturnsRealDatesFromJournalHistoryNotACannedReply() {
        stubJournalFetch(List.of(
                journalEntry("Promotion day", "Got promoted at work today, could not stop smiling.", "HAPPY", "2026-03-15T10:00:00"),
                journalEntry("Quiet evening", "Just relaxed at home.", "RELAXED", "2026-03-10T20:00:00"),
                journalEntry("Old win", "Finished a big project.", "HAPPY", "2026-01-02T09:00:00")
        ));

        String answer = aiService.chatWithJournal(1L, "When was I happy?", "", "Bearer test-token");

        assertNotNull(answer);
        assertTrue(answer.contains("March 15, 2026"), "should cite the real date of the most recent HAPPY entry: " + answer);
        assertTrue(answer.contains("Promotion day"), "should cite the real entry title: " + answer);
        assertTrue(answer.contains("2 entries"), "should count only the 2 HAPPY entries, not the RELAXED one: " + answer);
        assertFalse(answer.contains("Quiet evening"), "must not include a non-matching mood's entry: " + answer);
    }

    @Test
    void chatWithJournal_WorstMoodQuery_MatchesNegativeMoodBucketAcrossMultipleMoods() {
        stubJournalFetch(List.of(
                journalEntry("Bad meeting", "Argument with a coworker.", "ANGRY", "2026-04-01T09:00:00"),
                journalEntry("Rough night", "Felt really down.", "SAD", "2026-03-20T22:00:00"),
                journalEntry("Great day", "Everything went well.", "HAPPY", "2026-03-25T09:00:00")
        ));

        String answer = aiService.chatWithJournal(1L, "When was my worst mood?", "", "Bearer test-token");

        assertNotNull(answer);
        assertTrue(answer.contains("April 1, 2026"), "most recent negative-mood entry should be cited first: " + answer);
        assertTrue(answer.contains("2 entries"), "ANGRY and SAD should both count toward the negative bucket: " + answer);
        assertFalse(answer.contains("Great day"), "a HAPPY entry must not appear in a worst-mood answer: " + answer);
    }

    @Test
    void chatWithJournal_NoMatchingMoodEntries_ReturnsHonestNoDataMessageNotAFabricatedDate() {
        stubJournalFetch(List.of(journalEntry("Normal day", "Nothing special.", "NEUTRAL", "2026-03-15T10:00:00")));

        String answer = aiService.chatWithJournal(1L, "When was I angry?", "", "Bearer test-token");

        assertNotNull(answer);
        assertTrue(answer.toLowerCase().contains("didn't find"), "should honestly say no matching entries exist: " + answer);
    }

    @Test
    void chatWithJournal_GeneralMessageMentioningMoodInPassing_StillGetsNormalStrategyReply() {
        // "I'm sad today" mentions a mood word but isn't a "when"/"how many
        // times" question - must not trigger the data-lookup path at all.
        String answer = aiService.chatWithJournal(1L, "I'm sad today", "", "Bearer test-token");

        assertNotNull(answer);
        verifyNoInteractions(restTemplate);
    }

    @Test
    void chatWithJournal_JournalServiceUnreachable_FallsBackToStrategyReplyInsteadOfErroring() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any()))
                .thenThrow(new RestClientException("journal-service unreachable"));

        String answer = aiService.chatWithJournal(1L, "When was I happy?", "", "Bearer test-token");

        assertNotNull(answer);
        assertFalse(answer.isBlank());
    }

    @Test
    void chatWithJournal_NonMoodQuestion_DelegatesToStrategyAndNeverCallsJournalService() {
        String answer = aiService.chatWithJournal(1L, "Suggest 3 journal prompts", "", "Bearer test-token");

        assertNotNull(answer);
        verifyNoInteractions(restTemplate);
    }
}
