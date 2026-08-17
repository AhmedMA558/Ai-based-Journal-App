package com.aijournal.auth.service;

import com.aijournal.auth.dto.UserSummaryResponse;
import com.aijournal.auth.entity.Role;
import com.aijournal.auth.entity.User;
import com.aijournal.auth.repository.MfaChallengeRepository;
import com.aijournal.auth.repository.MfaRecoveryCodeRepository;
import com.aijournal.auth.repository.RefreshTokenRepository;
import com.aijournal.auth.repository.RoleRepository;
import com.aijournal.auth.repository.UserRepository;
import com.aijournal.auth.service.impl.AdminServiceImpl;
import com.aijournal.common.dto.PagedResponse;
import com.aijournal.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private MfaChallengeRepository mfaChallengeRepository;

    @Mock
    private MfaRecoveryCodeRepository mfaRecoveryCodeRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(adminService, "jwtSecret", "defaultSecretKeyForTestingJwtTokenValidation1234567890");
        ReflectionTestUtils.setField(adminService, "notificationServiceUrl", "http://notification-service:8087");
        ReflectionTestUtils.setField(adminService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(adminService, "notificationExecutor", (Executor) Runnable::run);
    }

    private static User user(Long id, Role... roles) {
        return new User(id, "user" + id, "user" + id + "@example.com", "hashed", "User " + id,
                true, true, User.AuthProvider.LOCAL, null, Set.of(roles));
    }

    @Test
    void listUsers_ReturnsPagedResponseMappedToSummaries() {
        User u = user(1L, new Role(1L, Role.RoleName.ROLE_USER));
        when(userRepository.findAll(any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(u), PageRequest.of(0, 20), 1));

        PagedResponse<UserSummaryResponse> result = adminService.listUsers(PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getUsername()).isEqualTo("user1");
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    void updateRoles_AlwaysRetainsRoleUser_EvenWhenNotRequested() {
        User target = user(2L, new Role(1L, Role.RoleName.ROLE_USER));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(roleRepository.findByName(Role.RoleName.ROLE_MODERATOR))
                .thenReturn(Optional.of(new Role(3L, Role.RoleName.ROLE_MODERATOR)));
        when(roleRepository.findByName(Role.RoleName.ROLE_USER))
                .thenReturn(Optional.of(new Role(1L, Role.RoleName.ROLE_USER)));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserSummaryResponse response = adminService.updateRoles(2L, 99L, Set.of("ROLE_MODERATOR"));

        assertThat(response.getRoles()).containsExactlyInAnyOrder("ROLE_USER", "ROLE_MODERATOR");
    }

    @Test
    void updateRoles_UnknownRoleName_ThrowsBadRequest() {
        User target = user(2L, new Role(1L, Role.RoleName.ROLE_USER));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> adminService.updateRoles(2L, 99L, Set.of("ROLE_SUPERUSER")))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateRoles_SelfDemotionFromAdmin_ThrowsBadRequest() {
        User target = user(1L, new Role(2L, Role.RoleName.ROLE_ADMIN));
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> adminService.updateRoles(1L, 1L, Set.of("ROLE_USER")))
                .isInstanceOf(BadRequestException.class);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateStatus_Disable_RevokesRefreshTokensAndPendingMfaChallenge() {
        // A disabled account must lose both an existing refresh token AND any
        // still-outstanding MFA challenge (password already accepted, code
        // not yet entered) - otherwise the user could still complete login
        // via verifyMfa() after being disabled.
        User target = user(2L, new Role(1L, Role.RoleName.ROLE_USER));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        adminService.updateStatus(2L, 99L, false);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(refreshTokenRepository).deleteByUser(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(2L);
        verify(mfaChallengeRepository).deleteByUser(any(User.class));
        assertThat(target.getEnabled()).isFalse();
    }

    @Test
    void updateStatus_Disable_TriggersAccountEventNotification() {
        User target = user(2L, new Role(1L, Role.RoleName.ROLE_USER));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        adminService.updateStatus(2L, 99L, false);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<Map<String, Object>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("http://notification-service:8087/api/v1/notifications"),
                captor.capture(), eq(Void.class));
        HttpEntity<Map<String, Object>> entity = captor.getValue();
        assertThat(entity.getHeaders().getFirst("Authorization")).startsWith("Bearer ");
        assertThat(entity.getBody().get("userId")).isEqualTo(2L);
        assertThat(entity.getBody().get("type")).isEqualTo("SECURITY");
    }

    @Test
    void updateStatus_Enable_DoesNotRevokeRefreshTokensOrNotify() {
        User target = user(2L, new Role(1L, Role.RoleName.ROLE_USER));
        target.setEnabled(false);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        adminService.updateStatus(2L, 99L, true);

        verifyNoInteractions(refreshTokenRepository, mfaChallengeRepository, restTemplate);
        assertThat(target.getEnabled()).isTrue();
    }

    @Test
    void updateStatus_SelfDisable_ThrowsBadRequest() {
        assertThatThrownBy(() -> adminService.updateStatus(1L, 1L, false))
                .isInstanceOf(BadRequestException.class);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void resetMfa_ClearsSecretAndRecoveryCodesAndPendingChallenge() {
        // Escape hatch for a user who lost their authenticator device and has
        // exhausted their recovery codes too - the self-service recovery-code
        // path on disableMfa() (AuthServiceImpl) covers the common case, this
        // covers what's left.
        User target = user(2L, new Role(1L, Role.RoleName.ROLE_USER));
        target.setMfaEnabled(true);
        target.setTotpSecret("encryptedSecret");
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserSummaryResponse response = adminService.resetMfa(2L, 99L);

        assertThat(response.getMfaEnabled()).isFalse();
        assertThat(target.getMfaEnabled()).isFalse();
        assertThat(target.getTotpSecret()).isNull();
        verify(mfaRecoveryCodeRepository, times(1)).deleteByUser(target);
        verify(mfaChallengeRepository, times(1)).deleteByUser(target);
    }

    @Test
    void resetMfa_SelfTarget_ThrowsBadRequest() {
        assertThatThrownBy(() -> adminService.resetMfa(1L, 1L))
                .isInstanceOf(BadRequestException.class);
        verify(userRepository, never()).save(any(User.class));
    }
}
