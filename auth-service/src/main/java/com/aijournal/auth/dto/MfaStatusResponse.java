package com.aijournal.auth.dto;

public class MfaStatusResponse {

    private boolean mfaEnabled;

    public MfaStatusResponse() {
    }

    public MfaStatusResponse(boolean mfaEnabled) {
        this.mfaEnabled = mfaEnabled;
    }

    public boolean isMfaEnabled() { return mfaEnabled; }
    public void setMfaEnabled(boolean mfaEnabled) { this.mfaEnabled = mfaEnabled; }
}
