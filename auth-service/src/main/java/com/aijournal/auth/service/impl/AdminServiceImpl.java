package com.aijournal.auth.service.impl;

import com.aijournal.auth.dto.UserSummaryResponse;
import com.aijournal.auth.entity.Role;
import com.aijournal.auth.entity.User;
import com.aijournal.auth.repository.RefreshTokenRepository;
import com.aijournal.auth.repository.RoleRepository;
import com.aijournal.auth.repository.UserRepository;
import com.aijournal.auth.service.AdminService;
import com.aijournal.common.dto.PagedResponse;
import com.aijournal.common.exception.BadRequestException;
import com.aijournal.common.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public AdminServiceImpl(UserRepository userRepository, RoleRepository roleRepository,
                             RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<UserSummaryResponse> listUsers(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        return new PagedResponse<>(
                page.getContent().stream().map(this::toSummary).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast(),
                page.isFirst()
        );
    }

    @Override
    @Transactional
    public UserSummaryResponse updateRoles(Long targetUserId, Long callerId, Set<String> roleNames) {
        User target = getUserOrThrow(targetUserId);

        Set<Role.RoleName> requested = new HashSet<>();
        for (String name : roleNames) {
            try {
                requested.add(Role.RoleName.valueOf(name));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Unknown role: " + name);
            }
        }
        // Every user always keeps ROLE_USER regardless of what's requested -
        // this endpoint can never lock a user out of baseline access.
        requested.add(Role.RoleName.ROLE_USER);

        if (targetUserId.equals(callerId) && !requested.contains(Role.RoleName.ROLE_ADMIN)) {
            throw new BadRequestException("You cannot remove your own ROLE_ADMIN.");
        }

        Set<Role> roles = new HashSet<>();
        for (Role.RoleName name : requested) {
            roles.add(roleRepository.findByName(name)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "name", name)));
        }
        target.setRoles(roles);
        User saved = userRepository.save(target);
        return toSummary(saved);
    }

    @Override
    @Transactional
    public UserSummaryResponse updateStatus(Long targetUserId, Long callerId, boolean enabled) {
        if (targetUserId.equals(callerId)) {
            throw new BadRequestException("You cannot change your own account status.");
        }
        User target = getUserOrThrow(targetUserId);
        target.setEnabled(enabled);
        User saved = userRepository.save(target);
        if (!enabled) {
            // Same reasoning as changePassword's stolen-device handling - a
            // disabled account's active session must not survive.
            refreshTokenRepository.deleteByUser(saved);
        }
        return toSummary(saved);
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private UserSummaryResponse toSummary(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRoles().stream().map(r -> r.getName().name()).sorted().toList(),
                user.getEnabled(),
                user.getMfaEnabled(),
                user.getCreatedAt()
        );
    }
}
