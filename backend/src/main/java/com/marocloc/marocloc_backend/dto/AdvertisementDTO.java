package com.marocloc.marocloc_backend.dto;

import com.marocloc.marocloc_backend.model.AdvertisementPlan;
import com.marocloc.marocloc_backend.model.AdvertisementType;
import com.marocloc.marocloc_backend.model.AdvertisementStatus;
import com.marocloc.marocloc_backend.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvertisementDTO {

    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private String videoUrl;
    private AdvertisementType type;
    private AdvertisementPlan plan;
    private Long propertyId;
    private List<Long> propertyIds;
    private Boolean isActive;
    private AdvertisementStatus status;
    private PaymentStatus paymentStatus;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer priority;
    private BigDecimal budget;
    private String currency;
    private String targetAudience;
    private String paymentReference;
    private String adminComment;
    private Long createdByUserId;
    private String createdByUserEmail;
    private Long views;
    private Long clicks;
    private Long impressions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private PropertyDTO property;
}
