package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyRankedDTO {
    private Long id;
    private String title;
    private BigDecimal price;
    private String city;
    private List<String> images;
    private Integer finalScore;
    private ScoreBreakdownDTO scoreBreakdown;
    private Integer trend;
    private Integer rank;
    private String explanation;

    // Enriched fields for homepage cards
    private String ownerName;
    private Integer bedrooms;
    private Integer bathrooms;
    private Double surface;
    private String type;
    private LocalDateTime createdAt;
    private Double pricePerSquareMeter;
}
