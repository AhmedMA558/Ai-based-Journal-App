package com.aijournal.ai.service.impl;

import com.aijournal.ai.entity.MoodHistory;
import com.aijournal.ai.repository.MoodHistoryRepository;
import com.aijournal.ai.service.AiService;
import com.aijournal.ai.strategy.AiProviderStrategy;
import com.aijournal.ai.strategy.AiProviderStrategy.*;
import com.aijournal.ai.strategy.AiStrategyFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AiServiceImpl implements AiService {

    private final AiStrategyFactory aiStrategyFactory;
    private final MoodHistoryRepository moodHistoryRepository;

    public AiServiceImpl(AiStrategyFactory aiStrategyFactory, MoodHistoryRepository moodHistoryRepository) {
        this.aiStrategyFactory = aiStrategyFactory;
        this.moodHistoryRepository = moodHistoryRepository;
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
