package com.aijournal.journal.messaging;

import com.aijournal.common.event.JournalCreatedEvent;
import com.aijournal.common.event.JournalUpdatedEvent;
import com.aijournal.common.messaging.JournalEventRouting;
import com.aijournal.common.messaging.RabbitMessagingAutoConfiguration;
import com.aijournal.journal.config.RabbitMqConfig;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.MessageConverter;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves the producer side of the exact bug class fixed in Phase 1: journal-service
 * publishing to an exchange/routing key that no queue is actually bound to. Declares
 * the real topology from RabbitMqConfig against a live broker and asserts a published
 * event is actually routed and consumable - a Mockito-mocked RabbitTemplate can't catch
 * a wrong exchange/routing-key/binding mismatch, only a real broker can.
 */
@Testcontainers
class JournalEventPublishingTest {

    static final RabbitMQContainer RABBITMQ = new RabbitMQContainer("rabbitmq:3-management");

    static CachingConnectionFactory connectionFactory;
    static RabbitTemplate rabbitTemplate;

    @BeforeAll
    static void startBrokerAndDeclareTopology() {
        RABBITMQ.start();
        connectionFactory = new CachingConnectionFactory(RABBITMQ.getHost(), RABBITMQ.getAmqpPort());
        connectionFactory.setUsername(RABBITMQ.getAdminUsername());
        connectionFactory.setPassword(RABBITMQ.getAdminPassword());

        MessageConverter converter = new RabbitMessagingAutoConfiguration().jsonMessageConverter();
        rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(converter);

        RabbitMqConfig config = new RabbitMqConfig();
        TopicExchange exchange = config.journalExchange();
        Queue createdQueue = config.journalCreatedQueue();
        Queue updatedQueue = config.journalUpdatedQueue();
        Binding createdBinding = config.createdBinding(createdQueue, exchange);
        Binding updatedBinding = config.updatedBinding(updatedQueue, exchange);

        RabbitAdmin admin = new RabbitAdmin(connectionFactory);
        admin.declareExchange(exchange);
        admin.declareQueue(createdQueue);
        admin.declareQueue(updatedQueue);
        admin.declareBinding(createdBinding);
        admin.declareBinding(updatedBinding);
    }

    @AfterAll
    static void stopBroker() {
        if (connectionFactory != null) {
            connectionFactory.destroy();
        }
        RABBITMQ.stop();
    }

    @Test
    void publishJournalCreatedEvent_ArrivesOnCreatedQueueWithCorrectShape() {
        JournalCreatedEvent event = new JournalCreatedEvent(1L, 42L, "Title", "Content", "Home", "Sunny", LocalDateTime.now());

        rabbitTemplate.convertAndSend(JournalEventRouting.EXCHANGE_NAME, JournalEventRouting.ROUTING_KEY_CREATED, event);

        Object received = rabbitTemplate.receiveAndConvert(JournalEventRouting.QUEUE_CREATED, 5000);
        assertThat(received).isInstanceOf(JournalCreatedEvent.class);
        JournalCreatedEvent receivedEvent = (JournalCreatedEvent) received;
        assertThat(receivedEvent.getUserId()).isEqualTo(42L);
        assertThat(receivedEvent.getTitle()).isEqualTo("Title");
    }

    @Test
    void publishJournalUpdatedEvent_ArrivesOnUpdatedQueueWithCorrectShape() {
        JournalUpdatedEvent event = new JournalUpdatedEvent(2L, 43L, "Updated Title", "Updated Content", LocalDateTime.now());

        rabbitTemplate.convertAndSend(JournalEventRouting.EXCHANGE_NAME, JournalEventRouting.ROUTING_KEY_UPDATED, event);

        Object received = rabbitTemplate.receiveAndConvert(JournalEventRouting.QUEUE_UPDATED, 5000);
        assertThat(received).isInstanceOf(JournalUpdatedEvent.class);
        JournalUpdatedEvent receivedEvent = (JournalUpdatedEvent) received;
        assertThat(receivedEvent.getUserId()).isEqualTo(43L);
        assertThat(receivedEvent.getTitle()).isEqualTo("Updated Title");
    }

    @Test
    void wrongRoutingKey_MessageNeverArrives_RegressionGuardForPhase1BugClass() {
        JournalCreatedEvent event = new JournalCreatedEvent(3L, 44L, "Ghost", "Ghost content", null, null, LocalDateTime.now());

        rabbitTemplate.convertAndSend(JournalEventRouting.EXCHANGE_NAME, "journal.nonexistent.routing.key", event);

        Object received = rabbitTemplate.receiveAndConvert(JournalEventRouting.QUEUE_CREATED, 1000);
        assertThat(received).isNull();
    }
}
