package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerRankingDTO {
    private Long userId;
    private String name;
    private String avatar;
    private String city;
    private Long propertyCount;
    private Double averageRating;
    private Long reviewCount;
    private Double responseRate;
    private Long premiumAdCount;
    private Long visitCount;
    private Boolean verified;
    private Double score;
}
