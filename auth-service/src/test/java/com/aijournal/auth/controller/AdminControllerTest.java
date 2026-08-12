package com.aijournal.auth.controller;

import com.aijournal.auth.dto.UpdateAccountStatusRequest;
import com.aijournal.auth.dto.UpdateUserRolesRequest;
import com.aijournal.auth.dto.UserSummaryResponse;
import com.aijournal.auth.service.AdminService;
import com.aijournal.common.dto.ApiResponse;
import com.aijournal.common.dto.PagedResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private AdminService adminService;

    @InjectMocks
    private AdminController controller;

    @Test
    void listUsers_DelegatesWithRequestedPageAndSize() {
        PagedResponse<UserSummaryResponse> paged = new PagedResponse<>(List.of(), 0, 20, 0, 0, true, true);
        when(adminService.listUsers(any(Pageable.class))).thenReturn(paged);

        ResponseEntity<ApiResponse<PagedResponse<UserSummaryResponse>>> response = controller.listUsers(0, 20);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(adminService).listUsers(any(Pageable.class));
    }

    @Test
    void updateRoles_DelegatesWithCallerAndTargetIds() {
        UpdateUserRolesRequest request = new UpdateUserRolesRequest();
        request.setRoles(Set.of("ROLE_MODERATOR"));
        UserSummaryResponse summary = new UserSummaryResponse(2L, "u", "u@x.com", "U", List.of("ROLE_USER", "ROLE_MODERATOR"), true, false, null);
        when(adminService.updateRoles(2L, 99L, Set.of("ROLE_MODERATOR"))).thenReturn(summary);

        ResponseEntity<ApiResponse<UserSummaryResponse>> response = controller.updateRoles(99L, 2L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(adminService).updateRoles(eq(2L), eq(99L), eq(Set.of("ROLE_MODERATOR")));
    }

    @Test
    void updateStatus_DelegatesWithCallerAndTargetIds() {
        UpdateAccountStatusRequest request = new UpdateAccountStatusRequest();
        request.setEnabled(false);
        UserSummaryResponse summary = new UserSummaryResponse(2L, "u", "u@x.com", "U", List.of("ROLE_USER"), false, false, null);
        when(adminService.updateStatus(2L, 99L, false)).thenReturn(summary);

        ResponseEntity<ApiResponse<UserSummaryResponse>> response = controller.updateStatus(99L, 2L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(adminService).updateStatus(2L, 99L, false);
    }
}
