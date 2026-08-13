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
| recommendation-service | 8086 | - | - | - | yes (also calls `journal-service` over HTTP) |
| notification-service | 8087 | `notification_db` | - | - | yes |
| analytics-service | 8088 | - | - | - | yes (also calls `journal-service` over HTTP) |
| file-service | 8089 | - | - | - | yes (local disk storage) |
| python-ai-service | 5000 | - | - | - | no (standalone Flask app, not a Eureka client) |

None of `recommendation-service`, `notification-service`, or `analytics-service` use RabbitMQ or Elasticsearch. All three are real, not stubbed: `recommendation-service` and `analytics-service` compute their responses from the caller's actual journals (fetched from `journal-service` over HTTP, forwarding the caller's own bearer token rather than inventing new service-to-service auth) - `recommendation-service`'s content itself stays curated/static per mood bucket, not model-generated; `analytics-service`'s numbers (streaks, word counts, top topics) are genuinely computed. `notification-service` has its own database (`notification_db`) for registered push tokens and sends real push notifications via Expo's API plus a daily reminder scheduler - no RabbitMQ involved.

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
- **Roles**: `Role` entities (`ROLE_USER`, `ROLE_ADMIN`, `ROLE_MODERATOR`) exist in the schema (`V1__init_auth_schema.sql`) and are embedded as a claim in every issued JWT, correctly derived from `user.getRoles()`. `common-library`'s servlet `JwtAuthenticationFilter` has always converted that claim into real `SimpleGrantedAuthority`s on `SecurityContextHolder` - the missing piece was `@EnableMethodSecurity` (without it, `@PreAuthorize` is silently never evaluated) plus something to actually protect. Both were added in a later phase: `@EnableMethodSecurity` on `JwtSecurityAutoConfiguration` (platform-wide) and `auth-service`'s own `SecurityConfig` (which opts out of that auto-config), plus a real `ROLE_ADMIN`-gated admin surface - `auth-service`'s `AdminController` (`GET /api/v1/auth/admin/users`, `PUT .../roles`, `PUT .../status`) - and a seeded bootstrap admin account, since nothing could otherwise ever be assigned `ROLE_ADMIN` (`register()` always assigns `ROLE_USER` only). No admin surface exists over journal content anywhere - that's private data, deliberately not built. See `auth-service/README.md` for the bootstrap credential and full endpoint list.
- **Content encryption**: journal content is encrypted at rest with AES/GCM via `journal-service`'s `JournalEncryptionService` (same algorithm as `auth-service`'s `TotpEncryptionService`, a separate key - `JOURNAL_ENCRYPTION_KEY`, not `TOTP_ENCRYPTION_KEY`). `JournalServiceImpl` encrypts content and sets `contentEncrypted = true` before every create/update save, and decrypts it back before returning any entity to a caller (`getJournalById`, the list endpoints, and the pin/favorite/archive toggles) - `JournalController` serializes the raw entity directly, so this decrypt-on-read step is what keeps the API response and the RabbitMQ event `search-service` consumes both carrying real plaintext, not ciphertext. Scope is opt-in-going-forward only: existing rows created before this shipped stay plaintext with `contentEncrypted = false` and are read back unchanged, no backfill migration included (same shape as Phase 7's MFA rollout).
- **Auth gap closed in Phase 7**: `auth-service` previously had zero JWT enforcement on its own directly-reachable port (no gateway filter on that route by design, since login/register must be public, but the service's own `SecurityConfig` `permitAll()`'d everything else too). The MFA/password-change/`/me` endpoints added in that phase are the first ones on `auth-service` that require a valid token, closing that gap - see `auth-service/src/main/java/com/aijournal/auth/config/SecurityConfig.java`.

See [ER_DIAGRAM.md](ER_DIAGRAM.md) for the full schema.
