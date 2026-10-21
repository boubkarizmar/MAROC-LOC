package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvertisementMetricsRequest {

    @NotNull(message = "Advertisement id is required")
    private Long advertisementId;

    @Min(value = 0, message = "Views increment cannot be negative")
    private Long viewsIncrement = 0L;

    @Min(value = 0, message = "Clicks increment cannot be negative")
    private Long clicksIncrement = 0L;

    @Min(value = 0, message = "Impressions increment cannot be negative")
    private Long impressionsIncrement = 0L;
}
