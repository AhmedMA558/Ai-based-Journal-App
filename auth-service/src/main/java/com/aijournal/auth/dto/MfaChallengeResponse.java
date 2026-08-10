package com.aijournal.auth.dto;

public class MfaChallengeResponse {

    private boolean mfaRequired = true;
    private String challengeToken;
    private String message;

    public MfaChallengeResponse() {
    }

    public MfaChallengeResponse(String challengeToken, String message) {
        this.challengeToken = challengeToken;
        this.message = message;
    }

    public boolean isMfaRequired() { return mfaRequired; }
    public void setMfaRequired(boolean mfaRequired) { this.mfaRequired = mfaRequired; }
    public String getChallengeToken() { return challengeToken; }
    public void setChallengeToken(String challengeToken) { this.challengeToken = challengeToken; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
