package com.aijournal.user.service.impl;

import com.aijournal.user.entity.UserPreferences;
import com.aijournal.user.entity.UserProfile;
import com.aijournal.user.repository.UserPreferencesRepository;
import com.aijournal.user.repository.UserProfileRepository;
import com.aijournal.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final UserProfileRepository userProfileRepository;
    private final UserPreferencesRepository userPreferencesRepository;

    public UserServiceImpl(UserProfileRepository userProfileRepository, UserPreferencesRepository userPreferencesRepository) {
        this.userProfileRepository = userProfileRepository;
        this.userPreferencesRepository = userPreferencesRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfile getProfile(Long userId) {
        return userProfileRepository.findById(userId)
                .orElseGet(() -> userProfileRepository.save(new UserProfile(userId, "", "", "", "", "")));
    }

    @Override
    @Transactional
    public UserProfile updateProfile(Long userId, UserProfile updated) {
        UserProfile existing = getProfile(userId);
        existing.setBio(updated.getBio());
        existing.setAvatarUrl(updated.getAvatarUrl());
        existing.setPhoneNumber(updated.getPhoneNumber());
        existing.setCountry(updated.getCountry());
        existing.setCity(updated.getCity());
        return userProfileRepository.save(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public UserPreferences getPreferences(Long userId) {
        return userPreferencesRepository.findById(userId)
                .orElseGet(() -> userPreferencesRepository.save(new UserPreferences(userId, true, "UTC", "en", true, true, "20:00")));
    }

    @Override
    @Transactional
    public UserPreferences updatePreferences(Long userId, UserPreferences updated) {
        UserPreferences existing = getPreferences(userId);
        existing.setDarkMode(updated.getDarkMode());
        existing.setTimeZone(updated.getTimeZone());
        existing.setLanguage(updated.getLanguage());
        existing.setEmailNotifications(updated.getEmailNotifications());
        existing.setPushNotifications(updated.getPushNotifications());
        existing.setDailyReminderTime(updated.getDailyReminderTime());
        return userPreferencesRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteUserAccount(Long userId) {
        // Both rows are created lazily (get-or-create in getProfile/getPreferences
        // above) - a user who requests deletion without ever having viewed
        // either would make deleteById throw EmptyResultDataAccessException.
        if (userProfileRepository.existsById(userId)) {
            userProfileRepository.deleteById(userId);
        }
        if (userPreferencesRepository.existsById(userId)) {
            userPreferencesRepository.deleteById(userId);
        }
    }
}
