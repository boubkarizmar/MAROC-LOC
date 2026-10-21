package com.marocloc.marocloc_backend.saga.propertyres;

import com.marocloc.marocloc_backend.model.*;
import com.marocloc.marocloc_backend.repository.PaymentTransactionRepository;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.PropertyReservationRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.service.CMIService;
import com.marocloc.marocloc_backend.service.EmailService;
import com.marocloc.marocloc_backend.saga.core.SagaContext;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;

import static com.marocloc.marocloc_backend.saga.propertyres.PropertyReservationSagaData.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class PropertyReservationSagaActions {

    private final PropertyRepository propertyRepository;
    private final PropertyReservationRepository propertyReservationRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;
    private final CMIService cmiService;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public void reserveProperty(SagaContext ctx) {
        Long propertyId = ctx.getLong(PROPERTY_ID);
        Long buyerId = ctx.getLong(USER_ID);
        String transactionTypeValue = ctx.get(TRANSACTION_TYPE);
        BigDecimal amount = BigDecimal.valueOf(ctx.<Double>get(AMOUNT));
        String currency = ctx.get(CURRENCY);
        String orderId = ctx.get(ORDER_ID);

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found: " + propertyId));
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + buyerId));
        User seller = property.getOwner();

        if (buyerId.equals(seller.getId())) {
            throw new IllegalArgumentException("Buyer cannot be the property owner");
        }
        if (!property.getStatus().isAvailableForTransaction()) {
            throw new IllegalStateException("Property is not available for transaction: " + property.getStatus());
        }

        PropertyReservationTransactionType transactionType =
                PropertyReservationTransactionType.valueOf(transactionTypeValue);

        PropertyReservation reservation = PropertyReservation.builder()
                .property(property)
                .buyer(buyer)
                .seller(seller)
                .transactionType(transactionType)
                .amount(amount)
                .currency(currency != null ? currency : "MAD")
                .status(PropertyReservationStatus.PENDING)
                .sagaCorrelationId(orderId)
                .expiresAt(transactionType == PropertyReservationTransactionType.RESERVATION
                        ? LocalDateTime.now().plusDays(7)
                        : null)
                .build();
        propertyReservationRepository.save(reservation);

        ctx.set(PROPERTY_RESERVATION_ID, reservation.getId());
        ctx.set(PREVIOUS_PROPERTY_STATUS, property.getStatus().name());

        property.setStatus(PropertyStatus.PENDING_PAYMENT);
        propertyRepository.save(property);

        notificationService.createFromTemplate(
                transactionType == PropertyReservationTransactionType.RESERVATION
                        ? NotificationTemplate.reservationCreated(seller.getId(), buyer.getId(), property.getId(), property.getTitle())
                        : NotificationTemplate.purchaseCreated(seller.getId(), buyer.getId(), property.getId(), property.getTitle())
        );

        log.info("Saga reserved property id={} for {} (reservation id={})", propertyId, transactionType, reservation.getId());
    }

    public void compensateReserveProperty(SagaContext ctx) {
        Long reservationId = ctx.getLong(PROPERTY_RESERVATION_ID);
        if (reservationId != null) {
            propertyReservationRepository.findById(reservationId).ifPresent(res -> {
                res.setStatus(PropertyReservationStatus.CANCELLED);
                propertyReservationRepository.save(res);
                try {
                    emailService.sendReservationFailureEmail(
                            res.getBuyer().getEmail(),
                            res.getProperty().getTitle(),
                            "Paiement refusé, annulé ou échoué",
                            res.getTransactionType().name()
                    );
                } catch (Exception e) {
                    log.error("Failed to send reservation failure email", e);
                }
                log.info("Saga compensated reservation id={} to CANCELLED", reservationId);
            });
        }
        Long propertyId = ctx.getLong(PROPERTY_ID);
        String previousStatus = ctx.get(PREVIOUS_PROPERTY_STATUS);
        if (propertyId != null && previousStatus != null) {
            propertyRepository.findById(propertyId).ifPresent(p -> {
                p.setStatus(PropertyStatus.valueOf(previousStatus));
                propertyRepository.save(p);
                log.info("Saga restored property id={} to status={}", propertyId, previousStatus);
            });
        }
    }

    public void initiatePayment(SagaContext ctx) {
        Long userId = ctx.getLong(USER_ID);
        Long propertyId = ctx.getLong(PROPERTY_ID);
        Long reservationId = ctx.getLong(PROPERTY_RESERVATION_ID);
        String orderId = ctx.get(ORDER_ID);
        Double amount = ctx.get(AMOUNT);
        String currency = ctx.get(CURRENCY);
        String lang = ctx.get(LANG);
        String email = ctx.get(USER_EMAIL);
        String provider = ctx.get(PROVIDER);
        String transactionTypeValue = ctx.get(TRANSACTION_TYPE);

        PaymentTransaction tx = PaymentTransaction.builder()
                .providerTransactionId(orderId)
                .amount(BigDecimal.valueOf(amount))
                .currency(currency)
                .status(PaymentStatus.PENDING)
                .userId(userId)
                .propertyId(propertyId)
                .propertyReservationId(reservationId)
                .transactionType(PropertyReservationTransactionType.valueOf(transactionTypeValue))
                .provider(provider)
                .build();
        paymentTransactionRepository.save(tx);
        ctx.set(PAYMENT_TRANSACTION_ID, tx.getId());

        Map<String, String> params = cmiService.buildPaymentRequest(orderId, amount, currency, lang, email);
        ctx.set(PAYMENT_PARAMS, params);
        log.info("Saga initiated {} payment for order={}", provider, orderId);
    }

    public void compensateInitiatePayment(SagaContext ctx) {
        Long txId = ctx.getLong(PAYMENT_TRANSACTION_ID);
        if (txId != null) {
            paymentTransactionRepository.findById(txId).ifPresent(tx -> {
                tx.setStatus(PaymentStatus.FAILED);
                paymentTransactionRepository.save(tx);
                log.info("Saga compensated payment transaction id={}", txId);
            });
        }
    }

    public void confirmPayment(SagaContext ctx) {
        String eventResult = ctx.get(EVENT_RESULT);
        if (!EVENT_SUCCESS.equalsIgnoreCase(eventResult)) {
            String reason = ctx.get(FAILURE_REASON);
            throw new RuntimeException("Payment failed or was rejected. Reason: " + reason);
        }

        String orderId = ctx.get(ORDER_ID);
        paymentTransactionRepository.findFirstByProviderTransactionIdOrderByCreatedAtDesc(orderId)
                .ifPresent(tx -> {
                    tx.setStatus(PaymentStatus.PAID);
                    paymentTransactionRepository.save(tx);
                    ctx.set(PAYMENT_TRANSACTION_ID, tx.getId());
                    log.info("Saga confirmed payment for order={}", orderId);
                });

        Long reservationId = ctx.getLong(PROPERTY_RESERVATION_ID);
        if (reservationId != null) {
            propertyReservationRepository.findById(reservationId).ifPresent(res -> {
                res.setStatus(PropertyReservationStatus.PAID);
                res.setPaymentTransactionId(ctx.getLong(PAYMENT_TRANSACTION_ID));
                propertyReservationRepository.save(res);
            });
        }
    }

    public void compensateConfirmPayment(SagaContext ctx) {
        String orderId = ctx.get(ORDER_ID);
        paymentTransactionRepository.findFirstByProviderTransactionIdOrderByCreatedAtDesc(orderId)
                .ifPresent(tx -> {
                    tx.setStatus(PaymentStatus.FAILED);
                    paymentTransactionRepository.save(tx);
                    log.info("Saga compensated confirmed payment for order={}", orderId);
                });
        Long reservationId = ctx.getLong(PROPERTY_RESERVATION_ID);
        if (reservationId != null) {
            propertyReservationRepository.findById(reservationId).ifPresent(res -> {
                res.setStatus(PropertyReservationStatus.PENDING);
                propertyReservationRepository.save(res);
            });
        }
    }

    public void activateProperty(SagaContext ctx) {
        Long propertyId = ctx.getLong(PROPERTY_ID);
        Long reservationId = ctx.getLong(PROPERTY_RESERVATION_ID);
        String transactionTypeValue = ctx.get(TRANSACTION_TYPE);

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found: " + propertyId));
        PropertyReservation reservation = propertyReservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found: " + reservationId));

        PropertyReservationTransactionType transactionType =
                PropertyReservationTransactionType.valueOf(transactionTypeValue);

        if (transactionType == PropertyReservationTransactionType.PURCHASE) {
            property.setStatus(PropertyStatus.SOLD);
            reservation.setStatus(PropertyReservationStatus.COMPLETED);
        } else {
            property.setStatus(PropertyStatus.RESERVED);
            reservation.setStatus(PropertyReservationStatus.PAID);
        }
        propertyRepository.save(property);
        propertyReservationRepository.save(reservation);

        Long buyerId = reservation.getBuyer().getId();
        Long sellerId = reservation.getSeller().getId();
        if (transactionType == PropertyReservationTransactionType.PURCHASE) {
            notificationService.createFromTemplate(NotificationTemplate.purchasePaid(sellerId, buyerId, property.getId(), property.getTitle()));
            notificationService.createFromTemplate(NotificationTemplate.propertySold(sellerId, buyerId, property.getId(), property.getTitle()));
        } else {
            notificationService.createFromTemplate(NotificationTemplate.reservationConfirmed(buyerId, sellerId, property.getId(), property.getTitle()));
            notificationService.createFromTemplate(NotificationTemplate.propertyReserved(sellerId, buyerId, property.getId(), property.getTitle()));
        }

        emailService.sendReservationConfirmationEmail(
                reservation.getBuyer().getEmail(),
                reservation.getSeller().getEmail(),
                property.getTitle(),
                reservation.getAmount(),
                reservation.getTransactionType().name()
        );

        log.info("Saga activated property id={} after {} (reservation id={})", propertyId, transactionType, reservationId);
    }

    public void compensateActivateProperty(SagaContext ctx) {
        Long propertyId = ctx.getLong(PROPERTY_ID);
        String previousStatus = ctx.get(PREVIOUS_PROPERTY_STATUS);
        if (propertyId != null && previousStatus != null) {
            propertyRepository.findById(propertyId).ifPresent(p -> {
                p.setStatus(PropertyStatus.valueOf(previousStatus));
                propertyRepository.save(p);
            });
        }
        Long reservationId = ctx.getLong(PROPERTY_RESERVATION_ID);
        if (reservationId != null) {
            propertyReservationRepository.findById(reservationId).ifPresent(res -> {
                res.setStatus(PropertyReservationStatus.PENDING);
                propertyReservationRepository.save(res);
            });
        }
    }



    private String buyerName(User buyer) {
        if (buyer.getFirstNameLatin() != null && buyer.getLastNameLatin() != null) {
            return buyer.getFirstNameLatin() + " " + buyer.getLastNameLatin();
        }
        return buyer.getEmail();
    }
}
