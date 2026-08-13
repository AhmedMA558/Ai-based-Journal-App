# recommendation-service

Curated prompts, books, meditation, music, exercise, and podcast suggestions, genuinely differentiated by mood. If the caller doesn't supply `currentMood`, this service calls `journal-service` for the caller's 5 most recent journals (forwarding the same bearer token the caller's own request already carried - no separate service-to-service auth needed) and computes the real dominant mood among them (ties broken toward the more recent entry); no journals yet, or `journal-service` unreachable, both fall back to `NEUTRAL` gracefully rather than erroring. The six recommendation categories are bucketed by mood (positive/energized, calm, distressed, down, neutral) with genuinely different curated content per bucket - previously every bucket returned byte-identical lists regardless of what mood was passed in, "mood-aware" in name only.

Content itself is still curated/static, not AI-generated or model-based - same non-AI-fallback pattern used elsewhere in this platform (e.g. Mindora's keyword-matched chat replies). `getJournalPrompts` (the `/prompts` endpoint) is unchanged - still a fixed list regardless of `category`, not touched by this pass.

Wired into Mindora's Dashboard (`mobile/src/services/recommendationService.ts`) as of this phase - previously nothing called this service at all.

**Port:** 8086

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |
| `JOURNAL_SERVICE_URL` | no | `http://journal-service:8083` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/recommendations` | Get recommendations for the caller's real current mood - pass `currentMood` to override, or omit it to have it computed from real recent journal data |
| GET | `/api/v1/recommendations/prompts` | Get journal prompts (`category` query param accepted but currently ignored - unchanged this phase) |

## Run standalone

```bash
mvn -pl recommendation-service -am spring-boot:run
```

Needs a reachable `journal-service` (for real mood computation) and `JWT_SECRET` set.
