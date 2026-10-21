package com.marocloc.marocloc_backend.dto;

import com.marocloc.marocloc_backend.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvertisementPaymentDTO {
    private Long id;
    private Long advertisementId;
    private Long userId;
    private Long amount;
    private String currency;
    private PaymentStatus status;
    private String stripeCheckoutSessionId;
    private String stripePaymentIntentId;
    private String stripeInvoiceId;
    private String receiptUrl;
    private String failureMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
