package com.aijournal.analytics.service;

import java.util.Map;

public interface AnalyticsService {
    Map<String, Object> getUserJournalInsights(Long userId);
}
