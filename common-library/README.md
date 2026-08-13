# common-library

Shared library (not a deployable service) that every other Java module depends on. Provides:

- **`security.JwtUtils`** - static JWT parsing/validation/claim-extraction helpers, used platform-wide.
- **`security.JwtAuthenticationFilter`** - a servlet `OncePerRequestFilter` that independently validates the JWT on every request reaching a business service directly (defense-in-depth even if the gateway is bypassed), and force-overrides any caller-supplied `X-User-Id` header with the token-derived value so it can never be spoofed.
- **`security.JwtSecurityAutoConfiguration`** - Spring Boot auto-configuration that wires the filter above into a `SecurityFilterChain` for any consuming service that doesn't define its own (`@ConditionalOnMissingBean`) - `auth-service` is the one service that opts out, since it needs a different public/protected split.
- **`messaging.JournalEventRouting`** - shared RabbitMQ exchange/queue/routing-key constants so `journal-service` (producer) and `search-service` (consumer) never drift out of sync.
- **`messaging.RabbitMessagingAutoConfiguration`** - provides a shared Jackson-based `MessageConverter` bean so producer and consumer agree on JSON as the wire format (the default would otherwise be Java serialization, which a different service's JVM can't reliably deserialize).
- **`dto.ApiResponse<T>`** / **`dto.PagedResponse<T>`** - the response envelope every controller in this codebase wraps its payloads in (`{success, message, data, timestamp}`).
- **`exception.*`** - `ResourceNotFoundException`, `BadRequestException`, `UnauthorizedException`, `ForbiddenException` - shared `@ResponseStatus`-annotated exceptions.
- **`web.GlobalExceptionHandlingAutoConfiguration`** - a `@RestControllerAdvice`, reached by every consuming service the same auto-configuration way as the security filter above. Maps the four exception types just above to a clean `ApiResponse.error(...)` response at the right HTTP status, plus a catch-all for anything else (logs the real exception server-side, returns a generic non-leaking message) - before this existed, no `@ControllerAdvice` existed anywhere in the repo, so an unexpected exception reached the client as a raw, unstyled 500.
- **`event.*`** - `JournalCreatedEvent`, `JournalUpdatedEvent`, `JournalDeletedEvent`, `UserRegisteredEvent`, `MoodDetectedEvent` - plain serializable event DTOs.

No `application.yml`, no `main()` - packaged and consumed as a jar by every other module.
