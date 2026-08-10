# analytics-service

Journal insights dashboard data. **Hardcoded today** - `getUserJournalInsights` returns a fixed map (streaks, word counts, emotion breakdown, mentioned people/places, writing frequency, top topics) regardless of the actual user or their real journal entries. No database, no RabbitMQ, no calls to other services. (Note: the frontend's own dashboard streak/AI-level widgets were fixed to compute from real data client-side in Phase 5 - this backend endpoint is a separate, still-unwired piece.)

**Port:** 8088

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/analytics/insights` | Get the (currently static) insights payload for the caller |

## Run standalone

```bash
mvn -pl analytics-service -am spring-boot:run
```
