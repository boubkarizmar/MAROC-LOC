package com.marocloc.marocloc_backend.dto;

import com.marocloc.marocloc_backend.model.AdvertisementPlan;
import com.marocloc.marocloc_backend.model.AdvertisementType;
import com.marocloc.marocloc_backend.model.AdvertisementStatus;
import com.marocloc.marocloc_backend.model.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvertisementRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 1024, message = "Description cannot exceed 1024 characters")
    private String description;

    private String imageUrl;

    private String videoUrl;

    @NotNull(message = "Advertisement type is required")
    private AdvertisementType type;

    @NotNull(message = "Plan is required")
    private AdvertisementPlan plan;

    @NotEmpty(message = "At least one property id is required")
    private List<Long> propertyIds;

    private Long propertyId;

    private Boolean isActive;

    private AdvertisementStatus status;

    private PaymentStatus paymentStatus;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private Integer priority;

    @DecimalMin(value = "0.0", inclusive = false, message = "Budget must be positive")
    private BigDecimal budget;

    private String currency;

    private String targetAudience;

    private String paymentReference;

    private String adminComment;
}
