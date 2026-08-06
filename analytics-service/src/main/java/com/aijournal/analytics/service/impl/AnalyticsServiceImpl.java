package com.aijournal.analytics.service.impl;

import com.aijournal.analytics.service.AnalyticsService;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    @Override
    public Map<String, Object> getUserJournalInsights(Long userId) {
        Map<String, Object> insights = new HashMap<>();
        insights.put("userId", userId);
        insights.put("longestStreakDays", 14);
        insights.put("currentStreakDays", 5);
        insights.put("totalWordsWritten", 24850);
        insights.put("averageWordsPerEntry", 345);
        insights.put("mostCommonEmotions", Map.of("Happy", 45, "Motivated", 30, "Stress", 15, "Anxious", 10));
        insights.put("mostMentionedPeople", List.of("Sarah", "Dad", "Alex", "Team Lead"));
        insights.put("mostMentionedPlaces", List.of("Office", "Central Park", "Gym", "Home Coffee Bar"));
        insights.put("mostProductiveDays", List.of("Sunday", "Wednesday"));
        insights.put("writingFrequency", "4.2 entries / week");
        insights.put("topTopics", List.of("#career", "#health", "#family", "#learning"));
        return insights;
    }
}
