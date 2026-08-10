package com.aijournal.auth.dto;

import java.util.List;

public class MfaEnableResponse {

    private boolean mfaEnabled;
    // Plaintext, returned exactly once - never retrievable again after this response.
    private List<String> recoveryCodes;

    public MfaEnableResponse() {
    }

    public MfaEnableResponse(boolean mfaEnabled, List<String> recoveryCodes) {
        this.mfaEnabled = mfaEnabled;
        this.recoveryCodes = recoveryCodes;
    }

    public boolean isMfaEnabled() { return mfaEnabled; }
    public void setMfaEnabled(boolean mfaEnabled) { this.mfaEnabled = mfaEnabled; }
    public List<String> getRecoveryCodes() { return recoveryCodes; }
    public void setRecoveryCodes(List<String> recoveryCodes) { this.recoveryCodes = recoveryCodes; }
}
