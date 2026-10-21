package com.marocloc.marocloc_backend.dto;

import com.marocloc.marocloc_backend.model.PropertyReservation;
import com.marocloc.marocloc_backend.model.PropertyReservationStatus;
import com.marocloc.marocloc_backend.model.PropertyReservationTransactionType;
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
public class PropertyReservationDTO {

    private Long id;
    private Long propertyId;
    private String propertyTitle;
    private Long buyerId;
    private String buyerEmail;
    private Long sellerId;
    private String sellerEmail;
    private PropertyReservationTransactionType transactionType;
    private BigDecimal amount;
    private String currency;
    private PropertyReservationStatus status;
    private Long paymentTransactionId;
    private String sagaCorrelationId;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PropertyReservationDTO from(PropertyReservation reservation) {
        if (reservation == null) {
            return null;
        }
        return PropertyReservationDTO.builder()
                .id(reservation.getId())
                .propertyId(reservation.getProperty() != null ? reservation.getProperty().getId() : null)
                .propertyTitle(reservation.getProperty() != null ? reservation.getProperty().getTitle() : null)
                .buyerId(reservation.getBuyer() != null ? reservation.getBuyer().getId() : null)
                .buyerEmail(reservation.getBuyer() != null ? reservation.getBuyer().getEmail() : null)
                .sellerId(reservation.getSeller() != null ? reservation.getSeller().getId() : null)
                .sellerEmail(reservation.getSeller() != null ? reservation.getSeller().getEmail() : null)
                .transactionType(reservation.getTransactionType())
                .amount(reservation.getAmount())
                .currency(reservation.getCurrency())
                .status(reservation.getStatus())
                .paymentTransactionId(reservation.getPaymentTransactionId())
                .sagaCorrelationId(reservation.getSagaCorrelationId())
                .expiresAt(reservation.getExpiresAt())
                .createdAt(reservation.getCreatedAt())
                .updatedAt(reservation.getUpdatedAt())
                .build();
    }
}
