package com.marocloc.marocloc_backend.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-GCM encryption converter for sensitive string fields.
 * Uses a random IV per encryption operation for semantic security.
 * IV is prepended to the ciphertext and extracted during decryption.
 */
@Converter(autoApply = false)
@Component
public class StringEncryptor implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH_BYTES = 12;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static SecretKeySpec secretKeySpec;

    @Value("${encryption.secret:}")
    public void setEncryptionSecret(String secret) {
        initSecret(secret);
    }

    public static synchronized void initSecret(String secret) {
        if (secret == null || secret.isBlank() || secret.length() < 32) {
            throw new IllegalStateException(
                "Encryption secret must be configured via ENCRYPTION_SECRET environment variable " +
                "and must be at least 32 characters long."
            );
        }
        byte[] keyBytes = secret.substring(0, 32).getBytes(StandardCharsets.UTF_8);
        secretKeySpec = new SecretKeySpec(keyBytes, "AES");
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isBlank()) {
            return attribute;
        }
        ensureInitialized();

        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            SECURE_RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, spec);

            byte[] encrypted = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            // Prepend IV to ciphertext
            byte[] combined = new byte[IV_LENGTH_BYTES + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, IV_LENGTH_BYTES);
            System.arraycopy(encrypted, 0, combined, IV_LENGTH_BYTES, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt sensitive data", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return dbData;
        }
        ensureInitialized();

        // Gracefully handle plaintext data (e.g., legacy or seed data)
        if (!looksLikeEncrypted(dbData)) {
            return dbData;
        }

        try {
            byte[] combined = Base64.getDecoder().decode(dbData);

            if (combined.length < IV_LENGTH_BYTES + 16) { // minimum AES-GCM output
                return dbData; // too short to be valid encrypted data
            }

            byte[] iv = new byte[IV_LENGTH_BYTES];
            byte[] encrypted = new byte[combined.length - IV_LENGTH_BYTES];
            System.arraycopy(combined, 0, iv, 0, IV_LENGTH_BYTES);
            System.arraycopy(combined, IV_LENGTH_BYTES, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, spec);

            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            // If decryption fails, assume plaintext and return as-is
            return dbData;
        }
    }

    /**
     * Heuristic to check if a string looks like encrypted (Base64) data.
     * Encrypted data is Base64 encoded and typically longer than raw plaintext.
     */
    private boolean looksLikeEncrypted(String data) {
        if (data.length() < 20) {
            return false; // too short to contain IV + ciphertext + tag
        }
        // Quick Base64 character check
        return data.matches("^[A-Za-z0-9+/=]+$");
    }

    private void ensureInitialized() {
        if (secretKeySpec == null) {
            throw new IllegalStateException(
                "StringEncryptor has not been initialized. " +
                "Ensure 'encryption.secret' is configured."
            );
        }
    }
}
