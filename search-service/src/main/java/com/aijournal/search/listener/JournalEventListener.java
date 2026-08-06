package com.aijournal.search.listener;

import com.aijournal.search.document.JournalDocument;
import com.aijournal.search.repository.JournalSearchRepository;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class JournalEventListener {

    private final JournalSearchRepository journalSearchRepository;

    public JournalEventListener(JournalSearchRepository journalSearchRepository) {
        this.journalSearchRepository = journalSearchRepository;
    }

    @RabbitListener(queuesToDeclare = @Queue(name = "journal.events.queue", durable = "true"))
    public void handleJournalEvent(Map<String, Object> event) {
        try {
            if (event != null && event.containsKey("journalId")) {
                Long journalId = ((Number) event.get("journalId")).longValue();
                Long userId = event.get("userId") != null ? ((Number) event.get("userId")).longValue() : 1L;
                String title = (String) event.getOrDefault("title", "");
                String content = (String) event.getOrDefault("content", "");
                String mood = (String) event.getOrDefault("mood", "NEUTRAL");

                JournalDocument doc = new JournalDocument(
                        String.valueOf(journalId),
                        journalId,
                        userId,
                        title,
                        content,
                        mood,
                        List.of("journal", mood.toLowerCase()),
                        String.valueOf(System.currentTimeMillis())
                );
                journalSearchRepository.save(doc);
            }
        } catch (Exception e) {
            // Ignore if Elasticsearch is initializing
        }
    }
}
