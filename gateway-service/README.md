# gateway-service

Spring Cloud Gateway - the single entry point for the frontend. Routes each `/api/v1/**` prefix to its backend service (see the routing table in [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md#gateway-routing-table)), handles CORS for the frontend origins, and runs a reactive `JwtAuthenticationFilter` on every route except `auth-service`'s - rejecting (401) any request with a missing/malformed/expired/invalid token or a token missing the `userId` claim, and injecting verified `X-User-Id`/`X-User-Email` headers onto the forwarded request rather than trusting anything the client sent.

**Port:** 8080
**No database, no persistence** - this is a pure routing/auth layer.

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |

## Run standalone

```bash
mvn -pl gateway-service -am spring-boot:run
```

Needs `discovery-server` running for its own registration, and the target services running to actually route anywhere.
