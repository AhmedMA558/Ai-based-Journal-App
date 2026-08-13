package com.aijournal.common.event;

import java.io.Serializable;

// Deliberately minimal compared to JournalCreatedEvent/JournalUpdatedEvent -
// a delete only needs an id for the consumer to act on, no content/title.
public class JournalDeletedEvent implements Serializable {
    private Long journalId;
    private Long userId;

    public JournalDeletedEvent() {
    }

    public JournalDeletedEvent(Long journalId, Long userId) {
        this.journalId = journalId;
        this.userId = userId;
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
}
