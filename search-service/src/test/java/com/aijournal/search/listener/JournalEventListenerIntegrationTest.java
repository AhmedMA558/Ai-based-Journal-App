package com.aijournal.search.listener;

import com.aijournal.common.event.JournalCreatedEvent;
import com.aijournal.common.messaging.JournalEventRouting;
import com.aijournal.common.messaging.RabbitMessagingAutoConfiguration;
import com.aijournal.search.document.JournalDocument;
import com.aijournal.search.repository.JournalSearchRepository;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Proves the consumer side of the exact bug class fixed in Phase 1: search-service's
 * @RabbitListener silently bound to a queue nothing ever published to. Publishes a real
 * message shaped exactly like journal-service's producer (same exchange/routing key from
 * the shared JournalEventRouting constants, same Jackson2JsonMessageConverter) against a
 * live broker and asserts the real listener method actually fires - a Mockito-mocked
 * RabbitTemplate/@RabbitListener can't catch a wrong binding, only a real broker can.
 */
@SpringBootTest(classes = JournalEventListenerIntegrationTest.TestConfig.class)
@Testcontainers
class JournalEventListenerIntegrationTest {

    @Container
    @ServiceConnection
    static final RabbitMQContainer RABBITMQ = new RabbitMQContainer("rabbitmq:3-management");

    @Configuration
    @ImportAutoConfiguration(RabbitAutoConfiguration.class)
    @Import({JournalEventListener.class, RabbitMessagingAutoConfiguration.class})
    static class TestConfig {
    }

    @MockBean
    private JournalSearchRepository journalSearchRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Test
    void publishingRealJournalCreatedEvent_TriggersListenerAndSavesMappedDocument() {
        when(journalSearchRepository.save(org.mockito.ArgumentMatchers.any(JournalDocument.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        JournalCreatedEvent event = new JournalCreatedEvent(10L, 20L, "Real Title", "Real Content", null, null, LocalDateTime.now());
        rabbitTemplate.convertAndSend(JournalEventRouting.EXCHANGE_NAME, JournalEventRouting.ROUTING_KEY_CREATED, event);

        verify(journalSearchRepository, timeout(10_000)).save(argThat(doc ->
                doc.getJournalId().equals(10L)
                        && "Real Title".equals(doc.getTitle())
                        && "NEUTRAL".equals(doc.getMood())
        ));
    }
}
