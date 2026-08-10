# user-service

Profile and preferences storage. Both `getProfile`/`getPreferences` follow a get-or-create pattern - a first request for a user with no row yet creates and persists sensible defaults rather than 404ing.

**Port:** 8082
**Database:** MySQL, schema `user_db` (Flyway-managed, `src/main/resources/db/migration`)

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |
| `SPRING_DATASOURCE_URL` | no | `jdbc:mysql://localhost:3306/user_db?...` |
| `SPRING_DATASOURCE_USERNAME` | no | `root` |
| `SPRING_DATASOURCE_PASSWORD` | no | `root` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/users/profile` | Get the caller's profile (creates a default row if none exists) |
| PUT | `/api/v1/users/profile` | Update profile (bio, avatarUrl, phoneNumber, country, city - all five overwritten unconditionally) |
| GET | `/api/v1/users/preferences` | Get settings (dark mode, timezone, language, notification toggles) |
| PUT | `/api/v1/users/preferences` | Update settings |
| DELETE | `/api/v1/users/account` | Delete the profile + preferences rows for the caller (GDPR deletion) |

All endpoints read the caller's identity from the `X-User-Id` header, which is set from the verified JWT by the gateway/`common-library` filter - never trust this header on a direct, unauthenticated call.

## Run standalone

```bash
mvn -pl user-service -am spring-boot:run
```
