package com.aijournal.search.listener;

import com.aijournal.common.event.JournalCreatedEvent;
import com.aijournal.common.event.JournalUpdatedEvent;
import com.aijournal.common.messaging.JournalEventRouting;
import com.aijournal.search.document.JournalDocument;
import com.aijournal.search.repository.JournalSearchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.ExchangeTypes;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class JournalEventListener {

    private static final Logger log = LoggerFactory.getLogger(JournalEventListener.class);

    private final JournalSearchRepository journalSearchRepository;

    public JournalEventListener(JournalSearchRepository journalSearchRepository) {
        this.journalSearchRepository = journalSearchRepository;
    }

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(name = JournalEventRouting.QUEUE_CREATED, durable = "true"),
            exchange = @Exchange(name = JournalEventRouting.EXCHANGE_NAME, type = ExchangeTypes.TOPIC),
            key = JournalEventRouting.ROUTING_KEY_CREATED
    ))
    public void handleJournalCreated(JournalCreatedEvent event) {
        try {
            String id = String.valueOf(event.getJournalId());
            String createdAt = event.getCreatedAt() != null
                    ? event.getCreatedAt().toString()
                    : String.valueOf(System.currentTimeMillis());

            // mood/tags aren't produced yet at journal-creation time (that's ai-service's
            // job, not wired into this event) - seed neutral defaults rather than fabricate data.
            JournalDocument doc = new JournalDocument(
                    id,
                    event.getJournalId(),
                    event.getUserId(),
                    event.getTitle(),
                    event.getContent(),
                    "NEUTRAL",
                    List.of(),
                    createdAt
            );
            journalSearchRepository.save(doc);
        } catch (Exception e) {
            log.error("Failed to index journal.created event for journalId={}", event.getJournalId(), e);
        }
    }

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(name = JournalEventRouting.QUEUE_UPDATED, durable = "true"),
            exchange = @Exchange(name = JournalEventRouting.EXCHANGE_NAME, type = ExchangeTypes.TOPIC),
            key = JournalEventRouting.ROUTING_KEY_UPDATED
    ))
    public void handleJournalUpdated(JournalUpdatedEvent event) {
        try {
            String id = String.valueOf(event.getJournalId());
            String updatedAt = event.getUpdatedAt() != null
                    ? event.getUpdatedAt().toString()
                    : String.valueOf(System.currentTimeMillis());

            JournalDocument doc = journalSearchRepository.findById(id).orElseGet(() -> new JournalDocument(
                    id, event.getJournalId(), event.getUserId(), "", "", "NEUTRAL", List.of(), updatedAt
            ));
            doc.setTitle(event.getTitle());
            doc.setContent(event.getContent());
            journalSearchRepository.save(doc);
        } catch (Exception e) {
            log.error("Failed to index journal.updated event for journalId={}", event.getJournalId(), e);
        }
    }
}
