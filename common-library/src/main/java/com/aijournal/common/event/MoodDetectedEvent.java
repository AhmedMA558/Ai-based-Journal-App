package com.aijournal.common.event;

import java.io.Serializable;
import java.time.LocalDateTime;

public class MoodDetectedEvent implements Serializable {
    private Long journalId;
    private Long userId;
    private String primaryMood;
    private Double confidenceScore;
    private String sentiment;
    private LocalDateTime detectedAt;

    public MoodDetectedEvent() {
    }

    public MoodDetectedEvent(Long journalId, Long userId, String primaryMood, Double confidenceScore, String sentiment, LocalDateTime detectedAt) {
        this.journalId = journalId;
        this.userId = userId;
        this.primaryMood = primaryMood;
        this.confidenceScore = confidenceScore;
        this.sentiment = sentiment;
        this.detectedAt = detectedAt;
    }

    public Long getJournalId() {
        return journalId;
    }

    public void setJournalId(Long journalId) {
        this.journalId = journalId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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

    public String getSentiment() {
        return sentiment;
    }

    public void setSentiment(String sentiment) {
        this.sentiment = sentiment;
    }

    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(LocalDateTime detectedAt) {
        this.detectedAt = detectedAt;
    }
}
