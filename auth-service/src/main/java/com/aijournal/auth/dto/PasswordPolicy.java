package com.aijournal.auth.dto;

// Single source of truth for the password complexity rule, shared across
// RegisterRequest/ResetPasswordRequest/ChangePasswordRequest via @Pattern so
// all three places a password can be set enforce the identical policy - a
// regex this specific duplicated three times invites a silent divergence bug.
public final class PasswordPolicy {

    // 8-12 characters, at least one uppercase letter, one digit, and one
    // character that's neither a letter nor a digit (treated as "special").
    public static final String REGEX = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,12}$";

    public static final String MESSAGE =
            "Password must be 8-12 characters and include at least one uppercase letter, one number, and one special character";

    private PasswordPolicy() {
    }
}
