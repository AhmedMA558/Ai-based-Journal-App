package com.aijournal.auth.service;

import com.aijournal.auth.dto.UserSummaryResponse;
import com.aijournal.common.dto.PagedResponse;
import org.springframework.data.domain.Pageable;

import java.util.Set;

public interface AdminService {
    PagedResponse<UserSummaryResponse> listUsers(Pageable pageable);
    UserSummaryResponse updateRoles(Long targetUserId, Long callerId, Set<String> roleNames);
    UserSummaryResponse updateStatus(Long targetUserId, Long callerId, boolean enabled);
}
