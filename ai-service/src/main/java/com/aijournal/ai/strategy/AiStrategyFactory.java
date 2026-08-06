package com.aijournal.ai.strategy;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiStrategyFactory {

    private final List<AiProviderStrategy> strategies;

    @Value("${ai.provider:mock}")
    private String configuredProvider;

    public AiStrategyFactory(List<AiProviderStrategy> strategies) {
        this.strategies = strategies;
    }

    public AiProviderStrategy getActiveStrategy() {
        return strategies.stream()
                .filter(s -> s.getProviderName().equalsIgnoreCase(configuredProvider))
                .findFirst()
                .orElseGet(() -> strategies.stream()
                        .filter(s -> s.getProviderName().equalsIgnoreCase("MOCK"))
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("No AI provider strategy found")));
    }
}
