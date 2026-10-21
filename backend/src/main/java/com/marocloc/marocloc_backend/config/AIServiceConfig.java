package com.marocloc.marocloc_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class AIServiceConfig {

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiBaseUrl;

    @Bean
    public RestTemplate aiRestTemplate(RestTemplateBuilder builder) {
        return builder
                .rootUri(aiBaseUrl)
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(60))
                .build();
    }
}