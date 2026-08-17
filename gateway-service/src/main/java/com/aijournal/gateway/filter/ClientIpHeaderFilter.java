package com.aijournal.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

// Applies to every route automatically (a GlobalFilter, unlike
// JwtAuthenticationFilter which needs listing per-route) - stamps the real
// client IP onto every proxied request as X-Real-IP, using the exact same
// extraction RateLimiterConfig.ipKeyResolver() already relies on. Downstream
// services (auth-service's login-history feature) read this rather than
// trusting Spring Cloud Gateway's default forwarded-header behavior, which
// isn't guaranteed without explicit configuration this codebase doesn't have.
@Component
public class ClientIpHeaderFilter implements GlobalFilter, Ordered {

    private static final String HEADER_REAL_IP = "X-Real-IP";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String clientIp = exchange.getRequest().getRemoteAddress() != null
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : "unknown";

        ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                .header(HEADER_REAL_IP, clientIp)
                .build();
        return chain.filter(exchange.mutate().request(modifiedRequest).build());
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
