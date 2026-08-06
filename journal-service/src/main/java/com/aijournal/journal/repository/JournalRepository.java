package com.aijournal.journal.repository;

import com.aijournal.journal.entity.Journal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JournalRepository extends JpaRepository<Journal, Long> {
    Page<Journal> findByUserIdAndIsArchivedFalse(Long userId, Pageable pageable);
    Page<Journal> findByUserIdAndIsPinnedTrue(Long userId, Pageable pageable);
    Page<Journal> findByUserIdAndIsFavoriteTrue(Long userId, Pageable pageable);
    Page<Journal> findByUserIdAndIsArchivedTrue(Long userId, Pageable pageable);
    Optional<Journal> findByIdAndUserId(Long id, Long userId);
}
