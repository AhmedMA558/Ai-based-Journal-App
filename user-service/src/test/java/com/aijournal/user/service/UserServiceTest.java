package com.aijournal.user.service;

import com.aijournal.user.entity.UserPreferences;
import com.aijournal.user.entity.UserProfile;
import com.aijournal.user.repository.UserPreferencesRepository;
import com.aijournal.user.repository.UserProfileRepository;
import com.aijournal.user.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserPreferencesRepository userPreferencesRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(userService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(userService, "authServiceUrl", "http://auth-service:8081");
        ReflectionTestUtils.setField(userService, "journalServiceUrl", "http://journal-service:8083");
        ReflectionTestUtils.setField(userService, "fileServiceUrl", "http://file-service:8089");
    }

    @Test
    void getProfile_ExistingProfile_ReturnsItWithoutSaving() {
        UserProfile existing = new UserProfile(1L, "bio", "avatar.png", "555-1234", "US", "NYC");
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(existing));

        UserProfile result = userService.getProfile(1L);

        assertThat(result).isSameAs(existing);
        verify(userProfileRepository, never()).save(any());
    }

    @Test
    void getProfile_NoExistingProfile_CreatesAndSavesDefault() {
        when(userProfileRepository.findById(2L)).thenReturn(Optional.empty());
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfile result = userService.getProfile(2L);

        ArgumentCaptor<UserProfile> captor = ArgumentCaptor.forClass(UserProfile.class);
        verify(userProfileRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(2L);
        assertThat(result.getUserId()).isEqualTo(2L);
    }

    @Test
    void updateProfile_OverwritesAllFiveMutableFields() {
        UserProfile existing = new UserProfile(3L, "old bio", "old.png", "000", "CA", "Toronto");
        when(userProfileRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfile updates = new UserProfile(3L, "new bio", "new.png", "111", "UK", "London");
        UserProfile result = userService.updateProfile(3L, updates);

        assertThat(result.getBio()).isEqualTo("new bio");
        assertThat(result.getAvatarUrl()).isEqualTo("new.png");
        assertThat(result.getPhoneNumber()).isEqualTo("111");
        assertThat(result.getCountry()).isEqualTo("UK");
        assertThat(result.getCity()).isEqualTo("London");
    }

    @Test
    void getPreferences_ExistingPreferences_ReturnsItWithoutSaving() {
        UserPreferences existing = new UserPreferences(1L, false, "EST", "fr", false, false, "07:00");
        when(userPreferencesRepository.findById(1L)).thenReturn(Optional.of(existing));

        UserPreferences result = userService.getPreferences(1L);

        assertThat(result).isSameAs(existing);
        verify(userPreferencesRepository, never()).save(any());
    }

    @Test
    void getPreferences_NoExistingPreferences_CreatesAndSavesDefault() {
        when(userPreferencesRepository.findById(4L)).thenReturn(Optional.empty());
        when(userPreferencesRepository.save(any(UserPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferences result = userService.getPreferences(4L);

        ArgumentCaptor<UserPreferences> captor = ArgumentCaptor.forClass(UserPreferences.class);
        verify(userPreferencesRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(4L);
        assertThat(result.getUserId()).isEqualTo(4L);
    }

    @Test
    void updatePreferences_OverwritesAllSixMutableFields() {
        UserPreferences existing = new UserPreferences(5L, true, "UTC", "en", true, true, "20:00");
        when(userPreferencesRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(userPreferencesRepository.save(any(UserPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferences updates = new UserPreferences(5L, false, "PST", "es", false, false, "06:30");
        UserPreferences result = userService.updatePreferences(5L, updates);

        assertThat(result.getDarkMode()).isFalse();
        assertThat(result.getTimeZone()).isEqualTo("PST");
        assertThat(result.getLanguage()).isEqualTo("es");
        assertThat(result.getEmailNotifications()).isFalse();
        assertThat(result.getPushNotifications()).isFalse();
        assertThat(result.getDailyReminderTime()).isEqualTo("06:30");
    }

    @Test
    void updatePreferences_PartialUpdate_LeavesOmittedFieldsUnchanged() {
        // Regression guard: a partial PUT (e.g. {"darkMode": false}, the only
        // shape any real caller sends today) used to null out every other
        // NOT NULL column it omitted instead of leaving them untouched.
        UserPreferences existing = new UserPreferences(5L, true, "America/Chicago", "en", true, true, "20:00");
        when(userPreferencesRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(userPreferencesRepository.save(any(UserPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferences partialUpdate = new UserPreferences();
        partialUpdate.setDarkMode(false);

        UserPreferences result = userService.updatePreferences(5L, partialUpdate);

        assertThat(result.getDarkMode()).isFalse();
        assertThat(result.getTimeZone()).isEqualTo("America/Chicago");
        assertThat(result.getLanguage()).isEqualTo("en");
        assertThat(result.getEmailNotifications()).isTrue();
        assertThat(result.getPushNotifications()).isTrue();
        assertThat(result.getDailyReminderTime()).isEqualTo("20:00");
    }

    @Test
    void deleteUserAccount_DeletesFromBothRepositoriesAndCallsAuthJournalFileServices() {
        when(userProfileRepository.existsById(6L)).thenReturn(true);
        when(userPreferencesRepository.existsById(6L)).thenReturn(true);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(ResponseEntity.ok().build());

        userService.deleteUserAccount(6L, "Bearer test-token");

        verify(userProfileRepository).deleteById(6L);
        verify(userPreferencesRepository).deleteById(6L);
        verify(restTemplate).exchange(eq("http://auth-service:8081/api/v1/auth/account"), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class));
        verify(restTemplate).exchange(eq("http://journal-service:8083/api/v1/journals/all"), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class));
        verify(restTemplate).exchange(eq("http://file-service:8089/api/v1/files/all"), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    void deleteUserAccount_UserNeverViewedProfileOrPreferences_DoesNotThrow() {
        // Both rows are created lazily (get-or-create in getProfile/getPreferences)
        // - a brand-new user who requests deletion without ever having viewed
        // either would previously make deleteById throw
        // EmptyResultDataAccessException (an unhandled 500).
        when(userProfileRepository.existsById(7L)).thenReturn(false);
        when(userPreferencesRepository.existsById(7L)).thenReturn(false);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(ResponseEntity.ok().build());

        assertThatCode(() -> userService.deleteUserAccount(7L, "Bearer test-token")).doesNotThrowAnyException();

        verify(userProfileRepository, never()).deleteById(any());
        verify(userPreferencesRepository, never()).deleteById(any());
    }

    @Test
    void deleteUserAccount_AuthServiceCallFails_AbortsAndLeavesProfileDataUntouched() {
        // auth-service's delete is the one call that must succeed - its
        // failure must abort the whole operation instead of silently
        // deleting the local profile/preferences while login credentials
        // (and journal/file data) survive.
        when(restTemplate.exchange(eq("http://auth-service:8081/api/v1/auth/account"), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class)))
                .thenThrow(new org.springframework.web.client.ResourceAccessException("connection refused"));

        assertThatThrownBy(() -> userService.deleteUserAccount(8L, "Bearer test-token"))
                .isInstanceOf(IllegalStateException.class);

        verify(userProfileRepository, never()).deleteById(any());
        verify(userPreferencesRepository, never()).deleteById(any());
        verify(restTemplate, never()).exchange(contains("/journals/all"), any(), any(), eq(Void.class));
        verify(restTemplate, never()).exchange(contains("/files/all"), any(), any(), eq(Void.class));
    }

    @Test
    void deleteUserAccount_JournalServiceCallFails_StillSucceedsBecauseCleanupIsBestEffort() {
        // journal-service/file-service cleanup is best-effort - a failure
        // there must not undo the already-completed, authoritative parts
        // (auth-service credential deletion + local profile/preferences).
        when(userProfileRepository.existsById(9L)).thenReturn(true);
        when(userPreferencesRepository.existsById(9L)).thenReturn(true);
        when(restTemplate.exchange(eq("http://auth-service:8081/api/v1/auth/account"), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(ResponseEntity.ok().build());
        when(restTemplate.exchange(eq("http://journal-service:8083/api/v1/journals/all"), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class)))
                .thenThrow(new org.springframework.web.client.ResourceAccessException("connection refused"));
        when(restTemplate.exchange(eq("http://file-service:8089/api/v1/files/all"), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(ResponseEntity.ok().build());

        assertThatCode(() -> userService.deleteUserAccount(9L, "Bearer test-token")).doesNotThrowAnyException();

        verify(userProfileRepository).deleteById(9L);
        verify(userPreferencesRepository).deleteById(9L);
    }
}
