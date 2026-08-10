# journal-service

Journal entry CRUD, plus pin/favorite/archive toggles and soft/permanent delete. Publishes `JournalCreatedEvent`/`JournalUpdatedEvent` to RabbitMQ on create/update (see `common-library`'s `JournalEventRouting` for the shared exchange/routing-key constants) - `search-service` is the only current consumer, keeping its Elasticsearch index in sync.

**Port:** 8083
**Database:** MySQL, schema `journal_db` (Flyway-managed, `src/main/resources/db/migration`)
**Messaging:** publishes to RabbitMQ (`journal.exchange`, topic exchange)

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |
| `SPRING_DATASOURCE_URL` | no | `jdbc:mysql://localhost:3306/journal_db?...` |
| `SPRING_DATASOURCE_USERNAME` | no | `root` |
| `SPRING_DATASOURCE_PASSWORD` | no | `root` |
| `SPRING_RABBITMQ_HOST` | no | `localhost` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/journals` | Create a journal entry or draft |
| PUT | `/api/v1/journals/{id}` | Update an existing entry |
| GET | `/api/v1/journals/{id}` | Get an entry by ID (ownership-checked) |
| GET | `/api/v1/journals` | Paginated list of active (non-archived) entries |
| GET | `/api/v1/journals/pinned` | Pinned entries |
| GET | `/api/v1/journals/favorites` | Favorited entries |
| GET | `/api/v1/journals/archived` | Archived entries |
| PATCH | `/api/v1/journals/{id}/pin` | Toggle pin status |
| PATCH | `/api/v1/journals/{id}/favorite` | Toggle favorite status |
| PATCH | `/api/v1/journals/{id}/archive` | Toggle archive status |
| DELETE | `/api/v1/journals/{id}` | Soft delete (recoverable) |
| DELETE | `/api/v1/journals/{id}/permanent` | Permanent delete (ownership-checked - this was a real IDOR bug fixed in Phase 1) |

`X-User-Id` is optional on every endpoint here and falls back to `1L` when absent, unlike most other services which require it - a real, intentional-but-worth-knowing inconsistency (see root `CLAUDE.md`).

## Run standalone

```bash
mvn -pl journal-service -am spring-boot:run
```

Needs MySQL and RabbitMQ reachable.
