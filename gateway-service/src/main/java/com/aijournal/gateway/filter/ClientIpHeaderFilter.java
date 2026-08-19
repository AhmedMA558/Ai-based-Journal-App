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
//
// Prefers an incoming X-Forwarded-For/X-Real-IP (set by a trusted reverse
// proxy in front of the gateway, e.g. nginx) over the raw TCP peer address.
// Without this, once ANY reverse proxy sits in front of the gateway, the raw
// remote address becomes the proxy's own address for every single request -
// identical for every real client - silently corrupting both the rate
// limiter's per-client bucketing and every recorded login-history IP.
//
// That forwarded header is only trusted when the immediate TCP peer is
// itself a loopback/private-network address (see TrustedProxyAddresses) -
// gateway-service's port is published on the host so the frontend container
// can reach it, which also makes it directly reachable by anyone who
// bypasses nginx entirely. Without this check, an attacker hitting the
// gateway's port directly could set an arbitrary X-Forwarded-For and have it
// trusted unconditionally.
@Component
public class ClientIpHeaderFilter implements GlobalFilter, Ordered {

    private static final String HEADER_REAL_IP = "X-Real-IP";
    private static final String HEADER_FORWARDED_FOR = "X-Forwarded-For";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String clientIp = resolveClientIp(exchange);

        ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                .header(HEADER_REAL_IP, clientIp)
                .build();
        return chain.filter(exchange.mutate().request(modifiedRequest).build());
    }

    private String resolveClientIp(ServerWebExchange exchange) {
        if (TrustedProxyAddresses.isTrustedPeer(exchange.getRequest().getRemoteAddress())) {
            String forwardedFor = exchange.getRequest().getHeaders().getFirst(HEADER_FORWARDED_FOR);
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                return forwardedFor.split(",")[0].trim();
            }
            String realIp = exchange.getRequest().getHeaders().getFirst(HEADER_REAL_IP);
            if (realIp != null && !realIp.isBlank()) {
                return realIp.trim();
            }
        }
        return exchange.getRequest().getRemoteAddress() != null
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : "unknown";
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
