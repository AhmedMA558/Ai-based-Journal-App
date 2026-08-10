package com.aijournal.auth.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class TotpEncryptionServiceTest {

    @Test
    void encryptThenDecrypt_ReturnsOriginalPlaintext() {
        TotpEncryptionService service = new TotpEncryptionService("test-encryption-key-not-for-production");
        String secret = "JBSWY3DPEHPK3PXP";

        String encrypted = service.encrypt(secret);
        String decrypted = service.decrypt(encrypted);

        assertNotEquals(secret, encrypted);
        assertEquals(secret, decrypted);
    }

    @Test
    void encrypt_ProducesDifferentCiphertextEachTime() {
        // Random IV per call - same plaintext must not produce identical ciphertext,
        // otherwise two users with the same secret would be distinguishable at rest.
        TotpEncryptionService service = new TotpEncryptionService("test-encryption-key-not-for-production");
        String secret = "JBSWY3DPEHPK3PXP";

        String first = service.encrypt(secret);
        String second = service.encrypt(secret);

        assertNotEquals(first, second);
        assertEquals(secret, service.decrypt(first));
        assertEquals(secret, service.decrypt(second));
    }

    @Test
    void decrypt_WithDifferentKey_Fails() {
        TotpEncryptionService encryptor = new TotpEncryptionService("key-one");
        TotpEncryptionService decryptor = new TotpEncryptionService("key-two");

        String encrypted = encryptor.encrypt("JBSWY3DPEHPK3PXP");

        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class,
                () -> decryptor.decrypt(encrypted));
    }
}
