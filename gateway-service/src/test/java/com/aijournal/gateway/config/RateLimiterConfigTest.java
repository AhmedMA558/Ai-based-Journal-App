package com.aijournal.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.test.StepVerifier;

import java.net.InetSocketAddress;

class RateLimiterConfigTest {

    private final KeyResolver resolver = new RateLimiterConfig().ipKeyResolver();
    private final KeyResolver userResolver = new RateLimiterConfig().userKeyResolver();

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

    @Test
    void ipKeyResolver_ForwardedForFromUntrustedPublicPeer_IsIgnored() {
        // The actual exploit this check exists to close: gateway-service's
        // port is reachable directly on the host, so without a trust check
        // an attacker hitting it straight (bypassing nginx) could set a
        // fresh X-Forwarded-For on every single request and get a brand new
        // rate-limit bucket key each time - unlimited login/MFA/password-
        // reset attempts despite the rate limiter existing at all.
        MockServerWebExchange exchangeA = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "1.1.1.1")
                        .remoteAddress(new InetSocketAddress("203.0.113.42", 54321)));
        MockServerWebExchange exchangeB = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "2.2.2.2")
                        .remoteAddress(new InetSocketAddress("203.0.113.42", 54321)));

        String keyA = resolver.resolve(exchangeA).block();
        String keyB = resolver.resolve(exchangeB).block();

        org.assertj.core.api.Assertions.assertThat(keyA).isEqualTo(keyB).isEqualTo("203.0.113.42");
    }

    @Test
    void ipKeyResolver_ForwardedForFromTrustedLocalProxy_IsTrusted() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "198.51.100.7, 172.18.0.5")
                        .remoteAddress(new InetSocketAddress("172.18.0.5", 54321)));

        StepVerifier.create(resolver.resolve(exchange))
                .expectNext("198.51.100.7")
                .verifyComplete();
    }

    @Test
    void userKeyResolver_ValidatedXUserIdHeaderPresent_ResolvesToUserId() {
        // On journal/ai/search routes this header is only ever the one
        // JwtAuthenticationFilter itself set from the verified JWT claim -
        // never a client-forged value, since that filter runs first and
        // discards/overwrites anything the caller sent.
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/journals")
                        .header("X-User-Id", "42")
                        .remoteAddress(new InetSocketAddress("203.0.113.42", 54321)));

        StepVerifier.create(userResolver.resolve(exchange))
                .expectNext("42")
                .verifyComplete();
    }

    @Test
    void userKeyResolver_DifferentUsersSameIp_ResolveToDifferentKeys() {
        // The reason this resolver exists instead of reusing ipKeyResolver -
        // a shared office/campus/carrier NAT must not let one heavy
        // authenticated user throttle every other user behind the same IP.
        MockServerWebExchange exchangeA = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/journals")
                        .header("X-User-Id", "1")
                        .remoteAddress(new InetSocketAddress("203.0.113.42", 54321)));
        MockServerWebExchange exchangeB = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/journals")
                        .header("X-User-Id", "2")
                        .remoteAddress(new InetSocketAddress("203.0.113.42", 54321)));

        String keyA = userResolver.resolve(exchangeA).block();
        String keyB = userResolver.resolve(exchangeB).block();

        org.assertj.core.api.Assertions.assertThat(keyA).isNotEqualTo(keyB);
    }

    @Test
    void userKeyResolver_NoUserIdHeader_FallsBackToIpRatherThanThrowing() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/journals")
                        .remoteAddress(new InetSocketAddress("203.0.113.42", 54321)));

        StepVerifier.create(userResolver.resolve(exchange))
                .expectNext("203.0.113.42")
                .verifyComplete();
    }
}
