package com.marocloc.marocloc_backend.event.service;

import com.marocloc.marocloc_backend.fraud.service.FraudDetectionService;
import com.marocloc.marocloc_backend.service.RecommendationCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Profile("!docker")
public class KafkaEventConsumer {

    private final FraudDetectionService fraudDetectionService;
    private final RecommendationCacheService recommendationCacheService;

    @KafkaListener(topics = "marocloc.events", groupId = "marocloc-event-processors",
            containerFactory = "kafkaListenerContainerFactory")
    public void consumeEvents(@Payload List<Map<String, Object>> messages, Acknowledgment ack) {
        for (Map<String, Object> msg : messages) {
            try {
                String eventType = (String) msg.get("eventType");
                Map<String, Object> payload = (Map<String, Object>) msg.get("payload");

                switch (eventType) {
                    case "property.view" -> processPropertyView(payload);
                    case "property.favorite" -> processFavorite(payload);
                    case "search.query" -> processSearch(payload);
                    default -> log.debug("Unhandled event type: {}", eventType);
                }
            } catch (Exception e) {
                log.error("Error processing event: {}", e.getMessage());
            }
        }
        ack.acknowledge();
    }

    @KafkaListener(topics = "marocloc.fraud.flags", groupId = "marocloc-fraud-processors")
    public void consumeFraudFlags(@Payload Map<String, Object> message) {
        log.info("Fraud flag received: {}", message);
        // Trigger admin notification, auto-suspend, etc.
    }

    @KafkaListener(topics = "marocloc.recommendations", groupId = "marocloc-rec-processors")
    public void consumeRecommendationFeedback(@Payload Map<String, Object> message) {
        Map<String, Object> payload = (Map<String, Object>) message.get("payload");
        Long userId = ((Number) payload.get("userId")).longValue();
        Long propertyId = ((Number) payload.get("propertyId")).longValue();
        String modelVersion = (String) payload.get("modelVersion");
        recommendationCacheService.recordClick(userId, propertyId, modelVersion);
    }

    @KafkaListener(topics = "marocloc.analytics", groupId = "marocloc-analytics-processors")
    public void consumeAnalytics(@Payload Map<String, Object> message) {
        // Stream to ClickHouse or BigQuery in production
        log.debug("Analytics event: {}", message);
    }

    private void processPropertyView(Map<String, Object> payload) {
        Long propertyId = ((Number) payload.get("propertyId")).longValue();
        // Update real-time trending in Redis
    }

    private void processFavorite(Map<String, Object> payload) {
        Long userId = ((Number) payload.get("userId")).longValue();
        Long propertyId = ((Number) payload.get("propertyId")).longValue();
        // Invalidate recommendation cache for user
        recommendationCacheService.invalidateUserCache(userId);
    }

    private void processSearch(Map<String, Object> payload) {
        String query = (String) payload.get("query");
        // Update search trend index
    }
}
