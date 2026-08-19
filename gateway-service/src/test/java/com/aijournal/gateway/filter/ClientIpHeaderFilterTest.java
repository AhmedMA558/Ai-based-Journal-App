package com.aijournal.gateway.filter;

import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpHeaderFilterTest {

    private final ClientIpHeaderFilter filter = new ClientIpHeaderFilter();

    @Test
    void filter_RequestWithRemoteAddress_StampsXRealIpOnDownstreamRequest() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login")
                        .remoteAddress(new InetSocketAddress("203.0.113.42", 54321)));

        ServerWebExchange[] downstream = new ServerWebExchange[1];
        filter.filter(exchange, (ex) -> {
            downstream[0] = ex;
            return Mono.empty();
        }).block();

        assertThat(downstream[0].getRequest().getHeaders().getFirst("X-Real-IP")).isEqualTo("203.0.113.42");
    }

    @Test
    void filter_NoRemoteAddress_StampsUnknownRatherThanThrowing() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login"));

        ServerWebExchange[] downstream = new ServerWebExchange[1];
        filter.filter(exchange, (ex) -> {
            downstream[0] = ex;
            return Mono.empty();
        }).block();

        assertThat(downstream[0].getRequest().getHeaders().getFirst("X-Real-IP")).isEqualTo("unknown");
    }

    @Test
    void filter_ClientSuppliedXRealIpHeader_IsOverwrittenWithTheRealAddress() {
        // A spoofed X-Real-IP from an untrusted (public-internet) peer must
        // never survive - gateway-service's port is reachable directly on
        // the host (needed so the frontend container can reach it), so
        // anyone bypassing nginx entirely could otherwise set this header
        // themselves and have it trusted unconditionally.
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login")
                        .header("X-Real-IP", "1.2.3.4")
                        .remoteAddress(new InetSocketAddress("203.0.113.42", 54321)));

        ServerWebExchange[] downstream = new ServerWebExchange[1];
        filter.filter(exchange, (ex) -> {
            downstream[0] = ex;
            return Mono.empty();
        }).block();

        assertThat(downstream[0].getRequest().getHeaders().get("X-Real-IP")).containsExactly("203.0.113.42");
    }

    @Test
    void filter_ForwardedForFromTrustedLocalProxy_IsTrusted() {
        // The real host-nginx -> frontend-container -> gateway chain: the
        // TCP peer gateway-service actually sees is always the frontend
        // container's own Docker-network address (private/loopback), never
        // the real client - so a forwarded header from a peer in that range
        // must still be trusted, or real client IPs would never resolve.
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "198.51.100.7, 172.18.0.5")
                        .remoteAddress(new InetSocketAddress("172.18.0.5", 54321)));

        ServerWebExchange[] downstream = new ServerWebExchange[1];
        filter.filter(exchange, (ex) -> {
            downstream[0] = ex;
            return Mono.empty();
        }).block();

        assertThat(downstream[0].getRequest().getHeaders().getFirst("X-Real-IP")).isEqualTo("198.51.100.7");
    }
}
