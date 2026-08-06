package com.aijournal.user.service;

import com.aijournal.user.entity.UserPreferences;
import com.aijournal.user.entity.UserProfile;

public interface UserService {
    UserProfile getProfile(Long userId);
    UserProfile updateProfile(Long userId, UserProfile profile);
    UserPreferences getPreferences(Long userId);
    UserPreferences updatePreferences(Long userId, UserPreferences preferences);
    void deleteUserAccount(Long userId); // GDPR Compliant Data Deletion
}
