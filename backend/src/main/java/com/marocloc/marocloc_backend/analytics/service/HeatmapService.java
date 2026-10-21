package com.marocloc.marocloc_backend.analytics.service;

import com.marocloc.marocloc_backend.analytics.dto.HeatmapDTO;
import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HeatmapService {

    private final PropertyRepository propertyRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<HeatmapDTO> getPropertyDensityHeatmap() {
        String sql = """
            SELECT
                ROUND(CAST(latitude AS numeric), 2) as lat,
                ROUND(CAST(longitude AS numeric), 2) as lon,
                COUNT(*) as count,
                COALESCE(AVG(price), 0) as avg_price,
                city
            FROM property
            WHERE latitude IS NOT NULL
              AND longitude IS NOT NULL
              AND status IN ('APPROVED', 'AVAILABLE')
            GROUP BY ROUND(CAST(latitude AS numeric), 2), ROUND(CAST(longitude AS numeric), 2), city
            ORDER BY count DESC
            LIMIT 500
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> HeatmapDTO.builder()
                .latitude(rs.getDouble("lat"))
                .longitude(rs.getDouble("lon"))
                .intensity(rs.getInt("count"))
                .propertyCount((long) rs.getInt("count"))
                .averagePrice(rs.getDouble("avg_price"))
                .city(rs.getString("city"))
                .neighborhood(null)
                .build());
    }

    @Transactional(readOnly = true)
    public List<HeatmapDTO> getPriceHeatmap() {
        String sql = """
            SELECT
                ROUND(CAST(latitude AS numeric), 2) as lat,
                ROUND(CAST(longitude AS numeric), 2) as lon,
                COUNT(*) as count,
                COALESCE(AVG(price), 0) as avg_price,
                city
            FROM property
            WHERE latitude IS NOT NULL
              AND longitude IS NOT NULL
              AND status IN ('APPROVED', 'AVAILABLE')
              AND price > 0
            GROUP BY ROUND(CAST(latitude AS numeric), 2), ROUND(CAST(longitude AS numeric), 2), city
            ORDER BY avg_price DESC
            LIMIT 500
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> HeatmapDTO.builder()
                .latitude(rs.getDouble("lat"))
                .longitude(rs.getDouble("lon"))
                .intensity((int) (rs.getDouble("avg_price") / 10000))
                .propertyCount((long) rs.getInt("count"))
                .averagePrice(rs.getDouble("avg_price"))
                .city(rs.getString("city"))
                .neighborhood(null)
                .build());
    }

    @Transactional(readOnly = true)
    public List<HeatmapDTO> getViewHeatmap() {
        String sql = """
            SELECT
                ROUND(CAST(latitude AS numeric), 2) as lat,
                ROUND(CAST(longitude AS numeric), 2) as lon,
                COUNT(*) as count,
                COALESCE(SUM(view_count), 0) as total_views,
                COALESCE(AVG(price), 0) as avg_price,
                city
            FROM property
            WHERE latitude IS NOT NULL
              AND longitude IS NOT NULL
              AND status IN ('APPROVED', 'AVAILABLE')
            GROUP BY ROUND(CAST(latitude AS numeric), 2), ROUND(CAST(longitude AS numeric), 2), city
            ORDER BY total_views DESC
            LIMIT 500
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> HeatmapDTO.builder()
                .latitude(rs.getDouble("lat"))
                .longitude(rs.getDouble("lon"))
                .intensity(rs.getInt("total_views"))
                .propertyCount((long) rs.getInt("count"))
                .averagePrice(rs.getDouble("avg_price"))
                .city(rs.getString("city"))
                .neighborhood(null)
                .build());
    }
}
