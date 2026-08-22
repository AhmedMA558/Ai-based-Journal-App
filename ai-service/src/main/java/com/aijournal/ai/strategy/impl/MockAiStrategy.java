package com.aijournal.ai.strategy.impl;

import com.aijournal.ai.strategy.AiProviderStrategy;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component("mockAiStrategy")
public class MockAiStrategy implements AiProviderStrategy {

    @Override
    public String getProviderName() {
        return "mock";
    }

    @Override
    public SummaryResult summarize(String content) {
        String c = content != null ? content : "";
        String shortSummary = c.length() > 50 ? c.substring(0, 50) + "..." : c;
        return new SummaryResult(shortSummary, c, "• Logged daily thoughts.");
    }

    @Override
    public MoodResult detectMood(String content) {
        String c = content != null ? content.toLowerCase() : "";
        if (c.contains("happy") || c.contains("great") || c.contains("awesome") || c.contains("productive")) {
            return new MoodResult("HAPPY", 0.95, "😊");
        } else if (c.contains("sad") || c.contains("hurt")) {
            return new MoodResult("SAD", 0.90, "🥺");
        } else if (c.contains("stressed") || c.contains("tired")) {
            return new MoodResult("STRESSED", 0.90, "😰");
        }
        return new MoodResult("NEUTRAL", 0.85, "😐");
    }

    @Override
    public List<String> generateRecommendations(String content, String mood) {
        return List.of("Take 5 deep breaths.", "Reflect on 3 good things today.");
    }

    @Override
    public List<String> generateTags(String content) {
        return List.of("#journal", "#reflection", "#mindfulness");
    }

    @Override
    public String chatWithJournal(String query, String context, List<Map<String, String>> history) {
        return "Mock AI response to: " + query;
    }

    @Override
    public SentimentResult analyzeSentiment(String content) {
        return new SentimentResult("POSITIVE", 0.90);
    }

    @Override
    public RephraseResult rephrase(String content) {
        return new RephraseResult(content, content);
    }

    @Override
    public GrammarResult fixGrammar(String content) {
        return new GrammarResult(content, content);
    }
}
