package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "property_reservation", indexes = {
        @Index(name = "idx_prop_res_buyer", columnList = "buyer_user_id"),
        @Index(name = "idx_prop_res_property", columnList = "property_id"),
        @Index(name = "idx_prop_res_status", columnList = "status"),
        @Index(name = "idx_prop_res_saga", columnList = "saga_correlation_id")
})
public class PropertyReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false, foreignKey = @ForeignKey(name = "fk_prop_res_property"))
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_prop_res_buyer"))
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_prop_res_seller"))
    private User seller;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private PropertyReservationTransactionType transactionType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PropertyReservationStatus status = PropertyReservationStatus.PENDING;

    @Column(name = "payment_transaction_id")
    private Long paymentTransactionId;

    @Column(name = "saga_correlation_id", length = 255)
    private String sagaCorrelationId;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (currency == null) {
            currency = "MAD";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
