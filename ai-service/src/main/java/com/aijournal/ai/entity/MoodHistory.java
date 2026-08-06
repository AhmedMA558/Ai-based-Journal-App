package com.aijournal.ai.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mood_history")
public class MoodHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "journal_id", nullable = false)
    private Long journalId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "detected_mood", nullable = false, length = 50)
    private String detectedMood;

    @Column(name = "confidence_score", nullable = false)
    private Double confidenceScore;

    @Column(nullable = false, length = 20)
    private String sentiment;

    @Column(name = "sentiment_score", nullable = false)
    private Double sentimentScore = 0.0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public MoodHistory() {
    }

    public MoodHistory(Long id, Long journalId, Long userId, String detectedMood, Double confidenceScore, String sentiment, Double sentimentScore) {
        this.id = id;
        this.journalId = journalId;
        this.userId = userId;
        this.detectedMood = detectedMood;
        this.confidenceScore = confidenceScore;
        this.sentiment = sentiment;
        this.sentimentScore = sentimentScore != null ? sentimentScore : 0.0;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getJournalId() { return journalId; }
    public void setJournalId(Long journalId) { this.journalId = journalId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getDetectedMood() { return detectedMood; }
    public void setDetectedMood(String detectedMood) { this.detectedMood = detectedMood; }
    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }
    public String getSentiment() { return sentiment; }
    public void setSentiment(String sentiment) { this.sentiment = sentiment; }
    public Double getSentimentScore() { return sentimentScore; }
    public void setSentimentScore(Double sentimentScore) { this.sentimentScore = sentimentScore; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
