package com.aijournal.auth.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateAccountStatusRequest {

    @NotNull(message = "enabled is required")
    private Boolean enabled;

    public UpdateAccountStatusRequest() {
    }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}
