package com.aijournal.ai.service;

import com.aijournal.ai.entity.MoodHistory;
import com.aijournal.ai.repository.GoalTrackingRepository;
import com.aijournal.ai.repository.MoodHistoryRepository;
import com.aijournal.ai.service.impl.AiServiceImpl;
import com.aijournal.ai.strategy.AiProviderStrategy.*;
import com.aijournal.ai.strategy.AiStrategyFactory;
import com.aijournal.ai.strategy.impl.MockAiStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private AiStrategyFactory aiStrategyFactory;

    @Mock
    private MoodHistoryRepository moodHistoryRepository;

    @Mock
    private GoalTrackingRepository goalTrackingRepository;

    @InjectMocks
    private AiServiceImpl aiService;

    private MockAiStrategy mockStrategy;

    @BeforeEach
    void setUp() {
        mockStrategy = new MockAiStrategy();
        lenient().when(aiStrategyFactory.getActiveStrategy()).thenReturn(mockStrategy);
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

        MoodResult result = aiService.detectAndSaveMood(1L, 100L, "I feel super happy and excited about life!");
        assertNotNull(result);
        assertEquals("Happy", result.primaryMood());
        assertTrue(result.confidenceScore() > 0.8);
        verify(moodHistoryRepository, times(1)).save(any(MoodHistory.class));
    }

    @Test
    void getRecommendations_Success() {
        List<String> recommendations = aiService.getRecommendations("Feeling tired and stressed", "Stress");
        assertFalse(recommendations.isEmpty());
        assertTrue(recommendations.get(0).contains("walk") || recommendations.get(0).contains("hydrated"));
    }

    @Test
    void generateTags_Success() {
        List<String> tags = aiService.generateTags("Worked on my project today");
        assertFalse(tags.isEmpty());
        assertTrue(tags.contains("#career"));
    }
}
