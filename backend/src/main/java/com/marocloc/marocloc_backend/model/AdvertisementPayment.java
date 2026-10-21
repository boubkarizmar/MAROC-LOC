package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "advertisement_payments")
public class AdvertisementPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long advertisementId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false, length = 10)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(length = 128)
    private String stripeCheckoutSessionId;

    @Column(length = 128)
    private String stripePaymentIntentId;

    @Column(length = 128)
    private String stripeInvoiceId;

    @Column(length = 512)
    private String receiptUrl;

    @Column(length = 512)
    private String failureMessage;

    @Column(name = "saga_correlation_id", length = 128)
    private String sagaCorrelationId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
