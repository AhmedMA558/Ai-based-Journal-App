package com.aijournal.common.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/**
 * Ensures every service that publishes or consumes RabbitMQ messages (currently
 * journal-service and search-service) agrees on JSON as the wire format. Without this,
 * Spring AMQP falls back to Java serialization via SimpleMessageConverter, which a typed
 * @RabbitListener parameter in a different service/module cannot reliably deserialize.
 * Spring Boot's own RabbitAutoConfiguration picks up this MessageConverter bean and wires
 * it into both RabbitTemplate and the default listener container factory automatically.
 */
@AutoConfiguration
@ConditionalOnClass(RabbitTemplate.class)
public class RabbitMessagingAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(MessageConverter.class)
    public MessageConverter jsonMessageConverter() {
        // Built explicitly (rather than Jackson2JsonMessageConverter's no-arg constructor)
        // so the JSR-310 module is guaranteed registered - the event DTOs carry
        // LocalDateTime fields, which a bare `new ObjectMapper()` cannot serialize.
        ObjectMapper objectMapper = Jackson2ObjectMapperBuilder.json().build();
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}
