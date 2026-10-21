package com.marocloc.marocloc_backend.security;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StringEncryptorTest {

    private static final String TEST_SECRET = "ThisIsA32CharacterSecretKey!!!___";

    @BeforeAll
    static void setup() {
        StringEncryptor.initSecret(TEST_SECRET);
    }

    @Test
    void shouldEncryptAndDecryptValue() {
        StringEncryptor encryptor = new StringEncryptor();
        String original = "+212612345678";

        String encrypted = encryptor.convertToDatabaseColumn(original);
        String decrypted = encryptor.convertToEntityAttribute(encrypted);

        assertThat(encrypted).isNotEqualTo(original);
        assertThat(decrypted).isEqualTo(original);
    }

    @Test
    void shouldReturnNullForBlankInput() {
        StringEncryptor encryptor = new StringEncryptor();

        assertThat(encryptor.convertToDatabaseColumn(null)).isNull();
        assertThat(encryptor.convertToDatabaseColumn("")).isEqualTo("");
        assertThat(encryptor.convertToEntityAttribute(null)).isNull();
        assertThat(encryptor.convertToEntityAttribute("")).isEqualTo("");
    }

    @Test
    void shouldProduceDifferentCiphertextsForSamePlaintext() {
        StringEncryptor encryptor = new StringEncryptor();
        String original = "sensitive_data";

        String encrypted1 = encryptor.convertToDatabaseColumn(original);
        String encrypted2 = encryptor.convertToDatabaseColumn(original);

        // Random IV should produce different ciphertexts
        assertThat(encrypted1).isNotEqualTo(encrypted2);

        // But both should decrypt to the same value
        assertThat(encryptor.convertToEntityAttribute(encrypted1)).isEqualTo(original);
        assertThat(encryptor.convertToEntityAttribute(encrypted2)).isEqualTo(original);
    }

    @Test
    void shouldRejectShortSecret() {
        assertThatThrownBy(() -> StringEncryptor.initSecret("short"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 characters");
    }
}
