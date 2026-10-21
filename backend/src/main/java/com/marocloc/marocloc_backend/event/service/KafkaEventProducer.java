package com.marocloc.marocloc_backend.event.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendEvent(String topic, String eventType, Map<String, Object> payload) {
        Map<String, Object> envelope = Map.of(
                "eventId", UUID.randomUUID().toString(),
                "eventType", eventType,
                "timestamp", Instant.now().toString(),
                "payload", payload,
                "source", "backend",
                "version", 1
        );

        CompletableFuture<SendResult<String, Object>> future =
                kafkaTemplate.send(topic, payload.getOrDefault("userId", "anonymous").toString(), envelope);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send Kafka message to {}: {}", topic, ex.getMessage());
            } else {
                log.debug("Sent event to {} partition {} offset {}",
                        topic, result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
            }
        });
    }

    public void sendPropertyView(Long userId, Long propertyId, Map<String, Object> metadata) {
        sendEvent("marocloc.events", "property.view", Map.of(
                "userId", userId,
                "propertyId", propertyId,
                "metadata", metadata
        ));
    }

    public void sendFraudFlag(Long propertyId, Double score, String decision) {
        sendEvent("marocloc.fraud.flags", "fraud.detected", Map.of(
                "propertyId", propertyId,
                "score", score,
                "decision", decision,
                "timestamp", Instant.now().toString()
        ));
    }

    public void sendRecommendationClick(Long userId, Long propertyId, String modelVersion) {
        sendEvent("marocloc.recommendations", "recommendation.click", Map.of(
                "userId", userId,
                "propertyId", propertyId,
                "modelVersion", modelVersion,
                "timestamp", Instant.now().toString()
        ));
    }

    public void sendAnalyticsEvent(String metricName, Double value, Map<String, String> dimensions) {
        sendEvent("marocloc.analytics", "analytics.metric", Map.of(
                "metricName", metricName,
                "value", value,
                "dimensions", dimensions,
                "timestamp", Instant.now().toString()
        ));
    }
}
