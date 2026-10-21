package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovePropertyRequest {
    @jakarta.validation.constraints.NotNull(message = "Property ID is required")
    private Long propertyId;
}
