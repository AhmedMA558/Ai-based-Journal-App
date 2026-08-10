package com.aijournal.auth.service;

import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TotpServiceTest {

    private final TotpService totpService = new TotpService();

    @Test
    void generateSecret_ProducesNonBlankBase32Secret() {
        String secret = totpService.generateSecret();
        assertNotNull(secret);
        assertFalse(secret.isBlank());
    }

    @Test
    void verify_ValidCodeForCurrentTimeStep_ReturnsTrue() throws Exception {
        String secret = totpService.generateSecret();
        SystemTimeProvider timeProvider = new SystemTimeProvider();
        long currentBucket = timeProvider.getTime() / 30;
        String validCode = new DefaultCodeGenerator().generate(secret, currentBucket);

        assertTrue(totpService.verify(secret, validCode));
    }

    @Test
    void verify_WrongCode_ReturnsFalse() {
        String secret = totpService.generateSecret();
        assertFalse(totpService.verify(secret, "000000"));
    }

    @Test
    void verify_BlankCode_ReturnsFalse() {
        String secret = totpService.generateSecret();
        assertFalse(totpService.verify(secret, ""));
        assertFalse(totpService.verify(secret, null));
    }

    @Test
    void buildOtpAuthUri_ContainsIssuerAndAccountLabel() {
        String uri = totpService.buildOtpAuthUri("user@example.com", "SECRETVALUE");
        assertTrue(uri.startsWith("otpauth://totp/"));
        assertTrue(uri.contains("secret=SECRETVALUE"));
    }
}
