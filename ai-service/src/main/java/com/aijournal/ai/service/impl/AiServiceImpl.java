package com.aijournal.ai.service.impl;

import com.aijournal.ai.entity.GoalTracking;
import com.aijournal.ai.entity.MoodHistory;
import com.aijournal.ai.repository.GoalTrackingRepository;
import com.aijournal.ai.repository.MoodHistoryRepository;
import com.aijournal.ai.service.AiService;
import com.aijournal.ai.strategy.AiProviderStrategy;
import com.aijournal.ai.strategy.AiProviderStrategy.*;
import com.aijournal.ai.strategy.AiStrategyFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiServiceImpl implements AiService {

    private final AiStrategyFactory aiStrategyFactory;
    private final MoodHistoryRepository moodHistoryRepository;
    private final GoalTrackingRepository goalTrackingRepository;

    public AiServiceImpl(AiStrategyFactory aiStrategyFactory, MoodHistoryRepository moodHistoryRepository, GoalTrackingRepository goalTrackingRepository) {
        this.aiStrategyFactory = aiStrategyFactory;
        this.moodHistoryRepository = moodHistoryRepository;
        this.goalTrackingRepository = goalTrackingRepository;
    }

    @Override
    public SummaryResult summarizeJournal(String content) {
        return getStrategy().summarize(content);
    }

    @Override
    @Transactional
    public MoodResult detectAndSaveMood(Long userId, Long journalId, String content) {
        MoodResult result = getStrategy().detectMood(content);
        SentimentResult sentiment = getStrategy().analyzeSentiment(content);

        MoodHistory history = new MoodHistory(
                null,
                journalId,
                userId,
                result.primaryMood(),
                result.confidenceScore(),
                sentiment.sentiment(),
                sentiment.score()
        );
        moodHistoryRepository.save(history);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MoodHistory> getEmotionTimeline(Long userId, String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = switch (period.toLowerCase()) {
            case "weekly" -> now.minusDays(7);
            case "monthly" -> now.minusDays(30);
            case "yearly" -> now.minusDays(365);
            default -> now.minusDays(7);
        };
        return moodHistoryRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtAsc(userId, start, now);
    }

    @Override
    public List<String> getRecommendations(String content, String mood) {
        return getStrategy().generateRecommendations(content, mood);
    }

    @Override
    public List<String> generateTags(String content) {
        return getStrategy().generateTags(content);
    }

    @Override
    public String chatWithJournal(Long userId, String query, String context) {
        return getStrategy().chatWithJournal(query, context);
    }

    @Override
    public List<String> detectHabits(String content) {
        return getStrategy().detectHabits(content);
    }

    @Override
    @Transactional
    public List<GoalTracking> extractAndSaveGoals(Long userId, Long journalId, String content) {
        List<String> goalStrings = getStrategy().extractGoals(content);
        return goalStrings.stream().map(g -> {
            GoalTracking goal = new GoalTracking(null, userId, journalId, g, "PENDING", null);
            return goalTrackingRepository.save(goal);
        }).collect(Collectors.toList());
    }

    @Override
    public SentimentResult analyzeSentiment(String content) {
        return getStrategy().analyzeSentiment(content);
    }

    @Override
    public WritingImprovementResult suggestWritingImprovements(String content) {
        return getStrategy().suggestWritingImprovements(content);
    }

    @Override
    public ReflectionResult generateDailyReflection(String content) {
        return getStrategy().generateDailyReflection(content);
    }

    @Override
    public RephraseResult rephrase(String content) {
        return getStrategy().rephrase(content);
    }

    @Override
    public GrammarResult fixGrammar(String content) {
        return getStrategy().fixGrammar(content);
    }

    private AiProviderStrategy getStrategy() {
        return aiStrategyFactory.getActiveStrategy();
    }
}
