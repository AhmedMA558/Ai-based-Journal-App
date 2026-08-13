# analytics-service

Real journal insights, computed from the caller's actual entries. `getUserJournalInsights` calls `journal-service` (forwarding the caller's own bearer token, no separate auth mechanism) for up to the user's 500 most recent journals and computes: total/average words written, a mood-frequency breakdown, the most frequent tags (`topTopics`), the day(s) of the week with the most entries, a rough writing-frequency pace, and a consecutive-day streak (current + longest - a Java port of `frontend/src/lib/journalStats.ts`'s `calculateStreak`). No database of its own; `journal-service` is the only source of truth. If `journal-service` is unreachable, insights degrade to honest zeroed values rather than an error.

**Real callers**: both `frontend`'s `AnalyticsView.tsx` and Mindora's `AnalyticsScreen.tsx` render a "Deeper Insights" section fed by this endpoint, additively alongside their own (correct, independently-tested) client-side mood/trend charts - a failure here never affects those charts, it just omits the section.

**Two fields intentionally dropped, not fixed**: the original stub also returned `mostMentionedPeople`/`mostMentionedPlaces` - real values would need named-entity extraction from journal content, which this platform has no NLP infrastructure for (`ai-service`'s Flask backend does mood/summarize/rephrase/grammar, not entity recognition). Rather than fake it, both fields were removed from the response entirely.

**Known simplification**: fetches a fixed `size=500` "effectively all" batch from `journal-service` rather than paging through a user's full history - a pragmatic choice for a demo-scale app, not a real pagination system.

**Port:** 8088

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |
| `JOURNAL_SERVICE_URL` | no | `http://journal-service:8083` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/analytics/insights` | Get real, computed journal insights for the caller |

## Run standalone

```bash
mvn -pl analytics-service -am spring-boot:run
```

Needs `journal-service` reachable (for real data - falls back to zeroed insights if it isn't).
