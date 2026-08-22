package com.aijournal.auth.repository;

import com.aijournal.auth.entity.MfaChallenge;
import com.aijournal.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MfaChallengeRepository extends JpaRepository<MfaChallenge, Long> {
    Optional<MfaChallenge> findByChallengeToken(String challengeToken);
    @Modifying
    int deleteByUser(User user);
    // Atomic DELETE...WHERE for the same reason RefreshTokenRepository has
    // one - closes the race where two concurrent /mfa/verify calls with the
    // same challengeToken (and a correct code) could both pass
    // findByChallengeToken()'s checks before either delete commits, and both
    // mint independent sessions from what should be a single-use challenge.
    @Modifying
    int deleteByChallengeToken(String challengeToken);
}
