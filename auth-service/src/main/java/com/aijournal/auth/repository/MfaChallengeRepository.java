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
}
