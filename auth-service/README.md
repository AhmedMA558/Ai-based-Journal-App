# auth-service

Registration, login, JWT issuance/refresh, logout, MFA (TOTP-based 2FA), password change, and now real ROLE_ADMIN-gated user administration. The only routes the gateway does *not* attach its JWT filter to are `register`/`login`/`refresh`/`logout`/`mfa/verify`, since those must be reachable without a token. `auth-service`'s own `SecurityConfig` also `permitAll()`s those same specific paths - everything else on this service requires a valid token (see [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md#security-architecture) for the Phase 7 auth-gap fix).

**Port:** 8081
**Database:** MySQL, schema `auth_db` (Flyway-managed, `src/main/resources/db/migration`)

## Environment variables

| Variable | Required | Default | Notes |
|---|:---:|---|---|
| `JWT_SECRET` | yes | - | Signs/verifies every JWT platform-wide |
| `TOTP_ENCRYPTION_KEY` | yes | - | AES/GCM key for encrypting TOTP secrets at rest |
| `SPRING_DATASOURCE_URL` | no | `jdbc:mysql://localhost:3306/auth_db?...` | |
| `SPRING_DATASOURCE_USERNAME` | no | `root` | |
| `SPRING_DATASOURCE_PASSWORD` | no | `root` | |
| `NOTIFICATION_SERVICE_URL` | no | `http://notification-service:8087` | Where the best-effort welcome email is sent on registration |

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user account (always `ROLE_USER`). Also fires a real, best-effort welcome email via `notification-service` (forwards the newly-issued JWT; a failure here never fails registration itself). |
| POST | `/api/v1/auth/login` | Authenticate; returns tokens, or an MFA challenge if 2FA is enabled. Rejects a disabled account with 403. |
| POST | `/api/v1/auth/mfa/verify` | Complete login by verifying a TOTP/recovery code against an MFA challenge |
| POST | `/api/v1/auth/refresh` | Refresh the access token using the refresh token |
| POST | `/api/v1/auth/logout` | Revoke the refresh token |
| GET | `/api/v1/auth/me` | Get the authenticated user's identity |
| PUT | `/api/v1/auth/password` | Change the authenticated user's password (revokes all refresh tokens) |
| POST | `/api/v1/auth/password/forgot` | Request a password reset code by email. Always returns the same generic response regardless of whether the email is registered (no enumeration) - if it is, a real email is sent with a 10-character reset code (`XXXXX-XXXXX`, 30-minute expiry, single-use, same format as MFA recovery codes) |
| POST | `/api/v1/auth/password/reset` | Reset a password using a code from `/password/forgot` (revokes all refresh tokens, same as `/password` above) |
| GET/POST | `/api/v1/auth/mfa/status`, `/mfa/setup`, `/mfa/enable`, `/mfa/disable` | TOTP enrollment/management |

**Forgot-password internal auth note**: unlike the welcome-email trigger (which forwards the newly-registered user's own JWT), `/password/forgot` has no logged-in user's token to forward - the caller is by definition logged out. `auth-service` mints a short-lived (60s), synthetic internal token (`userId=0`, `roles=["ROLE_SYSTEM"]`) purely to authenticate that one server-to-server call into `notification-service`. `common-library`'s `JwtAuthenticationFilter` only validates the signature and reads claims, it never checks the user exists, so this passes cleanly with no new auth mechanism and `/api/v1/notifications/send-email` never has to become publicly callable.

### Admin endpoints (ROLE_ADMIN only, `@PreAuthorize`-gated)

Real role-based access control, added after an audit found the pieces existing (a real `roles` claim in every JWT, `common-library`'s filter already populating authorities) but `@EnableMethodSecurity` missing, and nothing to protect - `register()` always assigns `ROLE_USER` only, so nobody could ever reach a ROLE_ADMIN-gated endpoint without a seeded first admin. There is no admin surface over journal content anywhere in this platform - private data, deliberately not built.

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/auth/admin/users?page=&size=` | Paginated list of all user accounts |
| PUT | `/api/v1/auth/admin/users/{id}/roles` | Replace a user's role set - `ROLE_USER` is always retained regardless of what's sent. An admin can't remove their own `ROLE_ADMIN`. |
| PUT | `/api/v1/auth/admin/users/{id}/status` | Enable/disable an account - disabling revokes all of that account's refresh tokens. An admin can't disable their own account. |

**Bootstrap admin account** (`V3__seed_bootstrap_admin.sql`) - dev/demo only, solves the chicken-and-egg problem of nobody ever having `ROLE_ADMIN`:
- username: `admin`
- password: `AdminBootstrap123!`

**Rotate or remove this account before any real deployment.**

**Web UI**: `frontend`'s Settings modal has an Admin tab (visible only to `ROLE_ADMIN` users - gated client-side by decoding the JWT's `roles` claim, purely a UX nicety since the real enforcement is the `@PreAuthorize` above) for listing users and toggling roles/status against these same endpoints.

## Run standalone

```bash
mvn -pl auth-service -am spring-boot:run
```

Needs a reachable MySQL instance, `JWT_SECRET`, and `TOTP_ENCRYPTION_KEY` set.
