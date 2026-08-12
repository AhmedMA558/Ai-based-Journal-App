package com.aijournal.auth.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.Set;

public class UpdateUserRolesRequest {

    @NotEmpty(message = "roles must not be empty")
    private Set<String> roles;

    public UpdateUserRolesRequest() {
    }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}
