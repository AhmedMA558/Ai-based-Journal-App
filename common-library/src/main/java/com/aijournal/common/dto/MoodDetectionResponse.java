package com.aijournal.common.dto;

import java.util.Map;

public class MoodDetectionResponse {

    private String primaryMood;
    private Double confidenceScore;
    private String emoji;
    private Map<String, Double> moodBreakdown;

    public MoodDetectionResponse() {
    }

    public MoodDetectionResponse(String primaryMood, Double confidenceScore, String emoji, Map<String, Double> moodBreakdown) {
        this.primaryMood = primaryMood;
        this.confidenceScore = confidenceScore;
        this.emoji = emoji;
        this.moodBreakdown = moodBreakdown;
    }

    public String getPrimaryMood() {
        return primaryMood;
    }

    public void setPrimaryMood(String primaryMood) {
        this.primaryMood = primaryMood;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getEmoji() {
        return emoji;
    }

    public void setEmoji(String emoji) {
        this.emoji = emoji;
    }

    public Map<String, Double> getMoodBreakdown() {
        return moodBreakdown;
    }

    public void setMoodBreakdown(Map<String, Double> moodBreakdown) {
        this.moodBreakdown = moodBreakdown;
    }
}
