# Architecture Specification - AI Journaling Platform

## Domain & System Architecture

The AI Journaling Microservices Platform is built with enterprise domain-driven design (DDD) principles and reactive microservices patterns.

### Key Design Patterns Implemented:
1. **Strategy Pattern**: Used in `ai-service` (`AiProviderStrategy`) to support dynamic runtime switching between LLM providers (OpenAI, Claude, Gemini, Ollama, Mock).
2. **Factory Pattern**: `AiStrategyFactory` resolves active strategies based on configuration properties without code mutation.
3. **Repository Pattern**: Spring Data JPA repositories with soft-delete filtering (`@SQLRestriction`) and Flyway database migrations.
4. **Observer / Event-Driven Architecture**: RabbitMQ publishes `JournalCreatedEvent` and `JournalUpdatedEvent` asynchronously, triggering background AI processing, search indexing, and notification dispatch.
5. **API Gateway Pattern**: Spring Cloud Gateway provides single-entry routing, CORS management, and token verification headers (`X-User-Id`, `X-User-Email`).

### Security Architecture
- **Stateless JWT**: Short-lived JWT Access Tokens (15 mins) and sliding Refresh Tokens (7 days) with token rotation stored in Redis.
- **Role-Based Access Control (RBAC)**: `ROLE_USER`, `ROLE_ADMIN`, `ROLE_MODERATOR`.
- **Content Encryption**: Sensitive journal content is encrypted using AES-256 GCM prior to storage.
