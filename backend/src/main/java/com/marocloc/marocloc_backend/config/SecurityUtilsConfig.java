package com.marocloc.marocloc_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Security configuration utilities
 */
@Configuration
@RequiredArgsConstructor
public class SecurityUtilsConfig {

    /**
     * Strong password encoder using BCrypt with higher strength
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // Higher strength for better security
    }
}