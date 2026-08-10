# recommendation-service

Curated prompts, books, meditation, music, exercise, and podcast suggestions. **Static content today** - `getPersonalizedRecommendations` normalizes the `currentMood` param (uppercases it, defaults to `NEUTRAL`) but the returned lists are hardcoded, not generated from journal history or any model. No database, no RabbitMQ, no calls to other services.

**Port:** 8086

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/recommendations` | Get recommendations for the caller's current mood (`currentMood` query param, defaults to `NEUTRAL`) |
| GET | `/api/v1/recommendations/prompts` | Get journal prompts (`category` query param accepted but currently ignored) |

## Run standalone

```bash
mvn -pl recommendation-service -am spring-boot:run
```
