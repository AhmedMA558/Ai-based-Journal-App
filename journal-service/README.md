# journal-service

Journal entry CRUD, plus pin/favorite/archive toggles and soft/permanent delete. Publishes `JournalCreatedEvent`/`JournalUpdatedEvent` to RabbitMQ on create/update (see `common-library`'s `JournalEventRouting` for the shared exchange/routing-key constants) - `search-service` is the only current consumer, keeping its Elasticsearch index in sync.

**Port:** 8083
**Database:** MySQL, schema `journal_db` (Flyway-managed, `src/main/resources/db/migration`)
**Messaging:** publishes to RabbitMQ (`journal.exchange`, topic exchange)

## Content encryption

Journal content is encrypted at rest with AES/GCM (`JournalEncryptionService`, same algorithm as `auth-service`'s TOTP secret encryption, but a separate key - `JOURNAL_ENCRYPTION_KEY`, never reused across services). Every create/update encrypts `content` and sets `contentEncrypted = true` before saving; every read path (`getJournalById`, the list endpoints, and the pin/favorite/archive toggles, which also return the full entity) decrypts it back before returning, so callers - including the RabbitMQ event `search-service` indexes - always see plaintext.

**Scope: opt-in going forward, not backfilled.** Rows created before this shipped stay `contentEncrypted = false` and are read back exactly as stored, unchanged - there is no migration that re-encrypts existing entries. This mirrors Phase 7's MFA rollout (new capability applies from the moment it ships, not retroactively).

`JOURNAL_ENCRYPTION_KEY` is required - the service fails fast at startup if it's unset. Generate one the same way as `TOTP_ENCRYPTION_KEY`: `openssl rand -base64 64`.

Two schema notes, not touched by this feature: the unused `FULLTEXT INDEX` on `title`/`content` (nothing ever queried it - full-text search is real Elasticsearch via `search-service`, not MySQL `MATCH...AGAINST`) was dropped in `V2__drop_unused_fulltext_index.sql`, since it would've become misleading once `content` holds ciphertext for new rows. `journal_versions` remains a dormant table with no active entity/repository anywhere in this codebase - out of scope here too.

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |
| `JOURNAL_ENCRYPTION_KEY` | yes | - |
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
