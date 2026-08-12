package com.aijournal.auth.service;

import com.aijournal.auth.dto.UserSummaryResponse;
import com.aijournal.auth.entity.Role;
import com.aijournal.auth.entity.User;
import com.aijournal.auth.repository.RefreshTokenRepository;
import com.aijournal.auth.repository.RoleRepository;
import com.aijournal.auth.repository.UserRepository;
import com.aijournal.auth.service.impl.AdminServiceImpl;
import com.aijournal.common.dto.PagedResponse;
import com.aijournal.common.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private AdminServiceImpl adminService;

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
    void updateStatus_Disable_RevokesRefreshTokens() {
        User target = user(2L, new Role(1L, Role.RoleName.ROLE_USER));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        adminService.updateStatus(2L, 99L, false);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(refreshTokenRepository).deleteByUser(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(2L);
        assertThat(target.getEnabled()).isFalse();
    }

    @Test
    void updateStatus_Enable_DoesNotRevokeRefreshTokens() {
        User target = user(2L, new Role(1L, Role.RoleName.ROLE_USER));
        target.setEnabled(false);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        adminService.updateStatus(2L, 99L, true);

        verifyNoInteractions(refreshTokenRepository);
        assertThat(target.getEnabled()).isTrue();
    }

    @Test
    void updateStatus_SelfDisable_ThrowsBadRequest() {
        assertThatThrownBy(() -> adminService.updateStatus(1L, 1L, false))
                .isInstanceOf(BadRequestException.class);
        verify(userRepository, never()).save(any(User.class));
    }
}
