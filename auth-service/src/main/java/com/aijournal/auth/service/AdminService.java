package com.aijournal.auth.service;

import com.aijournal.auth.dto.UserSummaryResponse;
import com.aijournal.common.dto.PagedResponse;
import org.springframework.data.domain.Pageable;

import java.util.Set;

public interface AdminService {
    PagedResponse<UserSummaryResponse> listUsers(Pageable pageable);
    UserSummaryResponse updateRoles(Long targetUserId, Long callerId, Set<String> roleNames);
    UserSummaryResponse updateStatus(Long targetUserId, Long callerId, boolean enabled);
    // Escape hatch for a user who lost their authenticator device and has
    // exhausted their recovery codes too - the self-service disableMfa()
    // recovery-code path (see AuthServiceImpl) covers the common case, this
    // covers what's left.
    UserSummaryResponse resetMfa(Long targetUserId, Long callerId);
}
