package com.aijournal.journal.repository;

import com.aijournal.journal.entity.Journal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JournalRepository extends JpaRepository<Journal, Long> {
    Page<Journal> findByUserIdAndIsArchivedFalse(Long userId, Pageable pageable);
    Page<Journal> findByUserIdAndIsPinnedTrue(Long userId, Pageable pageable);
    Page<Journal> findByUserIdAndIsFavoriteTrue(Long userId, Pageable pageable);
    Page<Journal> findByUserIdAndIsArchivedTrue(Long userId, Pageable pageable);
    Optional<Journal> findByIdAndUserId(Long id, Long userId);

    // A JPQL bulk delete bypasses Journal's @SQLDelete entirely (that
    // annotation only intercepts Hibernate's own managed-entity-removal SQL
    // generation, not an explicit bulk statement) - this is the only way to
    // get a real row deletion for "permanent" delete, since a plain
    // .delete(entity) call always gets silently rewritten into the same
    // soft-delete UPDATE softDeleteJournal already relies on.
    @Modifying
    @Query("DELETE FROM Journal j WHERE j.id = :id AND j.userId = :userId")
    int hardDeleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}
