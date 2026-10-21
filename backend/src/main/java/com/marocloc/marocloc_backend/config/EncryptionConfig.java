package com.marocloc.marocloc_backend.config;

import com.marocloc.marocloc_backend.security.StringEncryptor;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Loads encryption configuration for field-level encryption.
 */
@Configuration
@RequiredArgsConstructor
public class EncryptionConfig {

    @Value("${encryption.secret:your-encryption-secret-here-change-in-production-32-chars}")
    private String encryptionSecret;

    private final StringEncryptor stringEncryptor;

    @PostConstruct
    public void init() {
        if (encryptionSecret == null || encryptionSecret.isBlank() ||
            encryptionSecret.length() < 32 || encryptionSecret.equals("your-encryption-secret-here-change-in-production-32-chars")) {
            throw new IllegalStateException(
                "Encryption secret must be configured via ENCRYPTION_SECRET environment variable " +
                "and must be at least 32 characters long. Current value is invalid."
            );
        }
        stringEncryptor.setEncryptionSecret(encryptionSecret);
    }
}
