package com.aijournal.auth.service;

import com.aijournal.auth.entity.LoginHistory;
import com.aijournal.auth.entity.User;
import com.aijournal.auth.repository.LoginHistoryRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

// A separate bean, not a private method on AuthServiceImpl, specifically so
// REQUIRES_NEW is real: login()/verifyMfa() call this on the FAILED path
// right before throwing to reject the attempt, and Spring's default
// rollback-on-RuntimeException would otherwise undo this save along with
// everything else in the caller's transaction the moment that exception
// propagates out - REQUIRES_NEW only takes effect through a real proxied
// bean-to-bean call, not a same-class self-invocation (@Transactional on a
// private method called via `this.` is silently never intercepted).
@Service
public class LoginHistoryRecorder {

    private static final Logger log = LoggerFactory.getLogger(LoginHistoryRecorder.class);

    private final LoginHistoryRepository loginHistoryRepository;

    public LoginHistoryRecorder(LoginHistoryRepository loginHistoryRepository) {
        this.loginHistoryRepository = loginHistoryRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordBestEffort(User user, String ipAddress, String userAgent, String status) {
        try {
            loginHistoryRepository.save(new LoginHistory(null, user, ipAddress, userAgent, status));
        } catch (Exception e) {
            log.warn("Could not record login history for user {}: {}", user.getId(), e.getMessage());
        }
    }
}
