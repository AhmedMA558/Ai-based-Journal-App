package com.aijournal.auth.repository;

import com.aijournal.auth.entity.PasswordResetToken;
import com.aijournal.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByResetCode(String resetCode);
    @Modifying
    int deleteByUser(User user);
}
