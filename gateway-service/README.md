# gateway-service

Spring Cloud Gateway - the single entry point for the frontend. Routes each `/api/v1/**` prefix to its backend service (see the routing table in [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md#gateway-routing-table)), handles CORS for the frontend origins, and runs a reactive `JwtAuthenticationFilter` on every route, including `auth-service`'s - the filter itself has an internal excluded-paths list (login/register/refresh/logout/mfa-verify/password-forgot/password-reset) that lets those specific requests through without a token; every other request is rejected (401) for a missing/malformed/expired/invalid token or one missing the `userId` claim, with verified `X-User-Id`/`X-User-Email` headers injected onto the forwarded request rather than trusting anything the client sent.

**Port:** 8080
**No database** - a real Redis instance backs the rate limiter below, no other persistence.

**Rate limiting**: `/api/v1/auth/login`, `/mfa/verify`, `/password/forgot`, and `/password/reset` - the four unauthenticated, brute-forceable auth endpoints - are IP-keyed and throttled via Spring Cloud Gateway's built-in `RequestRateLimiter` filter, backed by a real Redis-based token bucket (`burstCapacity: 5`, `replenishRate: 1`/sec - a handful of immediate retries, then throttled to 60/min sustained). **The four endpoints share one bucket per client IP**, not four independent ones - the `key-resolver` only sees the client's IP, not which of the four paths was hit, so hammering one endpoint spends the same budget as hammering any other. This is deliberate, not an oversight: an attacker can't reset their quota by pivoting from `/login` to `/mfa/verify`. A real user's ordinary login+MFA flow (one request each) stays well under the burst capacity either way. Everything else under `/api/v1/auth/**` (`/me`, `/password`, `/mfa/setup`, etc.) is unaffected - these two path sets are served by separate routes (`auth-service-sensitive` and `auth-service` in `application.yml`) pointed at the same backend. Exceeding the limit returns a plain `429` (no custom body). `register` is deliberately not rate-limited here - mass-account-creation abuse is a different problem than credential-guessing, and wasn't part of this pass's scope. This is not an account-lockout mechanism - it's anonymous, time-windowed, per-IP throttling; `User.accountNonLocked` remains unused, a separate, unbuilt feature.

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |

## Run standalone

```bash
mvn -pl gateway-service -am spring-boot:run
```

Needs `discovery-server` running for its own registration, and the target services running to actually route anywhere.
