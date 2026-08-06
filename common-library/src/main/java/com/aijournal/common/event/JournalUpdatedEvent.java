package com.aijournal.common.event;

import java.io.Serializable;
import java.time.LocalDateTime;

public class JournalUpdatedEvent implements Serializable {
    private Long journalId;
    private Long userId;
    private String title;
    private String content;
    private LocalDateTime updatedAt;

    public JournalUpdatedEvent() {
    }

    public JournalUpdatedEvent(Long journalId, Long userId, String title, String content, LocalDateTime updatedAt) {
        this.journalId = journalId;
        this.userId = userId;
        this.title = title;
        this.content = content;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
