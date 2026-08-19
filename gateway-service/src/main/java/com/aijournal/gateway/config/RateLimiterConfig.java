package com.aijournal.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

// Backs the RequestRateLimiter filter on the auth-service-sensitive route
// (application.yml) - resolves the rate-limit bucket key by client IP, the
// standard choice for pre-authentication endpoints where no reliable
// per-account identity exists yet.
//
// Reads X-Forwarded-For / X-Real-IP first, falling back to the raw TCP peer
// address only when neither header is present (e.g. a direct, non-proxied
// call). This matters as soon as the gateway sits behind any reverse proxy:
// the raw remote address seen by the gateway is then the proxy's own
// address, identical for every request regardless of the real client - so
// without this, every user would silently share one rate-limit bucket.
// X-Forwarded-For can carry a comma-separated chain (client, proxy1, proxy2,
// ...); the first entry is the original client.
@Configuration
public class RateLimiterConfig {

    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String forwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                return Mono.just(forwardedFor.split(",")[0].trim());
            }
            String realIp = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) {
                return Mono.just(realIp.trim());
            }
            return Mono.just(
                    exchange.getRequest().getRemoteAddress() != null
                            ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                            : "unknown"
            );
        };
    }
}
