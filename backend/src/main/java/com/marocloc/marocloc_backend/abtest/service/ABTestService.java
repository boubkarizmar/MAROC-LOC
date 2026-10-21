package com.marocloc.marocloc_backend.abtest.service;

import com.marocloc.marocloc_backend.abtest.model.Experiment;
import com.marocloc.marocloc_backend.abtest.model.ExperimentAssignment;
import com.marocloc.marocloc_backend.abtest.repository.ExperimentAssignmentRepository;
import com.marocloc.marocloc_backend.abtest.repository.ExperimentRepository;
import com.marocloc.marocloc_backend.event.service.KafkaEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ABTestService {

    private final ExperimentRepository experimentRepository;
    private final ExperimentAssignmentRepository assignmentRepository;
    private final StringRedisTemplate redisTemplate;
    private final KafkaEventProducer kafkaEventProducer;

    @Transactional
    public String getVariant(Long userId, String experimentKey) {
        // Check cache first
        String cacheKey = String.format("ab:%s:%d", experimentKey, userId);
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        // Check database assignment
        Optional<ExperimentAssignment> existing = assignmentRepository
                .findByUserIdAndExperimentKey(userId, experimentKey);
        if (existing.isPresent()) {
            String variant = existing.get().getVariant();
            redisTemplate.opsForValue().set(cacheKey, variant);
            return variant;
        }

        // Find active experiment
        Optional<Experiment> experiment = experimentRepository
                .findByExperimentKeyAndStatus(experimentKey, "RUNNING");
        if (experiment.isEmpty()) {
            return "control"; // Default fallback
        }

        // Deterministic hash-based assignment
        String variant = assignVariant(userId, experimentKey, experiment.get().getSplitRatio());

        // Persist assignment
        ExperimentAssignment assignment = ExperimentAssignment.builder()
                .userId(userId)
                .experimentKey(experimentKey)
                .variant(variant)
                .build();
        assignmentRepository.save(assignment);
        redisTemplate.opsForValue().set(cacheKey, variant);

        // Emit assignment event
        kafkaEventProducer.sendEvent("marocloc.analytics", "ab.assigned", Map.of(
                "userId", userId,
                "experimentKey", experimentKey,
                "variant", variant,
                "timestamp", LocalDateTime.now().toString()
        ));

        return variant;
    }

    public String assignVariant(Long userId, String experimentKey, double splitRatio) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String input = userId + ":" + experimentKey;
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            int intHash = ((hash[0] & 0xFF) << 24) | ((hash[1] & 0xFF) << 16)
                    | ((hash[2] & 0xFF) << 8) | (hash[3] & 0xFF);
            double normalized = Math.abs(intHash) / (double) Integer.MAX_VALUE;
            return normalized < splitRatio ? "control" : "treatment";
        } catch (NoSuchAlgorithmException e) {
            log.error("Hash algorithm not available", e);
            return "control";
        }
    }

    @Transactional
    public void recordConversion(Long userId, String experimentKey, String metricName, Double value) {
        kafkaEventProducer.sendEvent("marocloc.analytics", "ab.conversion", Map.of(
                "userId", userId,
                "experimentKey", experimentKey,
                "metricName", metricName,
                "value", value,
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    public Map<String, Object> getExperimentResults(String experimentKey) {
        // In production: query analytics DB or use Kafka streams aggregation
        return Map.of(
                "experimentKey", experimentKey,
                "controlSamples", 0,
                "treatmentSamples", 0,
                "controlConversion", 0.0,
                "treatmentConversion", 0.0,
                "pValue", 1.0,
                "significant", false
        );
    }
}
