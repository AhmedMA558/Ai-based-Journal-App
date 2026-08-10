package com.aijournal.auth.repository;

import com.aijournal.auth.entity.MfaRecoveryCode;
import com.aijournal.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MfaRecoveryCodeRepository extends JpaRepository<MfaRecoveryCode, Long> {
    List<MfaRecoveryCode> findByUserAndUsedFalse(User user);
    @Modifying
    int deleteByUser(User user);
}
