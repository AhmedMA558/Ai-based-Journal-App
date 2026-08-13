# CLAUDE.md

Repo-specific context for Claude Code (or any agent/contributor) working in this codebase. See [README.md](README.md) for setup/run instructions and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full service/dependency tables - this file is about *gotchas*, not architecture restated.

## What this is

A 13-module Maven multi-module Spring Boot monorepo (`common-library` + 12 deployable services) behind a Spring Cloud Gateway, plus a Python Flask AI microservice and a React 19/TypeScript frontend. Java 21, Spring Boot 3.3.2, Spring Cloud 2023.0.3.

## The one thing worth internalizing before touching anything

**A feature looking done does not mean the backend behind it is real.** This has been true repeatedly, not once: `search-service` was fully mocked (hardcoded single result) despite a real Elasticsearch cluster sitting unused behind it; `ai-service`'s Rephrase/Fix Grammar endpoints 404'd for months because the buttons called paths with no `@PostMapping`, silently swallowed by a try/catch; the RabbitMQ journal→search pipeline was completely disconnected because the consumer's queue name didn't match the producer's; the dashboard's "Journaling Streak" widget showed total entry count, not a streak; and this project's own docs claimed Redis-backed refresh-token rotation, AES-256 content encryption, and enforced RBAC that none of the code actually implements (fixed in the docs phase, see git history on `docs/architecture-and-api-guides`). **Before building on top of something, grep for the real implementation. Don't trust a doc, a variable name, or a UI element's presence.**

## Workflow

One branch per phase/unit of work, cut from `main`, one commit per logical concern within it (`type(scope): summary`). See [CONTRIBUTING.md](CONTRIBUTING.md). No `gh` CLI/token access in this environment - branches get pushed, PRs are created and merged manually by the maintainer through the GitHub UI.

## Known inconsistencies (intentional-but-surprising, not bugs to silently "fix")

- **`X-User-Id` handling is inconsistent across services.** `user-service`, `recommendation-service`, `notification-service`, `analytics-service`, `file-service` require the header (`@RequestHeader("X-User-Id") Long userId`, 400s if absent). `journal-service` and `search-service` make it optional and silently default to `userId = 1L`, in both the controller *and* the service layer independently. If you're touching either of those two services, don't assume the header is always present.
- **`Journal.mood` has two layers of defaulting that can mask each other.** The entity's field initializer already sets `mood = "NEUTRAL"`, so `JournalServiceImpl.createJournal`'s `if (journal.getMood() == null) journal.setMood("HAPPY")` branch only actually fires when a caller explicitly sends `"mood": null` in the JSON body - a plain `new Journal()` or a request that just omits the `mood` key never triggers it. Found while writing `JournalServiceTest` in the backend-test-coverage phase; a test that assumes "unset" means "null" here will silently pass for the wrong reason.

## Testing conventions (see `docs/` READMEs and any `*Test.java` for examples)

JUnit 5 + `MockitoExtension`, `@Mock`/`@InjectMocks` on the `*Impl` class (not the interface), `ReflectionTestUtils` for `@Value`-injected fields, `ArgumentCaptor` for asserting saved/published state, `methodUnderTest_Scenario_ExpectedOutcome` naming, flat test classes (no `@Nested`). Controller tests construct the controller directly with a mocked service and call methods like a plain object - no `@WebMvcTest`/`MockMvc`, that's not an established pattern here. `journal-service`, `user-service`, and `search-service` have Testcontainers-backed integration tests (real MySQL/RabbitMQ) for the data/broker-touching layers - these need a working Docker daemon reachable from the JVM, which is **not guaranteed inside every sandboxed agent environment**: `docker ps`/`docker version` working via the CLI does not mean Testcontainers' Java client can reach the same daemon - a Docker Desktop proxy pipe can accept plain CLI calls while returning empty/400 responses to the raw Engine API calls Testcontainers needs. If those specific tests fail with a `DockerClientProviderStrategy`/`ContainerFetchException` error, that's very likely the sandbox, not the test - verify in real CI or on a normal machine before assuming the test is wrong.

## Branch status (check `git log --all --oneline` / `git branch -a` for current truth - this rots fast)

Phases 1-5 (security hardening, TS/Tailwind/shadcn frontend migration, real Elasticsearch search, router migration, dashboard/editor fixes) are merged to `main`. Phases 6 (DevOps/CI + K8s manifests) and 7 (real TOTP 2FA) are complete and pushed but **not yet merged** as of this writing - `k8s/` on `main` still has the old 2-service manifest; the real per-service manifests only exist on `devops/ci-and-k8s-manifests`. Phase 7's MFA/password-change/`/me` endpoints on `auth-service`, and the `additionalPublicPaths` constructor parameter on `common-library`'s `JwtAuthenticationFilter`, only exist on `feature/enterprise-settings-2fa`. Don't assume either is present on `main` without checking.
