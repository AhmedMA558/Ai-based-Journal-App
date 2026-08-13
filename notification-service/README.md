# notification-service

Real push notifications, real email, and a real in-app notification log. `sendPushNotification` looks up the caller's registered Expo push token(s) in `device_tokens` (its own MySQL database, `notification_db`) and sends a real HTTP request to Expo's push API (`https://exp.host/--/api/v2/push/send`) - not a fake/logged intent. A user with no registered device just gets skipped (logged, not an error). `sendEmail` sends via a real `JavaMailSender` (SMTP) - in dev, `docker-compose.yml` points it at the already-running MailHog container (`mailhog:1025`, no auth needed) so every real email lands in MailHog's web UI at `http://localhost:8025` instead of a real inbox; production requires a real SMTP provider via `SPRING_MAIL_HOST`/`SPRING_MAIL_PORT` (no MailHog-shaped default there). A send failure is logged, not thrown - the same graceful-degradation bar `sendPushNotification` already holds for a missing device token. Its first real caller is `auth-service`, which fires a best-effort welcome email on successful registration.

**`/send-email` and `POST /api/v1/notifications` are `@PreAuthorize("hasRole('SYSTEM')")`-only** - both send/log something on a user's behalf as the platform itself, so neither is reachable with a normal user's own JWT (an audit found `/send-email` had no restriction at all, meaning any authenticated user could send arbitrary email from the platform's address; fixed alongside this). Only `auth-service` calls these, authenticating with a short-lived (60s) synthetic internal token it mints itself (`mintSystemToken()`) - the same mechanism the password-reset email already used, now also used for the welcome email (which previously, and less consistently, forwarded the new user's own access token instead).

The `notifications` table (own migration, `V2__add_notifications.sql`) backs a real per-user log, replacing what used to be a fully client-side fake: 3 hardcoded, timeless items with a permanently-stuck "2" unread badge on the web app. `auth-service` creates a real row on five genuine account-security events - password changed, password reset, MFA enabled, MFA disabled, and an admin disabling the account - via `notifyAccountEventBestEffort`, same best-effort/never-fails-the-real-operation bar as the email sends.

A daily reminder (`ReminderScheduler`, `@Scheduled(cron = "0 0 20 * * *", zone = "UTC")`) sends the same message to every device with a registered token, once a day at a fixed UTC time. **Known, documented simplification**: no per-user timezone, no check for whether the user already journaled today - both would need new functionality this service doesn't have yet (the latter specifically would need a cross-service call to `journal-service`, which doesn't exist today). It's a real, working, unconditional nudge - just not a personalized one.

Mobile push-token registration requires Mindora to run in a custom Expo dev client, not plain Expo Go - see `mobile/README.md` for why (Expo dropped remote push support from Expo Go on Android as of SDK 53).

**Port:** 8087

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |
| `SPRING_DATASOURCE_URL` | no | `jdbc:mysql://localhost:3306/notification_db?...` |
| `SPRING_DATASOURCE_USERNAME` | no | `root` |
| `SPRING_DATASOURCE_PASSWORD` | no | `root` |
| `SPRING_MAIL_HOST` | dev: no / prod: yes | `mailhog` (dev only) |
| `SPRING_MAIL_PORT` | dev: no / prod: yes | `1025` (dev only) |
| `NOTIFICATION_EMAIL_FROM` | no | `noreply@mindora.local` |
| `expo.push.url` (application property, not an env var by convention here) | no | `https://exp.host/--/api/v2/push/send` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/notifications/send-email` | **ROLE_SYSTEM only.** Send a real email via SMTP (`to`/`subject`/`body` in the request body) |
| POST | `/api/v1/notifications` | **ROLE_SYSTEM only.** Create a real notification-log row for a user - body `{userId, type, message}` |
| GET | `/api/v1/notifications?page=&size=` | List the authenticated user's own notifications, newest first |
| PUT | `/api/v1/notifications/read-all` | Mark all of the authenticated user's notifications as read |
| POST | `/api/v1/notifications/reminder` | Send a real daily-journal-reminder push to the caller's registered device(s) |
| POST | `/api/v1/notifications/device-token` | Register (or refresh) the caller's Expo push token - body `{expoPushToken, platform}` |
| DELETE | `/api/v1/notifications/device-token` | Unregister a device's Expo push token (e.g. on logout) - query param `expoPushToken` |

## Run standalone

```bash
mvn -pl notification-service -am spring-boot:run
```
