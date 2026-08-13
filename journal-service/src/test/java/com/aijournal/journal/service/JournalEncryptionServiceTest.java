package com.aijournal.journal.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class JournalEncryptionServiceTest {

    @Test
    void encryptThenDecrypt_ReturnsOriginalPlaintext() {
        JournalEncryptionService service = new JournalEncryptionService("test-encryption-key-not-for-production");
        String content = "Today was a good day.";

        String encrypted = service.encrypt(content);
        String decrypted = service.decrypt(encrypted);

        assertNotEquals(content, encrypted);
        assertEquals(content, decrypted);
    }

    @Test
    void encrypt_ProducesDifferentCiphertextEachTime() {
        // Random IV per call - same plaintext must not produce identical ciphertext,
        // otherwise two entries with the same content would be distinguishable at rest.
        JournalEncryptionService service = new JournalEncryptionService("test-encryption-key-not-for-production");
        String content = "Today was a good day.";

        String first = service.encrypt(content);
        String second = service.encrypt(content);

        assertNotEquals(first, second);
        assertEquals(content, service.decrypt(first));
        assertEquals(content, service.decrypt(second));
    }

    @Test
    void decrypt_WithDifferentKey_Fails() {
        JournalEncryptionService encryptor = new JournalEncryptionService("key-one");
        JournalEncryptionService decryptor = new JournalEncryptionService("key-two");

        String encrypted = encryptor.encrypt("Today was a good day.");

        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class,
                () -> decryptor.decrypt(encrypted));
    }
}
