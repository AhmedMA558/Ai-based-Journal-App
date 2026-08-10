package com.aijournal.user.repository;

import com.aijournal.user.entity.UserPreferences;
import com.aijournal.user.entity.UserProfile;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class UserProfileRepositoryTest {

    @Container
    @ServiceConnection
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0");

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserPreferencesRepository userPreferencesRepository;

    @Test
    void save_NewProfile_PopulatesTimestampsOnPersist() {
        UserProfile profile = new UserProfile(1L, "bio", "avatar.png", "555-1234", "US", "NYC");

        UserProfile saved = userProfileRepository.save(profile);

        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void findById_ExistingProfile_ReturnsIt() {
        userProfileRepository.save(new UserProfile(2L, "bio", "avatar.png", "555-1234", "US", "NYC"));

        Optional<UserProfile> found = userProfileRepository.findById(2L);

        assertThat(found).isPresent();
        assertThat(found.get().getBio()).isEqualTo("bio");
    }

    @Test
    void findById_MissingProfile_ReturnsEmpty() {
        Optional<UserProfile> found = userProfileRepository.findById(999L);

        assertThat(found).isEmpty();
    }

    @Test
    void save_UpdatingExistingProfile_UpdatesUpdatedAtTimestamp() throws InterruptedException {
        UserProfile saved = userProfileRepository.save(new UserProfile(3L, "bio", null, null, null, null));
        var firstUpdatedAt = saved.getUpdatedAt();
        Thread.sleep(5);

        saved.setBio("changed bio");
        UserProfile updated = userProfileRepository.save(saved);
        userProfileRepository.flush();

        assertThat(updated.getUpdatedAt()).isAfterOrEqualTo(firstUpdatedAt);
        assertThat(updated.getBio()).isEqualTo("changed bio");
    }

    @Test
    void save_NewPreferences_PopulatesUpdatedAtOnPersist() {
        UserPreferences preferences = new UserPreferences(4L, true, "UTC", "en", true, true, "20:00");

        UserPreferences saved = userPreferencesRepository.save(preferences);

        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void findById_ExistingPreferences_ReturnsIt() {
        userPreferencesRepository.save(new UserPreferences(5L, false, "PST", "es", false, false, "06:30"));

        Optional<UserPreferences> found = userPreferencesRepository.findById(5L);

        assertThat(found).isPresent();
        assertThat(found.get().getTimeZone()).isEqualTo("PST");
    }
}
