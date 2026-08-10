# file-service

Attachment upload/download (images, video, PDF, voice notes), stored on local disk under `storage.local.dir` (default `./uploads`, one `user-{userId}/` subdirectory per user). The download endpoint has a real ownership/path-traversal check worth knowing about: it rejects any `path` containing `..` or not prefixed with the caller's own `user-{userId}/`, throwing a 403 - covered by `FileControllerTest` in Phase 8.

**Port:** 8089
**Storage:** local disk (no S3/object-storage backing yet - `FileStorageStrategy` is an interface, `LocalFileStorageStrategy` is the only implementation)

## Environment variables

| Variable | Required | Default |
|---|:---:|---|
| `JWT_SECRET` | yes | - |
| `storage.local.dir` (application property, not env) | no | `./uploads` |

Max upload size: 50MB (`spring.servlet.multipart.max-file-size`).

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/files/upload` | Upload a file for the caller, stored under `user-{userId}/` |
| GET | `/api/v1/files/download` | Download a file by `path` query param - 403s on path traversal or another user's prefix |

## Run standalone

```bash
mvn -pl file-service -am spring-boot:run
```

Single-replica assumption: since storage is local disk, running more than one instance would 404 on files uploaded to a different instance - a known limitation, not yet solved with shared/object storage.
