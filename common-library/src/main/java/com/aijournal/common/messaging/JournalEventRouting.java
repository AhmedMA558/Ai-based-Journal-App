package com.aijournal.common.messaging;

/**
 * Shared RabbitMQ routing names for journal lifecycle events, so the journal-service
 * producer and any consumer (currently search-service) never drift out of sync.
 */
public final class JournalEventRouting {

    public static final String EXCHANGE_NAME = "journal.exchange";
    public static final String QUEUE_CREATED = "journal.created.queue";
    public static final String QUEUE_UPDATED = "journal.updated.queue";
    public static final String ROUTING_KEY_CREATED = "journal.created";
    public static final String ROUTING_KEY_UPDATED = "journal.updated";

    private JournalEventRouting() {
    }
}
