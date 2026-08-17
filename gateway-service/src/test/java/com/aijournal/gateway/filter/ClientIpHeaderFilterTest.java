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
        // A spoofed X-Real-IP from the actual client must never survive -
        // this filter runs at the very edge (HIGHEST_PRECEDENCE) specifically
        // so downstream services can trust the header unconditionally.
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
}
