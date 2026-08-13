package com.aijournal.recommendation.service;

import java.util.List;
import java.util.Map;

public interface RecommendationService {
    Map<String, Object> getPersonalizedRecommendations(Long userId, String currentMood, String authorizationHeader);
    List<String> getJournalPrompts(String category);
}
