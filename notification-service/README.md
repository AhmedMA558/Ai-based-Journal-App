# notification-service

Real push notifications, stubbed email. `sendPushNotification` looks up the caller's registered Expo push token(s) in `device_tokens` (its own MySQL database, `notification_db`) and sends a real HTTP request to Expo's push API (`https://exp.host/--/api/v2/push/send`) - not a fake/logged intent. A user with no registered device just gets skipped (logged, not an error). `sendEmail` is still logging-only - there's no real email provider (SMTP/SES/SendGrid) wired up despite the compose stack including a MailHog container for this purpose and `spring-boot-starter-mail` being on the classpath; that's a real, honestly-stated gap, not something this pass fixed.

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
| `expo.push.url` (application property, not an env var by convention here) | no | `https://exp.host/--/api/v2/push/send` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/notifications/send-email` | Log an email-send intent (`to`/`subject`/`body` in the request body) - still stubbed, see above |
| POST | `/api/v1/notifications/reminder` | Send a real daily-journal-reminder push to the caller's registered device(s) |
| POST | `/api/v1/notifications/device-token` | Register (or refresh) the caller's Expo push token - body `{expoPushToken, platform}` |
| DELETE | `/api/v1/notifications/device-token` | Unregister a device's Expo push token (e.g. on logout) - query param `expoPushToken` |

## Run standalone

```bash
mvn -pl notification-service -am spring-boot:run
```
