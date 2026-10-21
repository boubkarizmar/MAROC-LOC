package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StripeCheckoutSessionResponse {
    private String sessionId;
    private String checkoutUrl;
    private Long sagaId;
    private Long advertisementId;
}
