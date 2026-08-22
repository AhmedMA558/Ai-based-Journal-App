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

    // Native SQL bypasses both Journal's @SQLDelete (which only intercepts
    // Hibernate's own managed-entity-removal SQL generation, not an explicit
    // bulk statement) AND @SQLRestriction("is_deleted = false") (which
    // Hibernate can reapply to HQL bulk statements in some versions) - a raw
    // statement against the table entirely sidesteps both entity-level
    // annotations, guaranteeing a real row removal for "permanent" delete
    // regardless of whether the target was already soft-deleted (trashed)
    // first, which is the normal case for this method.
    @Modifying
    @Query(value = "DELETE FROM journals WHERE id = :id AND user_id = :userId", nativeQuery = true)
    int hardDeleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    // Ownership existence check that must succeed for a SOFT-DELETED
    // (trashed) journal too - findByIdAndUserId can't be reused here since
    // it goes through @SQLRestriction("is_deleted = false") and would 404
    // exactly the journals permanentDeleteJournal needs to reach (emptying
    // trash). Native SQL for the same restriction-bypass reason as above.
    @Query(value = "SELECT COUNT(*) FROM journals WHERE id = :id AND user_id = :userId", nativeQuery = true)
    long countByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    // Used by account deletion (deleteAllJournalsForUser) to enumerate every
    // id - including trashed ones, per the @SQLRestriction-bypass reasoning
    // above - so a JournalDeletedEvent can be published for each before the
    // bulk delete below removes the rows.
    @Query(value = "SELECT id FROM journals WHERE user_id = :userId", nativeQuery = true)
    java.util.List<Long> findIdsByUserId(@Param("userId") Long userId);

    // Same restriction-bypass reasoning as hardDeleteByIdAndUserId, scoped to
    // every journal a user owns instead of one - the real delete behind
    // account deletion.
    @Modifying
    @Query(value = "DELETE FROM journals WHERE user_id = :userId", nativeQuery = true)
    int hardDeleteAllByUserId(@Param("userId") Long userId);
}
