package com.aijournal.auth.service;

import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.stereotype.Service;

// Thin wrapper around dev.samstevens.totp so secret generation, code
// verification (with the +/-1 time-step drift real authenticator apps
// need), and otpauth:// URI construction aren't duplicated across the
// setup/enable/verify/disable call sites in AuthServiceImpl.
@Service
public class TotpService {

    private static final String ISSUER = "Mindora";

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final CodeVerifier codeVerifier;

    public TotpService() {
        TimeProvider timeProvider = new SystemTimeProvider();
        this.codeVerifier = new DefaultCodeVerifier(new DefaultCodeGenerator(), timeProvider);
    }

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public boolean verify(String secret, String code) {
        if (secret == null || code == null || code.isBlank()) {
            return false;
        }
        return codeVerifier.isValidCode(secret, code);
    }

    public String buildOtpAuthUri(String accountLabel, String secret) {
        QrData data = new QrData.Builder()
                .label(accountLabel)
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        return data.getUri();
    }
}
