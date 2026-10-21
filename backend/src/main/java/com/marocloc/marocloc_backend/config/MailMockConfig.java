package com.marocloc.marocloc_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
@Profile("docker")
public class MailMockConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        // Return a mock mail sender for development
        return new JavaMailSenderImpl();
    }
}
