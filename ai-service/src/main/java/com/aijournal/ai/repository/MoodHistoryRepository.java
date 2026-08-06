package com.aijournal.ai.repository;

import com.aijournal.ai.entity.MoodHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MoodHistoryRepository extends JpaRepository<MoodHistory, Long> {
    List<MoodHistory> findByUserIdAndCreatedAtBetweenOrderByCreatedAtAsc(Long userId, LocalDateTime start, LocalDateTime end);
    List<MoodHistory> findTop30ByUserIdOrderByCreatedAtDesc(Long userId);
}
