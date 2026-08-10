# auth-service

Registration, login, JWT issuance/refresh, and logout. The only route the gateway does *not* attach its JWT filter to, since these endpoints must be reachable without a token. `auth-service`'s own `SecurityConfig` also `permitAll()`s these specific paths - everything else on this service requires a valid token (see [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md#security-architecture) for the Phase 7 auth-gap fix).

**Port:** 8081
**Database:** MySQL, schema `auth_db` (Flyway-managed, `src/main/resources/db/migration`)

## Environment variables

| Variable | Required | Default | Notes |
|---|:---:|---|---|
| `JWT_SECRET` | yes | - | Signs/verifies every JWT platform-wide |
| `SPRING_DATASOURCE_URL` | no | `jdbc:mysql://localhost:3306/auth_db?...` | |
| `SPRING_DATASOURCE_USERNAME` | no | `root` | |
| `SPRING_DATASOURCE_PASSWORD` | no | `root` | |

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user account |
| POST | `/api/v1/auth/login` | Authenticate and receive JWT access/refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh the access token using the refresh token |
| POST | `/api/v1/auth/logout` | Revoke the refresh token |

MFA (`/mfa/setup`, `/mfa/enable`, `/mfa/verify`, `/mfa/disable`, `/mfa/status`), password change, and `/me` endpoints exist on the unmerged `feature/enterprise-settings-2fa` branch - not yet on `main`.

## Run standalone

```bash
mvn -pl auth-service -am spring-boot:run
```

Needs a reachable MySQL instance and `JWT_SECRET` set.
