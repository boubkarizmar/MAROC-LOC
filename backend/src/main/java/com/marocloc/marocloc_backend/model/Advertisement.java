package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder.Default;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "advertisements")
public class Advertisement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1024)
    private String description;

    @Column(length = 1024)
    private String imageUrl;

    @Column(length = 1024)
    private String videoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdvertisementType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdvertisementPlan plan;

    private Long propertyId;

    @Column(columnDefinition = "TEXT")
    private String propertyIds;

    @Column(nullable = false)
    @Default
    private Boolean isActive = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Default
    private AdvertisementStatus status = AdvertisementStatus.PENDING_PAYMENT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(length = 128)
    private String stripeCheckoutSessionId;

    @Column(length = 128)
    private String stripePaymentIntentId;

    @Column(length = 128)
    private String stripeInvoiceId;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    @Default
    private Integer priority = 0;

    @Column(precision = 15, scale = 2)
    private BigDecimal budget;

    @Column(length = 10)
    @Default
    private String currency = "MAD";

    @Column(columnDefinition = "TEXT")
    private String targetAudience;

    @Column(length = 256)
    private String paymentReference;

    @Column(length = 1024)
    private String adminComment;

    private Long createdByUserId;

    @Column(length = 255)
    private String createdByUserEmail;

    @Column(nullable = false)
    @Default
    private Long views = 0L;

    @Column(nullable = false)
    @Default
    private Long clicks = 0L;

    @Column(nullable = false)
    @Default
    private Long impressions = 0L;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
