# python-ai-service

Flask NLP microservice. `ai-service` (Java) proxies to this over HTTP for every AI feature. Degrades to real, input-dependent (if non-ML) heuristics when no Hugging Face API key is configured - that's accepted default behavior, not a bug, and no external API key is required to run the stack locally.

**Port:** 5000 (`PORT` env var)

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/v1/ai/summarize` | Summarize text |
| POST | `/api/v1/ai/mood` | Detect mood |
| POST | `/api/v1/ai/rephrase` | Rephrase text |
| POST | `/api/v1/ai/grammar` | Fix grammar/spelling |
| POST | `/api/v1/ai/chat` | Chat over journal history |
| POST | `/api/v1/ai/tags` | Auto-generate tags |
| POST | `/api/v1/ai/recommendations` | Generate recommendations |

## Run standalone

```bash
cd python-ai-service
pip install -r requirements.txt
python app.py
```
