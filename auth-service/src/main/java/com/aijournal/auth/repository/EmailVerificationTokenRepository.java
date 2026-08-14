package com.aijournal.auth.repository;

import com.aijournal.auth.entity.EmailVerificationToken;
import com.aijournal.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByVerificationCode(String verificationCode);
    @Modifying
    int deleteByUser(User user);
}
