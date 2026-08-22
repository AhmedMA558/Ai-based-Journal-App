package com.aijournal.user.service;

import com.aijournal.user.entity.UserPreferences;
import com.aijournal.user.entity.UserProfile;

public interface UserService {
    UserProfile getProfile(Long userId);
    UserProfile updateProfile(Long userId, UserProfile profile);
    UserPreferences getPreferences(Long userId);
    UserPreferences updatePreferences(Long userId, UserPreferences preferences);
    // GDPR account deletion - authorizationHeader is the caller's own bearer
    // token, forwarded to auth-service/journal-service/file-service so each
    // can delete the same user's data under their own trusted ownership
    // checks, matching this codebase's established forward-the-caller's-own-
    // token pattern (already used by ai-service/analytics-service/
    // recommendation-service calling journal-service for reads).
    void deleteUserAccount(Long userId, String authorizationHeader);
}
