package com.aijournal.ai.strategy;

import java.util.List;
import java.util.Map;

public interface AiProviderStrategy {
    String getProviderName();

    SummaryResult summarize(String content);
    MoodResult detectMood(String content);
    List<String> generateRecommendations(String content, String mood);
    List<String> generateTags(String content);
    // history is prior conversation turns ({"role": "user"|"assistant",
    // "content": "..."}, oldest first) - without it, a real LLM provider has
    // no memory of the conversation and every message gets evaluated in
    // isolation, which is what let the old canned-reply fallback repeat the
    // same response for unrelated messages that happened to land in the
    // same mood/topic bucket.
    String chatWithJournal(String query, String context, List<Map<String, String>> history);
    // Used internally by detectAndSaveMood (via AiServiceImpl calling
    // getStrategy().analyzeSentiment(...) directly) to populate
    // MoodHistory.sentiment/sentiment_score - not part of AiService's own
    // public interface, which dropped its standalone passthrough (the
    // /sentiment endpoint had no caller of its own beyond that).
    SentimentResult analyzeSentiment(String content);
    RephraseResult rephrase(String content);
    GrammarResult fixGrammar(String content);

    record SummaryResult(String shortSummary, String detailedSummary, String bulletSummary) {}
    record MoodResult(String primaryMood, double confidenceScore, String emoji) {}
    record SentimentResult(String sentiment, double score) {}
    record RephraseResult(String original, String rephrased) {}
    record GrammarResult(String original, String corrected) {}
}
