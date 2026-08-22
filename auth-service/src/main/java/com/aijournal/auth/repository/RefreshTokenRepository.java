package com.aijournal.auth.repository;

import com.aijournal.auth.entity.RefreshToken;
import com.aijournal.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    @Modifying
    int deleteByUser(User user);
    // A single atomic DELETE...WHERE, not a separate find-then-delete - this
    // is what closes the refresh-token-rotation race: two concurrent
    // /refresh calls racing on the same token can both pass a prior
    // findByToken()'s validity checks before either's delete commits, but
    // only one of them can ever get affected-row-count 1 here. The loser
    // (count 0) must be rejected instead of also minting a fresh session.
    @Modifying
    int deleteByToken(String token);
}
