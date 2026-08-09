package com.aijournal.ai.strategy;

import java.util.List;

public interface AiProviderStrategy {
    String getProviderName();

    SummaryResult summarize(String content);
    MoodResult detectMood(String content);
    List<String> generateRecommendations(String content, String mood);
    List<String> generateTags(String content);
    String chatWithJournal(String query, String context);
    List<String> detectHabits(String content);
    List<String> extractGoals(String content);
    SentimentResult analyzeSentiment(String content);
    WritingImprovementResult suggestWritingImprovements(String content);
    ReflectionResult generateDailyReflection(String content);
    RephraseResult rephrase(String content);
    GrammarResult fixGrammar(String content);

    record SummaryResult(String shortSummary, String detailedSummary, String bulletSummary) {}
    record MoodResult(String primaryMood, double confidenceScore, String emoji) {}
    record SentimentResult(String sentiment, double score) {}
    record WritingImprovementResult(String grammarSuggestions, String clarityScore, String vocabularyTips) {}
    record ReflectionResult(List<String> reflectionQuestions, List<String> followUpQuestions, List<String> suggestions) {}
    record RephraseResult(String original, String rephrased) {}
    record GrammarResult(String original, String corrected) {}
}
