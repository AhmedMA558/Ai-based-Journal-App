package com.aijournal.gateway.config;

import com.aijournal.gateway.filter.TrustedProxyAddresses;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
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
//
// The forwarded header is only trusted when the immediate TCP peer passes
// TrustedProxyAddresses.isTrustedPeer (loopback/private-network only) -
// gateway-service's port is published on the host, so anyone bypassing
// nginx and hitting it directly could otherwise set a fresh X-Forwarded-For
// on every request and mint an unlimited number of rate-limit buckets,
// defeating the brute-force protection this resolver exists to back.
@Configuration
public class RateLimiterConfig {

    // @Primary is required, not cosmetic: Spring Cloud Gateway's own
    // RequestRateLimiterGatewayFilterFactory autowires a single default
    // KeyResolver via its constructor (used when a route's filter doesn't
    // specify key-resolver SpEL at all) - with two KeyResolver beans and
    // neither marked primary, that autowiring fails with an
    // UnsatisfiedDependencyException and the entire gateway fails to start.
    // Found live: this broke production (502s, crash-looping container)
    // immediately after userKeyResolver was added as a second bean - the
    // per-route "#{@ipKeyResolver}" / "#{@userKeyResolver}" SpEL references
    // in application.yml are unaffected by this and still resolve each
    // route's filter instance to the correct bean regardless of which one is
    // @Primary; this only fixes the ambiguous default-bean autowiring.
    @Primary
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            if (TrustedProxyAddresses.isTrustedPeer(exchange.getRequest().getRemoteAddress())) {
                String forwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
                if (forwardedFor != null && !forwardedFor.isBlank()) {
                    return Mono.just(forwardedFor.split(",")[0].trim());
                }
                String realIp = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
                if (realIp != null && !realIp.isBlank()) {
                    return Mono.just(realIp.trim());
                }
            }
            return Mono.just(
                    exchange.getRequest().getRemoteAddress() != null
                            ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                            : "unknown"
            );
        };
    }

    // Backs RequestRateLimiter on the journal/ai/search routes - unlike the
    // auth-sensitive route above, these all sit behind JwtAuthenticationFilter,
    // which already resolves and injects a trustworthy X-User-Id header before
    // this resolver ever runs (a client-supplied one is discarded, not
    // trusted - see JwtAuthenticationFilter.proceedWithClaims). Per-user
    // keying is the right choice here rather than reusing ipKeyResolver: an
    // office, campus, or mobile-carrier NAT can put many genuine authenticated
    // users behind one IP, which would otherwise let one heavy user's traffic
    // throttle everyone else sharing that address (the exact problem that
    // already forced the auth-sensitive route's limits to be widened once).
    // Falls back to IP only for the theoretical case of this filter being
    // attached to a route with no JWT filter ahead of it, so it never NPEs.
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null && !userId.isBlank()) {
                return Mono.just(userId);
            }
            return Mono.just(
                    exchange.getRequest().getRemoteAddress() != null
                            ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                            : "unknown"
            );
        };
    }
}
