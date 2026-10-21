package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRefundRequest {
    @NotBlank(message = "Refund reason is required")
    private String reason;
}
