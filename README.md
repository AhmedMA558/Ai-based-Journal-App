# AI Journaling Microservices Platform

An enterprise-grade, production-ready, AI-powered journaling platform built with **Java 21**, **Spring Boot 3.3.2**, **Spring Cloud (Eureka & Gateway)**, **Spring AI**, **MySQL 8**, **Redis**, **RabbitMQ**, and **Docker**.

---

## Key Features

- **Microservice Architecture**: 13 independently deployable microservices cleanly decoupled via Spring Cloud Gateway & Netflix Eureka.
- **Pluggable AI Strategy**: Switch seamlessly between **OpenAI**, **Anthropic Claude**, **Google Gemini**, **Local Ollama**, and **Mock AI** via `application.yml`.
- **Rich Journal Features**: Rich Text/Markdown, Autosave, Drafts, Pinned, Favorites, Archive, Soft & Permanent Delete, AES-256 Content Encryption, Version History, Attachments, Location & Weather tags.
- **15 AI Intelligence Capabilities**:
  1. Journal Summaries (Short, Detailed, Bullet)
  2. Mood Detection with Confidence Scores
  3. Emotion Timeline Analytics (Weekly, Monthly, Yearly)
  4. Context-Aware AI Recommendations
  5. AI-Generated Hashtags
  6. Natural Language Smart Search
  7. AI Chat with Journal (RAG / AI Memory)
  8. Habit Detection
  9. Goal Extraction & Progress Tracking
  10. Sentiment Analysis
  11. Writing & Grammar Improvement Suggestions
  12. AI Daily Reflection & Prompt Generator
  13. User Insights & Streak Tracking
  14. Personal Recommendation Engine
  15. Multi-Channel Notification Pipeline
- **Security**: JWT Access & Sliding Refresh Token Rotation, Password Encryption (BCrypt), RBAC, Security Filters.
- **Data Integrity**: Flyway DB Migrations, Optimistic Locking, Soft Delete filters, Audit fields.
- **DevOps & Monitoring**: Complete Docker Compose setup, Prometheus & Grafana metrics, OpenAPI/Swagger docs, Postman & Bruno collections, GitHub Actions CI pipeline.

---

## Architecture Diagram

```
                                      +-------------------------+
                                      |   Spring Cloud Gateway  | (Port 8080)
                                      +------------+------------+
                                                   |
         +--------------------+--------------------+--------------------+--------------------+
         |                    |                    |                    |                    |
  +------v-------+     +------v-------+     +------v-------+     +------v-------+     +------v-------+
  | Auth Service |     | User Service |     | Journal Svc  |     |  AI Service  |     | Search Svc   |
  |  (Port 8081) |     |  (Port 8082) |     |  (Port 8083) |     |  (Port 8084) |     |  (Port 8085) |
  +--------------+     +--------------+     +--------------+     +--------------+     +--------------+
```

---

## Quick Start (Docker Compose)

### 1. Clone & Build
```bash
git clone https://github.com/your-org/ai-journal-platform.git
cd ai-journal-platform
mvn clean install -DskipTests
```

### 2. Launch Infrastructure & Microservices
```bash
docker-compose up --build -d
```

### 3. Service URLs & Documentation
- **API Gateway**: `http://localhost:8080`
- **Eureka Service Discovery**: `http://localhost:8761`
- **Auth Service Swagger**: `http://localhost:8081/swagger-ui.html`
- **Journal Service Swagger**: `http://localhost:8083/swagger-ui.html`
- **AI Service Swagger**: `http://localhost:8084/swagger-ui.html`
- **RabbitMQ Management**: `http://localhost:15672` (guest/guest)
- **Mailhog Dashboard**: `http://localhost:8025`

---

## Microservices Breakdown

| Service Name | Port | Description |
| :--- | :--- | :--- |
| `config-server` | 8888 | Spring Cloud Config Server |
| `discovery-server` | 8761 | Netflix Eureka Service Registration |
| `gateway-service` | 8080 | API Gateway, Rate Limiter & JWT Routing |
| `auth-service` | 8081 | JWT Access/Refresh tokens, OAuth2, RBAC |
| `user-service` | 8082 | User Profiles, Dark Mode & Timezone Settings, GDPR |
| `journal-service` | 8083 | Journal CRUD, Drafts, Versioning, Encryption, Tags |
| `ai-service` | 8084 | Spring AI Strategy (OpenAI, Claude, Gemini, Ollama, Mock) |
| `search-service` | 8085 | Natural Language Semantic Search & Full-Text Search |
| `recommendation-service` | 8086 | Context-aware Prompts, Books, Meditation, Music |
| `notification-service` | 8087 | RabbitMQ Event Consumer, Daily Reminders & Email |
| `analytics-service` | 8088 | Streaks, Emotional Timelines, Writing Insights |
| `file-service` | 8089 | Local & S3 Storage Abstraction for Attachments |

---

## Testing & Quality Assurance

### Run Unit & Integration Tests
```bash
mvn test
```

Postman collection is available at `docs/ai-journal-platform.postman_collection.json`.
