package com.marocloc.marocloc_backend.analytics.service;

import com.marocloc.marocloc_backend.analytics.dto.EngagementChartDTO;
import com.marocloc.marocloc_backend.analytics.dto.TimeSeriesPointDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EngagementChartService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public EngagementChartDTO getDailyActiveUsers(int days) {
        String sql = """
            SELECT DATE(server_timestamp) as date, COUNT(DISTINCT user_id) as dau
            FROM event_log
            WHERE server_timestamp >= NOW() - CAST(? || ' days' AS INTERVAL)
            GROUP BY DATE(server_timestamp)
            ORDER BY date
            """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, days);
        return buildChart("Daily Active Users", days + " days", rows, "dau");
    }

    @Transactional(readOnly = true)
    public EngagementChartDTO getPropertyViewsTrend(int days) {
        String sql = """
            SELECT DATE(server_timestamp) as date, COUNT(*) as views
            FROM event_log
            WHERE event_type = 'property.view'
              AND server_timestamp >= NOW() - CAST(? || ' days' AS INTERVAL)
            GROUP BY DATE(server_timestamp)
            ORDER BY date
            """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, days);
        return buildChart("Property Views", days + " days", rows, "views");
    }

    @Transactional(readOnly = true)
    public EngagementChartDTO getSearchTrend(int days) {
        String sql = """
            SELECT DATE(server_timestamp) as date, COUNT(*) as searches
            FROM event_log
            WHERE event_type = 'search.query'
              AND server_timestamp >= NOW() - CAST(? || ' days' AS INTERVAL)
            GROUP BY DATE(server_timestamp)
            ORDER BY date
            """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, days);
        return buildChart("Searches", days + " days", rows, "searches");
    }

    @Transactional(readOnly = true)
    public EngagementChartDTO getMessageVolumeTrend(int days) {
        String sql = """
            SELECT DATE(timestamp) as date, COUNT(*) as messages
            FROM messages
            WHERE timestamp >= NOW() - CAST(? || ' days' AS INTERVAL)
            GROUP BY DATE(timestamp)
            ORDER BY date
            """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, days);
        return buildChart("Messages", days + " days", rows, "messages");
    }

    @Transactional(readOnly = true)
    public EngagementChartDTO getReviewTrend(int days) {
        String sql = """
            SELECT DATE(created_at) as date, COUNT(*) as reviews
            FROM reviews
            WHERE created_at >= NOW() - CAST(? || ' days' AS INTERVAL)
            GROUP BY DATE(created_at)
            ORDER BY date
            """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, days);
        return buildChart("Reviews", days + " days", rows, "reviews");
    }

    @Transactional(readOnly = true)
    public EngagementChartDTO getRevenueTrend(int days) {
        String sql = """
            SELECT DATE(created_at) as date, COALESCE(SUM(amount), 0) as revenue
            FROM advertisement_payments
            WHERE status = 'COMPLETED'
              AND created_at >= NOW() - CAST(? || ' days' AS INTERVAL)
            GROUP BY DATE(created_at)
            ORDER BY date
            """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, days);
        return buildChart("Revenue", days + " days", rows, "revenue");
    }

    private EngagementChartDTO buildChart(String metricName, String period,
                                           List<Map<String, Object>> rows, String valueColumn) {
        List<TimeSeriesPointDTO> points = rows.stream()
                .map(row -> TimeSeriesPointDTO.builder()
                        .date(row.get("date") != null ? row.get("date").toString() : "")
                        .value(row.get(valueColumn) != null ? ((Number) row.get(valueColumn)).longValue() : 0L)
                        .build())
                .toList();

        long total = points.stream().mapToLong(TimeSeriesPointDTO::getValue).sum();
        double avg = points.isEmpty() ? 0.0 : (double) total / points.size();

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", total);
        summary.put("average", Math.round(avg * 100.0) / 100.0);
        summary.put("dataPoints", points.size());

        return EngagementChartDTO.builder()
                .metricName(metricName)
                .period(period)
                .dataPoints(points)
                .summary(summary)
                .build();
    }
}
