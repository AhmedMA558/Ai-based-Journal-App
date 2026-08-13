package com.aijournal.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.test.StepVerifier;

import java.net.InetSocketAddress;

class RateLimiterConfigTest {

    private final KeyResolver resolver = new RateLimiterConfig().ipKeyResolver();

    @Test
    void ipKeyResolver_RequestWithRemoteAddress_ResolvesToClientIp() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login")
                        .remoteAddress(new InetSocketAddress("203.0.113.42", 54321)));

        StepVerifier.create(resolver.resolve(exchange))
                .expectNext("203.0.113.42")
                .verifyComplete();
    }

    @Test
    void ipKeyResolver_DifferentClients_ResolveToDifferentKeys() {
        MockServerWebExchange exchangeA = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login")
                        .remoteAddress(new InetSocketAddress("10.0.0.1", 1000)));
        MockServerWebExchange exchangeB = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login")
                        .remoteAddress(new InetSocketAddress("10.0.0.2", 1000)));

        String keyA = resolver.resolve(exchangeA).block();
        String keyB = resolver.resolve(exchangeB).block();

        org.assertj.core.api.Assertions.assertThat(keyA).isNotEqualTo(keyB);
    }

    @Test
    void ipKeyResolver_NoRemoteAddress_FallsBackToUnknownRatherThanThrowing() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login"));

        StepVerifier.create(resolver.resolve(exchange))
                .expectNext("unknown")
                .verifyComplete();
    }
}
