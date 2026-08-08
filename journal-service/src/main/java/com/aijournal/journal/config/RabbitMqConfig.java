package com.aijournal.journal.config;

import com.aijournal.common.messaging.JournalEventRouting;
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    @Bean
    public TopicExchange journalExchange() {
        return new TopicExchange(JournalEventRouting.EXCHANGE_NAME);
    }

    @Bean
    public Queue journalCreatedQueue() {
        return QueueBuilder.durable(JournalEventRouting.QUEUE_CREATED).build();
    }

    @Bean
    public Queue journalUpdatedQueue() {
        return QueueBuilder.durable(JournalEventRouting.QUEUE_UPDATED).build();
    }

    @Bean
    public Binding createdBinding(Queue journalCreatedQueue, TopicExchange journalExchange) {
        return BindingBuilder.bind(journalCreatedQueue).to(journalExchange).with(JournalEventRouting.ROUTING_KEY_CREATED);
    }

    @Bean
    public Binding updatedBinding(Queue journalUpdatedQueue, TopicExchange journalExchange) {
        return BindingBuilder.bind(journalUpdatedQueue).to(journalExchange).with(JournalEventRouting.ROUTING_KEY_UPDATED);
    }
}
