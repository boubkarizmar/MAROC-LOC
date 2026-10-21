package com.marocloc.marocloc_backend.analytics.service;

import com.marocloc.marocloc_backend.analytics.dto.AdminAnalyticsDTO;
import com.marocloc.marocloc_backend.analytics.dto.MonthlyPointDTO;
import com.marocloc.marocloc_backend.analytics.dto.TimeSeriesPointDTO;
import com.marocloc.marocloc_backend.analytics.dto.YearlyPointDTO;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final ReviewRepository reviewRepository;
    private final MessageRepository messageRepository;
    private final FavoriteRepository favoriteRepository;
    private final AdvertisementPaymentRepository adPaymentRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public AdminAnalyticsDTO getPlatformAnalytics() {
        int totalUsers = (int) userRepository.count();
        int proprietaireCount = (int) userRepository.countByRole(Role.PROPRIETAIRE);
        int adminCount = (int) userRepository.countByRole(Role.ADMIN);

        int totalProperties = (int) propertyRepository.count();
        int approvedProperties = (int) propertyRepository.countByStatus(PropertyStatus.APPROVED);
        int pendingProperties = (int) propertyRepository.countByStatus(PropertyStatus.PENDING);

        long totalViews = propertyRepository.sumViewCount();
        long totalMessages = messageRepository.count();
        long totalFavorites = favoriteRepository.count();
        long totalReviews = reviewRepository.count();

        Double avgRating = reviewRepository.getAverageRatingByPropertyId(null);
        if (avgRating == null) avgRating = 0.0;

        // Revenue
        BigDecimal totalRevenue = BigDecimal.valueOf(adPaymentRepository.sumTotalRevenue());

        // This month's stats
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0);
        long newUsersThisMonth = userRepository.countByCreatedAtAfter(monthStart);
        long propertiesThisMonth = propertyRepository.countCreatedSince(monthStart);

        // Trends (last 30 days)
        List<Map<String, Object>> userTrend = getUserSignupsTrend(30);
        List<Map<String, Object>> propertyTrend = getPropertyCreationTrend(30);
        List<Map<String, Object>> engagementTrend = getEngagementTrend(30);

        // City aggregation
        List<Object[]> cityAgg = propertyRepository.getCityAggregation();
        List<Map<String, Object>> topCities = cityAgg.stream()
                .limit(10)
                .map(row -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("city", row[0]);
                    map.put("propertyCount", ((Number) row[1]).longValue());
                    map.put("averagePrice", ((Number) row[2]).doubleValue());
                    map.put("totalViews", ((Number) row[3]).longValue());
                    return map;
                })
                .collect(Collectors.toList());

        // Real metrics from event_log and payments
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        long activeUsersToday = jdbcTemplate.queryForObject(
            "SELECT COUNT(DISTINCT user_id) FROM event_log WHERE event_type = 'user.login' AND server_timestamp >= ?",
            Long.class, todayStart);
        long totalSearches = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM event_log WHERE event_type = 'search.query'",
            Long.class);
        BigDecimal revenueThisMonth = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(amount), 0) FROM advertisement_payments WHERE status = 'PAID' AND created_at >= ?",
            BigDecimal.class, monthStart);
        if (revenueThisMonth == null) revenueThisMonth = BigDecimal.ZERO;
        BigDecimal averageAdSpend = jdbcTemplate.queryForObject(
            "SELECT COALESCE(AVG(amount), 0) FROM advertisement_payments WHERE status = 'PAID'",
            BigDecimal.class);
        if (averageAdSpend == null) averageAdSpend = BigDecimal.ZERO;
        List<Map<String, Object>> revenueTrend = getRevenueTrend(30);
        List<Map<String, Object>> propertyTypeDistribution = getPropertyTypeDistribution();

        return AdminAnalyticsDTO.builder()
                .totalUsers(totalUsers)
                .newUsersThisMonth((int) newUsersThisMonth)
                .activeUsersToday((int) activeUsersToday)
                .verifiedUsers((int) userRepository.countByIsVerifiedTrue())
                .proprietaireCount(proprietaireCount)
                .adminCount(adminCount)
                .totalProperties(totalProperties)
                .pendingProperties(pendingProperties)
                .approvedProperties(approvedProperties)
                .propertiesThisMonth((int) propertiesThisMonth)
                .averagePropertyPrice(getAveragePropertyPrice())
                .totalViews(totalViews)
                .totalSearches(totalSearches)
                .totalMessages(totalMessages)
                .totalFavorites(totalFavorites)
                .totalReviews(totalReviews)
                .averageReviewRating(Math.round(avgRating * 10.0) / 10.0)
                .totalRevenue(totalRevenue)
                .revenueThisMonth(revenueThisMonth)
                .totalAdPayments(adPaymentRepository.countTotalPayments().intValue())
                .averageAdSpend(averageAdSpend)
                .userSignupsTrend(userTrend)
                .propertyCreationTrend(propertyTrend)
                .revenueTrend(revenueTrend)
                .engagementTrend(engagementTrend)
                .topCities(topCities)
                .propertyTypeDistribution(propertyTypeDistribution)
                .build();
    }

    private Double getAveragePropertyPrice() {
        try {
            Object[] stats = propertyRepository.getPriceStatisticsByStatus(PropertyStatus.APPROVED);
            if (stats != null && stats.length > 0 && stats[0] instanceof Number) {
                return ((Number) stats[0]).doubleValue();
            }
            return 0.0;
        } catch (Exception e) {
            return 0.0;
        }
    }

    private List<Map<String, Object>> getUserSignupsTrend(int days) {
        String sql = """
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM users
            WHERE created_at >= NOW() - CAST(? || ' days' AS INTERVAL)
            GROUP BY DATE(created_at)
            ORDER BY date
            """;
        return jdbcTemplate.queryForList(sql, days);
    }

    private List<Map<String, Object>> getPropertyCreationTrend(int days) {
        String sql = """
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM property
            WHERE created_at >= NOW() - CAST(? || ' days' AS INTERVAL)
            GROUP BY DATE(created_at)
            ORDER BY date
            """;
        return jdbcTemplate.queryForList(sql, days);
    }

    private List<Map<String, Object>> getEngagementTrend(int days) {
        String sql = """
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM reviews
            WHERE created_at >= NOW() - CAST(? || ' days' AS INTERVAL)
            GROUP BY DATE(created_at)
            ORDER BY date
            """;
        return jdbcTemplate.queryForList(sql, days);
    }

    private List<Map<String, Object>> getRevenueTrend(int days) {
        String sql = """
            SELECT DATE(created_at) as date, COALESCE(SUM(amount), 0) as amount
            FROM advertisement_payments
            WHERE status = 'PAID' AND created_at >= NOW() - CAST(? || ' days' AS INTERVAL)
            GROUP BY DATE(created_at)
            ORDER BY date
            """;
        return jdbcTemplate.queryForList(sql, days);
    }

    private List<Map<String, Object>> getPropertyTypeDistribution() {
        String sql = """
            SELECT category as type, COUNT(*) as count
            FROM property
            GROUP BY category
            ORDER BY count DESC
            """;
        return jdbcTemplate.queryForList(sql);
    }

    @Transactional(readOnly = true)
    public List<MonthlyPointDTO> getMonthlyAnalytics() {
        String usersSql = """
            SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
                   COUNT(*) as count
            FROM users
            WHERE created_at >= DATE_TRUNC('year', NOW()) - INTERVAL '1 year'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
            """;
        String propertiesSql = """
            SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
                   COUNT(*) as count
            FROM property
            WHERE created_at >= DATE_TRUNC('year', NOW()) - INTERVAL '1 year'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
            """;
        String reviewsSql = """
            SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
                   COUNT(*) as count
            FROM reviews
            WHERE created_at >= DATE_TRUNC('year', NOW()) - INTERVAL '1 year'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
            """;
        String adsSql = """
            SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
                   COUNT(*) as count
            FROM advertisement_payments
            WHERE created_at >= DATE_TRUNC('year', NOW()) - INTERVAL '1 year'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
            """;
        String revenueSql = """
            SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
                   COALESCE(SUM(amount), 0) as total
            FROM advertisement_payments
            WHERE created_at >= DATE_TRUNC('year', NOW()) - INTERVAL '1 year'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
            """;
        String visitorsSql = """
            SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
                   COALESCE(SUM(view_count), 0) as total
            FROM property
            WHERE created_at >= DATE_TRUNC('year', NOW()) - INTERVAL '1 year'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
            """;

        Map<String, Integer> users = toCountMap(jdbcTemplate.queryForList(usersSql));
        Map<String, Integer> properties = toCountMap(jdbcTemplate.queryForList(propertiesSql));
        Map<String, Integer> reviews = toCountMap(jdbcTemplate.queryForList(reviewsSql));
        Map<String, Integer> ads = toCountMap(jdbcTemplate.queryForList(adsSql));
        Map<String, BigDecimal> revenue = toDecimalMap(jdbcTemplate.queryForList(revenueSql));
        Map<String, Long> visitors = toLongMap(jdbcTemplate.queryForList(visitorsSql));

        return mergeMonthly(users, properties, reviews, ads, revenue, visitors);
    }

    @Transactional(readOnly = true)
    public List<YearlyPointDTO> getYearlyAnalytics() {
        String usersSql = """
            SELECT EXTRACT(YEAR FROM created_at)::int as year, COUNT(*) as count
            FROM users
            GROUP BY EXTRACT(YEAR FROM created_at)
            ORDER BY year
            """;
        String propertiesSql = """
            SELECT EXTRACT(YEAR FROM created_at)::int as year, COUNT(*) as count
            FROM property
            GROUP BY EXTRACT(YEAR FROM created_at)
            ORDER BY year
            """;
        String reviewsSql = """
            SELECT EXTRACT(YEAR FROM created_at)::int as year, COUNT(*) as count
            FROM reviews
            GROUP BY EXTRACT(YEAR FROM created_at)
            ORDER BY year
            """;
        String adsSql = """
            SELECT EXTRACT(YEAR FROM created_at)::int as year, COUNT(*) as count
            FROM advertisement_payments
            GROUP BY EXTRACT(YEAR FROM created_at)
            ORDER BY year
            """;
        String revenueSql = """
            SELECT EXTRACT(YEAR FROM created_at)::int as year, COALESCE(SUM(amount), 0) as total
            FROM advertisement_payments
            GROUP BY EXTRACT(YEAR FROM created_at)
            ORDER BY year
            """;
        String visitorsSql = """
            SELECT EXTRACT(YEAR FROM created_at)::int as year, COALESCE(SUM(view_count), 0) as total
            FROM property
            GROUP BY EXTRACT(YEAR FROM created_at)
            ORDER BY year
            """;

        Map<Integer, Integer> users = toYearCountMap(jdbcTemplate.queryForList(usersSql));
        Map<Integer, Integer> properties = toYearCountMap(jdbcTemplate.queryForList(propertiesSql));
        Map<Integer, Integer> reviews = toYearCountMap(jdbcTemplate.queryForList(reviewsSql));
        Map<Integer, Integer> ads = toYearCountMap(jdbcTemplate.queryForList(adsSql));
        Map<Integer, BigDecimal> revenue = toYearDecimalMap(jdbcTemplate.queryForList(revenueSql));
        Map<Integer, Long> visitors = toYearLongMap(jdbcTemplate.queryForList(visitorsSql));

        return mergeYearly(users, properties, reviews, ads, revenue, visitors);
    }

    private Map<String, Integer> toCountMap(List<Map<String, Object>> rows) {
        Map<String, Integer> map = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            map.put((String) row.get("month"), ((Number) row.get("count")).intValue());
        }
        return map;
    }

    private Map<String, BigDecimal> toDecimalMap(List<Map<String, Object>> rows) {
        Map<String, BigDecimal> map = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            map.put((String) row.get("month"), new BigDecimal(row.get("total").toString()));
        }
        return map;
    }

    private Map<String, Long> toLongMap(List<Map<String, Object>> rows) {
        Map<String, Long> map = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            map.put((String) row.get("month"), ((Number) row.get("total")).longValue());
        }
        return map;
    }

    private Map<Integer, Integer> toYearCountMap(List<Map<String, Object>> rows) {
        Map<Integer, Integer> map = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            map.put(((Number) row.get("year")).intValue(), ((Number) row.get("count")).intValue());
        }
        return map;
    }

    private Map<Integer, BigDecimal> toYearDecimalMap(List<Map<String, Object>> rows) {
        Map<Integer, BigDecimal> map = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            map.put(((Number) row.get("year")).intValue(), new BigDecimal(row.get("total").toString()));
        }
        return map;
    }

    private Map<Integer, Long> toYearLongMap(List<Map<String, Object>> rows) {
        Map<Integer, Long> map = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            map.put(((Number) row.get("year")).intValue(), ((Number) row.get("total")).longValue());
        }
        return map;
    }

    private List<MonthlyPointDTO> mergeMonthly(
            Map<String, Integer> users, Map<String, Integer> properties,
            Map<String, Integer> reviews, Map<String, Integer> ads,
            Map<String, BigDecimal> revenue, Map<String, Long> visitors) {
        Set<String> months = new TreeSet<>();
        months.addAll(users.keySet());
        months.addAll(properties.keySet());
        months.addAll(reviews.keySet());
        months.addAll(ads.keySet());
        months.addAll(revenue.keySet());
        months.addAll(visitors.keySet());

        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM");
        java.time.format.DateTimeFormatter out = java.time.format.DateTimeFormatter.ofPattern("MMM yyyy");

        List<MonthlyPointDTO> result = new ArrayList<>();
        for (String m : months) {
            java.time.YearMonth ym = java.time.YearMonth.parse(m, fmt);
            result.add(MonthlyPointDTO.builder()
                    .month(m)
                    .monthLabel(ym.format(out))
                    .users(users.getOrDefault(m, 0))
                    .properties(properties.getOrDefault(m, 0))
                    .reviews(reviews.getOrDefault(m, 0))
                    .ads(ads.getOrDefault(m, 0))
                    .revenue(revenue.getOrDefault(m, BigDecimal.ZERO))
                    .visitors(visitors.getOrDefault(m, 0L))
                    .build());
        }
        return result;
    }

    private List<YearlyPointDTO> mergeYearly(
            Map<Integer, Integer> users, Map<Integer, Integer> properties,
            Map<Integer, Integer> reviews, Map<Integer, Integer> ads,
            Map<Integer, BigDecimal> revenue, Map<Integer, Long> visitors) {
        Set<Integer> years = new TreeSet<>();
        years.addAll(users.keySet());
        years.addAll(properties.keySet());
        years.addAll(reviews.keySet());
        years.addAll(ads.keySet());
        years.addAll(revenue.keySet());
        years.addAll(visitors.keySet());

        List<YearlyPointDTO> result = new ArrayList<>();
        for (int y : years) {
            result.add(YearlyPointDTO.builder()
                    .year(y)
                    .users(users.getOrDefault(y, 0))
                    .properties(properties.getOrDefault(y, 0))
                    .reviews(reviews.getOrDefault(y, 0))
                    .ads(ads.getOrDefault(y, 0))
                    .revenue(revenue.getOrDefault(y, BigDecimal.ZERO))
                    .visitors(visitors.getOrDefault(y, 0L))
                    .build());
        }
        return result;
    }
}
