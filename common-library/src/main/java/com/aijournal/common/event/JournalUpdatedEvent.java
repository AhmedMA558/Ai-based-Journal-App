package com.aijournal.common.event;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

public class JournalUpdatedEvent implements Serializable {
    private Long journalId;
    private Long userId;
    private String title;
    private String content;
    private String mood;
    private List<String> tags;
    private LocalDateTime updatedAt;

    public JournalUpdatedEvent() {
    }

    public JournalUpdatedEvent(Long journalId, Long userId, String title, String content, String mood, List<String> tags, LocalDateTime updatedAt) {
        this.journalId = journalId;
        this.userId = userId;
        this.title = title;
        this.content = content;
        this.mood = mood;
        this.tags = tags;
        this.updatedAt = updatedAt;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getMood() {
        return mood;
    }

    public void setMood(String mood) {
        this.mood = mood;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
