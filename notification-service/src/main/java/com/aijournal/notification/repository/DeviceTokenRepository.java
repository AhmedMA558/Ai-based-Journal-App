package com.aijournal.notification.repository;

import com.aijournal.notification.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    List<DeviceToken> findByUserId(Long userId);
    Optional<DeviceToken> findByUserIdAndExpoPushToken(Long userId, String expoPushToken);
    @Modifying
    int deleteByUserIdAndExpoPushToken(Long userId, String expoPushToken);
}
