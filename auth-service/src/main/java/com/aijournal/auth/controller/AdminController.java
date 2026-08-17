package com.aijournal.auth.controller;

import com.aijournal.auth.dto.UpdateAccountStatusRequest;
import com.aijournal.auth.dto.UpdateUserRolesRequest;
import com.aijournal.auth.dto.UserSummaryResponse;
import com.aijournal.auth.service.AdminService;
import com.aijournal.common.dto.ApiResponse;
import com.aijournal.common.dto.PagedResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// Every endpoint here is ROLE_ADMIN-only (@PreAuthorize, backed by
// @EnableMethodSecurity in SecurityConfig - see that class for why this
// needed adding explicitly rather than working automatically). There is no
// admin surface over journal content anywhere in this platform, deliberately -
// journals are private, an admin reading anyone's entries would be a privacy
// violation, not a feature.
@RestController
@RequestMapping("/api/v1/auth/admin")
@Tag(name = "Admin API", description = "ROLE_ADMIN-only user administration: list users, assign roles, enable/disable accounts")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all user accounts (paginated)")
    public ResponseEntity<ApiResponse<PagedResponse<UserSummaryResponse>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(adminService.listUsers(pageable)));
    }

    @PutMapping("/users/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Replace a user's role set - ROLE_USER is always retained regardless of what's sent")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> updateRoles(
            @RequestHeader("X-User-Id") Long callerId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRolesRequest request) {
        UserSummaryResponse response = adminService.updateRoles(id, callerId, request.getRoles());
        return ResponseEntity.ok(ApiResponse.success("Roles updated", response));
    }

    @PutMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Enable or disable a user account - disabling revokes all of that account's refresh tokens")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> updateStatus(
            @RequestHeader("X-User-Id") Long callerId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateAccountStatusRequest request) {
        UserSummaryResponse response = adminService.updateStatus(id, callerId, request.getEnabled());
        return ResponseEntity.ok(ApiResponse.success("Account status updated", response));
    }

    @PostMapping("/users/{id}/mfa-reset")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset (disable) a user's 2FA - escape hatch for a lost authenticator with no usable recovery codes left")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> resetMfa(
            @RequestHeader("X-User-Id") Long callerId,
            @PathVariable Long id) {
        UserSummaryResponse response = adminService.resetMfa(id, callerId);
        return ResponseEntity.ok(ApiResponse.success("2FA reset", response));
    }
}
