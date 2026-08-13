# search-service

Elasticsearch-backed search over journal entries. Consumes `JournalCreatedEvent`/`JournalUpdatedEvent`/`JournalDeletedEvent` from RabbitMQ (published by `journal-service`) to keep its index current - mood/tags aren't known yet at creation time (that's AI-service's job, not wired into this event), so newly-indexed documents get seeded with `mood="NEUTRAL"`/empty tags until an update event fills them in. The delete listener removes the corresponding document from the index on both a soft (trash) and a permanent delete - previously nothing did, so a deleted journal's plaintext title/content stayed fully searchable forever.

**Port:** 8085
**Storage:** Elasticsearch (index `journals`, no MySQL)
**Messaging:** consumes from RabbitMQ (`journal.created.queue`, `journal.updated.queue`, `journal.deleted.queue`)

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |
| `SPRING_ELASTICSEARCH_URIS` | no | `http://elasticsearch:9200` |
| `SPRING_RABBITMQ_HOST` | no | `localhost` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/search` | Multi-filter search (query text, mood, tag; `category` accepted but currently unsupported - no `category` field on the index) |
| GET | `/api/v1/search/semantic` | Relevance-ranked full-text search across title/content - "semantic" here means Elasticsearch match-query scoring, not ML-embeddings vector search |

`X-User-Id` is optional here too, same fallback-to-`1L` behavior as `journal-service`.

## Run standalone

```bash
mvn -pl search-service -am spring-boot:run
```

Needs Elasticsearch and RabbitMQ reachable.
