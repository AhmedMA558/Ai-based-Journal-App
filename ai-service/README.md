# ai-service

Java-side proxy for AI features. Delegates the actual NLP work to `python-ai-service` over HTTP via `FlaskAiStrategy` (the active strategy by default); `MockAiStrategy` is a canned-response fallback used when `ai.provider` isn't `flask`. Spring AI's `OpenAiAutoConfiguration` is explicitly excluded - despite the `spring-ai-bom` import in the root POM and a placeholder `spring.ai.openai.api-key`, no OpenAI/Claude/Gemini/Ollama integration actually exists in this codebase today.

**Port:** 8084
**Database:** MySQL, schema `ai_db` (Flyway-managed)
**Calls:** `python-ai-service` (`FLASK_AI_URL`, default `http://python-ai-service:5000`)

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |
| `SPRING_DATASOURCE_URL` | no | `jdbc:mysql://localhost:3306/ai_db?...` |
| `SPRING_DATASOURCE_USERNAME` | no | `root` |
| `SPRING_DATASOURCE_PASSWORD` | no | `root` |
| `AI_PROVIDER` | no | `flask` |
| `FLASK_AI_URL` | no | `http://python-ai-service:5000` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/ai/summarize` | Generate short/detailed/bullet summaries |
| POST | `/api/v1/ai/mood` | Detect mood with confidence + emoji |
| GET | `/api/v1/ai/emotion-timeline` | Weekly/monthly/yearly emotion timeline |
| POST | `/api/v1/ai/recommendations` | Context-aware recommendations |
| POST | `/api/v1/ai/tags` | Auto-generate tags |
| POST | `/api/v1/ai/chat` | Chat over journal history |
| POST | `/api/v1/ai/habits` | Habit detection |
| POST | `/api/v1/ai/goals` | Extract & track goals |
| POST | `/api/v1/ai/sentiment` | Sentiment analysis |
| POST | `/api/v1/ai/writing-improvements` | Grammar/clarity/vocabulary suggestions |
| POST | `/api/v1/ai/daily-reflection` | Daily reflection questions |
| POST | `/api/v1/ai/rephrase` | Rephrase text (proxies to `python-ai-service`) |
| POST | `/api/v1/ai/grammar` | Fix grammar/spelling (proxies to `python-ai-service`) |

## Run standalone

```bash
mvn -pl ai-service -am spring-boot:run
```

Needs MySQL and (for real, non-mock responses) a reachable `python-ai-service`.
