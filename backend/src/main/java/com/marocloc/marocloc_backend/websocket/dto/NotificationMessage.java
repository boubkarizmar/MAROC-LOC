package com.marocloc.marocloc_backend.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {

    public enum NotificationType {
        // Authentication
        ACCOUNT_CREATED, EMAIL_VERIFICATION, ACCOUNT_VALIDATED, PASSWORD_CHANGED, SUSPICIOUS_LOGIN,
        // Reservation / purchase
        RESERVATION_CREATED, RESERVATION_CONFIRMED, RESERVATION_REFUSED, RESERVATION_CANCELLED, RESERVATION_EXPIRED,
        PURCHASE_CREATED, PURCHASE_PAID, PURCHASE_FAILED,
        // Payment
        PAYMENT_CMI_SUCCESS, PAYMENT_STRIPE_SUCCESS, PAYMENT_FAILED, PAYMENT_REFUNDED, PAYMENT_PENDING,
        // Advertisement
        ADVERTISEMENT_CREATED, ADVERTISEMENT_APPROVED, ADVERTISEMENT_REJECTED, ADVERTISEMENT_EXPIRED, ADVERTISEMENT_EXPIRING_SOON,
        // Property
        PROPERTY_CREATED, PROPERTY_APPROVED, PROPERTY_REJECTED, PROPERTY_SOLD, PROPERTY_RESERVED,
        // Messages
        NEW_MESSAGE, NEW_CONVERSATION,
        // Reviews
        NEW_REVIEW, REVIEW_APPROVED, REVIEW_REJECTED,
        // Visits
        VISIT_SCHEDULED, VISIT_CONFIRMED, VISIT_CANCELLED, VISIT_COMPLETED, VISIT_REMINDER,
        // AI / system
        AI_RECOMMENDATION, SYSTEM_ANNOUNCEMENT, PRICE_DROP, FRAUD_FLAG,
        // Legacy aliases
        SUBSCRIPTION_EXPIRING, RESERVATION_REQUEST, RESERVATION_PAID
    }

    private String id;
    private NotificationType type;
    private Long userId;
    private String title;
    private String body;
    private String actionUrl;
    private String imageUrl;
    private Instant timestamp;
    private Boolean read;
}
