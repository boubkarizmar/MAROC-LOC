package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerRatingDTO {

    private Long userId;
    private String userName;
    private Double overallScore;
    private Double responseSpeedScore;
    private Double trustScore;
    private Double professionalismScore;
    private Double propertyQualityScore;
    private Integer totalReviews;
    private Integer totalProperties;
    private Double responseRate;
    private Double avgResponseHours;
    private LocalDateTime updatedAt;
}
