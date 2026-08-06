# Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ REFRESH_TOKENS : has
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned
    USERS ||--|| USER_PROFILES : has
    USERS ||--|| USER_PREFERENCES : has
    USERS ||--o{ JOURNALS : owns
    FOLDERS ||--o{ JOURNALS : organizes
    CATEGORIES ||--o{ JOURNALS : classifies
    JOURNALS ||--o{ JOURNAL_VERSIONS : tracks
    JOURNALS ||--o{ JOURNAL_TAGS : tagged
    JOURNALS ||--o{ JOURNAL_COMMENTS : contains
    JOURNALS ||--o{ JOURNAL_REACTIONS : receives
    USERS ||--o{ MOOD_HISTORY : records
    USERS ||--o{ GOAL_TRACKING : tracks
```

## Database Tables Summary

- `auth_db.users`: Core user accounts & OAuth2 provider mapping.
- `auth_db.refresh_tokens`: Sliding refresh tokens with revocation support.
- `user_db.user_profiles`: User bio, avatar, location.
- `user_db.user_preferences`: Dark mode, time zone, language settings.
- `journal_db.journals`: Primary rich-text / markdown entries with metrics, pin/favorite/archive flags, encryption, and full-text index.
- `ai_db.mood_history`: Emotion detection history & confidence scores over time.
- `ai_db.goal_tracking`: Extracted goals & status tracking (Pending, Progress, Completed).
