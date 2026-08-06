CREATE TABLE IF NOT EXISTS mood_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    journal_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    detected_mood VARCHAR(50) NOT NULL,
    confidence_score DOUBLE NOT NULL,
    sentiment VARCHAR(20) NOT NULL,
    sentiment_score DOUBLE NOT NULL DEFAULT 0.0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mh_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goal_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    journal_id BIGINT NULL,
    goal_description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    target_date DATE NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gt_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detected_habits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    habit_name VARCHAR(100) NOT NULL,
    frequency_count INT NOT NULL DEFAULT 1,
    last_detected DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dh_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_journal_summaries (
    journal_id BIGINT PRIMARY KEY,
    short_summary TEXT NOT NULL,
    detailed_summary LONGTEXT NOT NULL,
    bullet_summary TEXT NOT NULL,
    ai_provider VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
