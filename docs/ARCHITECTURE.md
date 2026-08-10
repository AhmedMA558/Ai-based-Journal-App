# Architecture

## Service inventory

| Service | Port | MySQL | RabbitMQ | Elasticsearch | Eureka |
|---|:---:|:---:|:---:|:---:|:---:|
| config-server | 8888 | - | - | - | - (is the config source) |
| discovery-server | 8761 | - | - | - | - (is the Eureka server) |
| gateway-service | 8080 | - | - | - | yes |
| auth-service | 8081 | `auth_db` | - | - | yes |
| user-service | 8082 | `user_db` | - | - | yes |
| journal-service | 8083 | `journal_db` | yes (producer) | - | yes |
| ai-service | 8084 | `ai_db` | - | - | yes (also calls `python-ai-service` over HTTP) |
| search-service | 8085 | - | yes (consumer) | yes | yes |
| recommendation-service | 8086 | - | - | - | yes |
| notification-service | 8087 | - | - | - | yes |
| analytics-service | 8088 | - | - | - | yes |
| file-service | 8089 | - | - | - | yes (local disk storage) |
| python-ai-service | 5000 | - | - | - | no (standalone Flask app, not a Eureka client) |

`notification-service` and `analytics-service` currently have no RabbitMQ, database, or Elasticsearch wiring at all - both serve their responses from static/hardcoded data today. `recommendation-service` is the same: static curated content, not model-generated.

## Gateway routing table

All routes are defined in `gateway-service/src/main/resources/application.yml`. Every route except `auth-service` carries the `JwtAuthenticationFilter` (auth's own endpoints - login/register/refresh/logout - must stay reachable without a token).

| Path prefix | Target | JWT filter |
|---|---|:---:|
| `/api/v1/auth/**` | auth-service:8081 | no |
| `/api/v1/users/**` | user-service:8082 | yes |
| `/api/v1/journals/**` | journal-service:8083 | yes |
| `/api/v1/ai/**` | ai-service:8084 | yes |
| `/api/v1/search/**` | search-service:8085 | yes |
| `/api/v1/recommendations/**` | recommendation-service:8086 | yes |
| `/api/v1/notifications/**` | notification-service:8087 | yes |
| `/api/v1/analytics/**` | analytics-service:8088 | yes |
| `/api/v1/files/**` | file-service:8089 | yes |

Every business service also independently validates the JWT via `common-library`'s `JwtAuthenticationFilter` (a servlet filter, separate from the gateway's reactive one) - this is deliberate defense-in-depth in case a service's port is reached directly, bypassing the gateway.

## Design patterns

1. **Strategy + Factory** (`ai-service`): `AiProviderStrategy` has two real implementations today - `FlaskAiStrategy` (proxies to `python-ai-service` over HTTP) and `MockAiStrategy` (canned responses, used as a fallback). `AiStrategyFactory` resolves the active one from the `ai.provider` config property (defaults to `flask`).
2. **Repository pattern**: Spring Data JPA repositories, soft-delete via `@SQLRestriction`/`@SQLDelete` on `Journal`, Flyway-managed schema per service.
3. **Event-driven pipeline**: `journal-service` publishes `JournalCreatedEvent`/`JournalUpdatedEvent` to a RabbitMQ topic exchange (`common-library`'s `JournalEventRouting` holds the shared exchange/queue/routing-key constants); `search-service`'s `@RabbitListener` consumes them to keep its Elasticsearch index current. No other service currently consumes these events.
4. **API Gateway pattern**: Spring Cloud Gateway does single-entry routing, CORS, and JWT verification/header injection (`X-User-Id`, `X-User-Email`) before forwarding to a service.

## Security architecture

- **JWT**: access tokens expire after 15 minutes, refresh tokens after 7 days (both configurable via `jwt.expiration-ms`/`jwt.refresh-expiration-ms`, defaults in `AuthServiceImpl`). Refresh tokens are plain rows in `auth_db` via `RefreshTokenRepository` - **not** Redis-backed. Redis is present in `docker-compose.yml` and on `gateway-service`'s classpath (`spring-boot-starter-data-redis-reactive`) but nothing in the codebase actually reads or writes to it today; it's provisioned infrastructure, not wired-up behavior.
- **Roles**: `Role` entities (`ROLE_USER`, `ROLE_ADMIN`, `ROLE_MODERATOR`) exist in the schema and are seeded (`V1__init_auth_schema.sql`), and are embedded as a claim in every issued JWT. No endpoint anywhere in the codebase currently checks them, though (`@PreAuthorize`/`hasRole`/`hasAuthority` all return zero matches repo-wide) - the data model supports role-based access control, but no authorization logic actually enforces it yet. Flagged here rather than left to be discovered as a silent gap.
- **Content encryption**: `Journal.contentEncrypted` is a boolean column with no corresponding encrypt/decrypt logic anywhere in `journal-service` - it's a placeholder for a future feature, not active behavior. The one thing in this codebase that *is* genuinely encrypted at rest is `auth-service`'s TOTP secret (AES/GCM via `TotpEncryptionService`, on the unmerged `feature/enterprise-settings-2fa` branch).
- **Auth gap closed in Phase 7**: `auth-service` previously had zero JWT enforcement on its own directly-reachable port (no gateway filter on that route by design, since login/register must be public, but the service's own `SecurityConfig` `permitAll()`'d everything else too). The MFA/password-change/`/me` endpoints added in that phase are the first ones on `auth-service` that require a valid token, closing that gap - see `auth-service/src/main/java/com/aijournal/auth/config/SecurityConfig.java`.

See [ER_DIAGRAM.md](ER_DIAGRAM.md) for the full schema.
