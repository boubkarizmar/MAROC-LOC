package com.marocloc.marocloc_backend.churn.service;

import com.marocloc.marocloc_backend.churn.dto.ChurnPredictionDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChurnPredictionService {

    private final JdbcTemplate jdbcTemplate;
    private final StringRedisTemplate redisTemplate;

    public ChurnPredictionDTO predict(Long userId) {
        // Fetch user engagement features from event_log
        String sql = """
            SELECT
                u.id as user_id,
                u.created_at as signup_date,
                us.tier,
                us.status,
                us.created_at as sub_start,
                COALESCE((
                    SELECT MAX(server_timestamp)
                    FROM event_log
                    WHERE user_id = u.id
                ), u.created_at) as last_activity,
                COALESCE((
                    SELECT COUNT(*)
                    FROM event_log
                    WHERE user_id = u.id
                    AND server_timestamp >= NOW() - INTERVAL '30 days'
                ), 0) as events_30d,
                COALESCE((
                    SELECT COUNT(DISTINCT property_id)
                    FROM event_log
                    WHERE user_id = u.id
                    AND event_type = 'property.view'
                    AND server_timestamp >= NOW() - INTERVAL '30 days'
                ), 0) as unique_views_30d,
                COALESCE((
                    SELECT COUNT(*)
                    FROM event_log
                    WHERE user_id = u.id
                    AND event_type = 'message.sent'
                    AND server_timestamp >= NOW() - INTERVAL '30 days'
                ), 0) as messages_30d
            FROM users u
            LEFT JOIN user_subscription us ON u.id = us.user_id AND us.status = 'ACTIVE'
            WHERE u.id = ?
            """;

        Map<String, Object> row = jdbcTemplate.queryForMap(sql, userId);
        if (row == null || row.isEmpty()) {
            return null;
        }

        LocalDateTime lastActivity = ((java.sql.Timestamp) row.get("last_activity")).toLocalDateTime();
        int daysSinceActivity = (int) ChronoUnit.DAYS.between(lastActivity, LocalDateTime.now());
        int events30d = ((Number) row.get("events_30d")).intValue();
        int views30d = ((Number) row.get("unique_views_30d")).intValue();
        int messages30d = ((Number) row.get("messages_30d")).intValue();
        String tier = (String) row.get("tier");

        // Heuristic churn model (replace with XGBoost in production)
        double score = 0.0;
        List<String> riskFactors = new ArrayList<>();

        if (daysSinceActivity > 14) {
            score += 0.25;
            riskFactors.add("No activity in 14+ days");
        }
        if (events30d < 3) {
            score += 0.20;
            riskFactors.add("Very low engagement (" + events30d + " events)");
        }
        if (views30d == 0 && tier != null) {
            score += 0.15;
            riskFactors.add("No property views this month");
        }
        if (messages30d == 0 && tier != null) {
            score += 0.10;
            riskFactors.add("No messages sent");
        }
        if ("PREMIUM".equals(tier) && daysSinceActivity > 7) {
            score += 0.15;
            riskFactors.add("Premium user going cold");
        }

        score = Math.min(1.0, score);
        String riskLevel = score > 0.6 ? "HIGH" : score > 0.3 ? "MEDIUM" : "LOW";
        String action = switch (riskLevel) {
            case "HIGH" -> "Send retention offer + personal outreach";
            case "MEDIUM" -> "Send re-engagement email with personalized listings";
            default -> "Monitor";
        };

        return ChurnPredictionDTO.builder()
                .userId(userId)
                .churnProbability(score)
                .riskLevel(riskLevel)
                .daysSinceLastActivity(daysSinceActivity)
                .daysUntilRenewal(30) // placeholder
                .currentMrr(BigDecimal.valueOf("PREMIUM".equals(tier) ? 99 : "FEATURED".equals(tier) ? 299 : 0))
                .riskFactors(riskFactors)
                .featureContributions(Map.of(
                        "daysSinceActivity", daysSinceActivity,
                        "events30d", events30d,
                        "views30d", views30d,
                        "messages30d", messages30d
                ))
                .recommendedAction(action)
                .build();
    }

    public List<ChurnPredictionDTO> getHighRiskUsers(int limit) {
        // In production: batch inference via AI service
        String sql = """
            SELECT DISTINCT user_id
            FROM event_log
            WHERE server_timestamp >= NOW() - INTERVAL '7 days'
            """;
        List<Long> activeUsers = jdbcTemplate.queryForList(sql, Long.class);

        List<ChurnPredictionDTO> highRisk = new ArrayList<>();
        for (Long userId : activeUsers) {
            ChurnPredictionDTO prediction = predict(userId);
            if (prediction != null && "HIGH".equals(prediction.getRiskLevel())) {
                highRisk.add(prediction);
            }
            if (highRisk.size() >= limit) break;
        }
        return highRisk;
    }
}
