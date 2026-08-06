package com.aijournal.ai.repository;

import com.aijournal.ai.entity.GoalTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalTrackingRepository extends JpaRepository<GoalTracking, Long> {
    List<GoalTracking> findByUserId(Long userId);
    List<GoalTracking> findByUserIdAndStatus(Long userId, String status);
}
