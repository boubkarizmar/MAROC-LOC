package com.marocloc.marocloc_backend.event.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marocloc.marocloc_backend.event.dto.EventPayload;
import com.marocloc.marocloc_backend.event.dto.TrackEventRequest;
import com.marocloc.marocloc_backend.event.model.EventLog;
import com.marocloc.marocloc_backend.event.repository.EventLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventTrackingService {

    private final EventLogRepository eventLogRepository;
    private final ObjectMapper objectMapper;

    @Async("eventTaskExecutor")
    @Transactional
    public void trackEvent(TrackEventRequest request, Long userId, HttpServletRequest httpRequest) {
        try {
            String payloadJson = objectMapper.writeValueAsString(request.getPayload());

            EventLog event = EventLog.builder()
                    .eventType(request.getEventType())
                    .eventVersion(request.getEventVersion() != null ? request.getEventVersion() : 1)
                    .userId(userId)
                    .sessionId(request.getSessionId())
                    .deviceFingerprint(request.getDeviceFingerprint())
                    .ipAddress(extractClientIp(httpRequest))
                    .userAgent(httpRequest != null ? httpRequest.getHeader("User-Agent") : null)
                    .source(request.getSource() != null ? request.getSource() : "web")
                    .payload(payloadJson)
                    .clientTimestamp(request.getClientTimestamp())
                    .processed(false)
                    .build();

            if (request.getPayload() != null) {
                event.setCity(request.getPayload().getCity());
            }

            eventLogRepository.save(event);
            log.debug("Event tracked: {} for user {}", request.getEventType(), userId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize event payload: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Event tracking failed: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopViewedProperties(int days, int limit) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        return eventLogRepository.findTopViewedProperties(since, limit).stream()
                .map(row -> Map.of(
                        "propertyId", row[0],
                        "views", row[1]
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopSearchQueries(int days, int limit) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        return eventLogRepository.findTopSearchQueries(since, limit).stream()
                .map(row -> Map.of(
                        "query", row[0],
                        "searches", row[1]
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getEngagementSummary(int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        Object[] result = eventLogRepository.getEngagementSummary(since);
        return Map.of(
                "uniqueUsers", result[0] != null ? result[0] : 0,
                "totalEvents", result[1] != null ? result[1] : 0,
                "sessions", result[2] != null ? result[2] : 0,
                "periodDays", days
        );
    }

    @Transactional
    public int processBatch(int batchSize) {
        Instant cutoff = Instant.now().minus(5, ChronoUnit.MINUTES);
        List<EventLog> unprocessed = eventLogRepository
                .findByProcessedFalseAndServerTimestampBefore(cutoff, Pageable.ofSize(batchSize));

        if (unprocessed.isEmpty()) {
            return 0;
        }

        List<Long> ids = unprocessed.stream().map(EventLog::getId).toList();
        return eventLogRepository.markAsProcessed(ids, Instant.now());
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return null;
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
