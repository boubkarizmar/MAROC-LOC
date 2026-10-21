package com.marocloc.marocloc_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.messaging.Message;

import java.util.Collections;
import java.util.concurrent.CompletableFuture;

@Configuration
@Profile("docker")
public class NoOpKafkaConfig {

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new NoOpKafkaTemplate();
    }

    static class NoOpKafkaTemplate extends KafkaTemplate<String, Object> {

        public NoOpKafkaTemplate() {
            super(new DefaultKafkaProducerFactory<>(Collections.emptyMap()));
        }

        @Override
        public CompletableFuture<SendResult<String, Object>> send(String topic, Object data) {
            return CompletableFuture.completedFuture(null);
        }

        @Override
        public CompletableFuture<SendResult<String, Object>> send(String topic, String key, Object data) {
            return CompletableFuture.completedFuture(null);
        }

        @Override
        public CompletableFuture<SendResult<String, Object>> send(String topic, Integer partition, String key, Object data) {
            return CompletableFuture.completedFuture(null);
        }

        @Override
        public CompletableFuture<SendResult<String, Object>> send(String topic, Integer partition, Long timestamp, String key, Object data) {
            return CompletableFuture.completedFuture(null);
        }

        @Override
        public CompletableFuture<SendResult<String, Object>> send(Message<?> message) {
            return CompletableFuture.completedFuture(null);
        }
    }
}
