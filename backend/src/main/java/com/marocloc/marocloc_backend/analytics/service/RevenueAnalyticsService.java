package com.marocloc.marocloc_backend.analytics.service;

import com.marocloc.marocloc_backend.analytics.dto.RevenueAnalyticsDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RevenueAnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public RevenueAnalyticsDTO getRevenueAnalytics(String period) {
        try {
            // period format: "2026-05" or "2026-Q2" or "2026"
            String startDate;
            String endDate;

            if (period.length() == 7) { // Monthly
                startDate = period + "-01";
                endDate = LocalDate.parse(startDate).plusMonths(1).toString();
            } else if (period.startsWith("Q")) { // Quarterly
                int year = Integer.parseInt(period.substring(0, 4));
                int quarter = Integer.parseInt(period.substring(5));
                int month = (quarter - 1) * 3 + 1;
                startDate = String.format("%d-%02d-01", year, month);
                endDate = LocalDate.parse(startDate).plusMonths(3).toString();
            } else { // Yearly
                startDate = period + "-01-01";
                endDate = (Integer.parseInt(period) + 1) + "-01-01";
            }

            String sql = """
                SELECT
                    COUNT(*) FILTER (WHERE status = 'ACTIVE' AND created_at >= ?::date AND created_at < ?::date) as new_subs,
                    COUNT(*) FILTER (WHERE status = 'CANCELLED' AND updated_at >= ?::date AND updated_at < ?::date) as churned_subs,
                    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_subs,
                    COALESCE(SUM(amount), 0) as total_revenue,
                    tier
                FROM user_subscription
                WHERE (created_at >= ?::date AND created_at < ?::date)
                   OR (updated_at >= ?::date AND updated_at < ?::date)
                GROUP BY tier
                """;

            Map<String, BigDecimal> revenueByTier = new HashMap<>();
            final int[] newSubs = {0};
            final int[] churnedSubs = {0};
            final int[] activeSubs = {0};
            BigDecimal totalRevenue = BigDecimal.ZERO;

            var rows = jdbcTemplate.queryForList(sql, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate);
            for (Map<String, Object> row : rows) {
                String tier = (String) row.get("tier");
                BigDecimal revenue = BigDecimal.valueOf(((Number) row.get("total_revenue")).doubleValue());
                revenueByTier.put(tier, revenue);
                totalRevenue = totalRevenue.add(revenue);
                newSubs[0] += ((Number) row.get("new_subs")).intValue();
                churnedSubs[0] += ((Number) row.get("churned_subs")).intValue();
                activeSubs[0] += ((Number) row.get("active_subs")).intValue();
            }

            // Calculate derived metrics
            BigDecimal churnRate = activeSubs[0] > 0
                    ? BigDecimal.valueOf(churnedSubs[0]).divide(BigDecimal.valueOf(activeSubs[0]), 4, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            BigDecimal arpu = activeSubs[0] > 0
                    ? totalRevenue.divide(BigDecimal.valueOf(activeSubs[0]), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            // LTV = ARPU * average_subscription_months (simplified: 12 months)
            BigDecimal ltv = arpu.multiply(BigDecimal.valueOf(12));

            return RevenueAnalyticsDTO.builder()
                    .period(period)
                    .mrr(totalRevenue)
                    .arr(totalRevenue.multiply(BigDecimal.valueOf(12)))
                    .totalRevenue(totalRevenue)
                    .activeSubscriptions(activeSubs[0])
                    .newSubscriptions(newSubs[0])
                    .churnedSubscriptions(churnedSubs[0])
                    .churnRate(churnRate)
                    .arpu(arpu)
                    .ltv(ltv)
                    .cac(BigDecimal.valueOf(150)) // placeholder CAC
                    .revenueByTier(revenueByTier)
                    .revenueByCity(new HashMap<>()) // would join with user city
                    .build();
        } catch (Exception e) {
            log.warn("Revenue analytics query failed (user_subscription table may not exist): {}", e.getMessage());
            return RevenueAnalyticsDTO.builder()
                    .period(period)
                    .mrr(BigDecimal.ZERO)
                    .arr(BigDecimal.ZERO)
                    .totalRevenue(BigDecimal.ZERO)
                    .activeSubscriptions(0)
                    .newSubscriptions(0)
                    .churnedSubscriptions(0)
                    .churnRate(BigDecimal.ZERO)
                    .arpu(BigDecimal.ZERO)
                    .ltv(BigDecimal.ZERO)
                    .cac(BigDecimal.valueOf(150))
                    .revenueByTier(new HashMap<>())
                    .revenueByCity(new HashMap<>())
                    .build();
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCohortAnalysis(int months) {
        try {
            String sql = """
                WITH cohorts AS (
                    SELECT
                        DATE_TRUNC('month', created_at) as cohort_month,
                        user_id,
                        tier
                    FROM user_subscription
                    WHERE created_at >= NOW() - CAST(? || ' months' AS INTERVAL)
                )
                SELECT
                    cohort_month,
                    tier,
                    COUNT(DISTINCT user_id) as cohort_size,
                    COUNT(DISTINCT user_id) FILTER (WHERE status = 'ACTIVE') as retained
                FROM cohorts
                LEFT JOIN user_subscription us ON cohorts.user_id = us.user_id
                GROUP BY cohort_month, tier
                ORDER BY cohort_month DESC
                """;
            return Map.of("cohorts", jdbcTemplate.queryForList(sql, months));
        } catch (Exception e) {
            log.warn("Cohort analysis query failed: {}", e.getMessage());
            return Map.of("cohorts", List.of(), "error", "user_subscription table not found");
        }
    }
}
