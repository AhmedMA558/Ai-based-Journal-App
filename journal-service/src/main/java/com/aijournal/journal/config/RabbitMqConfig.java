package com.aijournal.journal.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    public static final String EXCHANGE_NAME = "journal.exchange";
    public static final String QUEUE_CREATED = "journal.created.queue";
    public static final String QUEUE_UPDATED = "journal.updated.queue";
    public static final String ROUTING_KEY_CREATED = "journal.created";
    public static final String ROUTING_KEY_UPDATED = "journal.updated";

    @Bean
    public TopicExchange journalExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue journalCreatedQueue() {
        return QueueBuilder.durable(QUEUE_CREATED).build();
    }

    @Bean
    public Queue journalUpdatedQueue() {
        return QueueBuilder.durable(QUEUE_UPDATED).build();
    }

    @Bean
    public Binding createdBinding(Queue journalCreatedQueue, TopicExchange journalExchange) {
        return BindingBuilder.bind(journalCreatedQueue).to(journalExchange).with(ROUTING_KEY_CREATED);
    }

    @Bean
    public Binding updatedBinding(Queue journalUpdatedQueue, TopicExchange journalExchange) {
        return BindingBuilder.bind(journalUpdatedQueue).to(journalExchange).with(ROUTING_KEY_UPDATED);
    }
}
