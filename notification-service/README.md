# notification-service

Email/push notification endpoints. **Logging only today** - `sendEmail`/`sendPushNotification` just log the intent (`log.info(...)`); there's no real email provider (SMTP/SES/SendGrid) or push provider (FCM/APNs) wired up despite the compose stack including a MailHog container for this purpose. No database, no RabbitMQ.

**Port:** 8087

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/notifications/send-email` | Log an email-send intent (`to`/`subject`/`body` in the request body) |
| POST | `/api/v1/notifications/reminder` | Log a daily-journal-reminder push intent for the caller |

## Run standalone

```bash
mvn -pl notification-service -am spring-boot:run
```
