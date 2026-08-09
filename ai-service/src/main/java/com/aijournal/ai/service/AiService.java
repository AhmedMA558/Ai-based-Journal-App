package com.aijournal.ai.service;

import com.aijournal.ai.entity.GoalTracking;
import com.aijournal.ai.entity.MoodHistory;
import com.aijournal.ai.strategy.AiProviderStrategy.*;

import java.util.List;

public interface AiService {
    SummaryResult summarizeJournal(String content);
    MoodResult detectAndSaveMood(Long userId, Long journalId, String content);
    List<MoodHistory> getEmotionTimeline(Long userId, String period);
    List<String> getRecommendations(String content, String mood);
    List<String> generateTags(String content);
    String chatWithJournal(Long userId, String query, String context);
    List<String> detectHabits(String content);
    List<GoalTracking> extractAndSaveGoals(Long userId, Long journalId, String content);
    SentimentResult analyzeSentiment(String content);
    WritingImprovementResult suggestWritingImprovements(String content);
    ReflectionResult generateDailyReflection(String content);
    RephraseResult rephrase(String content);
    GrammarResult fixGrammar(String content);
}
