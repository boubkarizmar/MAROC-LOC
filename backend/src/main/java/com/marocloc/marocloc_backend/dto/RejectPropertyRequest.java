package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RejectPropertyRequest {
    @jakarta.validation.constraints.NotNull(message = "Property ID is required")
    private Long propertyId;

    @jakarta.validation.constraints.NotBlank(message = "Reason is required")
    private String reason;
}
