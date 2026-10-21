package com.marocloc.marocloc_backend.saga.paymentad;

import com.marocloc.marocloc_backend.dto.AdvertisementRequest;
import com.marocloc.marocloc_backend.model.*;
import com.marocloc.marocloc_backend.repository.AdvertisementPaymentRepository;
import com.marocloc.marocloc_backend.repository.AdvertisementRepository;
import com.marocloc.marocloc_backend.repository.PaymentTransactionRepository;
import com.marocloc.marocloc_backend.service.AdvertisementService;
import com.marocloc.marocloc_backend.service.CMIService;
import com.marocloc.marocloc_backend.service.StripeService;
import com.marocloc.marocloc_backend.saga.core.SagaContext;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.marocloc.marocloc_backend.saga.paymentad.PaymentAdvertisementSagaData.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentAdvertisementSagaActions {

    private final AdvertisementService advertisementService;
    private final AdvertisementRepository advertisementRepository;
    private final AdvertisementPaymentRepository advertisementPaymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final CMIService cmiService;
    private final StripeService stripeService;

    public void reserveAdvertisement(SagaContext ctx) {
        Long existingAdId = ctx.getLong(ADVERTISEMENT_ID);

        if (existingAdId != null) {
            Advertisement ad = advertisementRepository.findById(existingAdId)
                    .orElseThrow(() -> new IllegalArgumentException("Advertisement not found: " + existingAdId));
            ctx.set("previousAdStatus", ad.getStatus().name());
            ad.setStatus(AdvertisementStatus.PENDING_PAYMENT);
            ad.setPaymentStatus(PaymentStatus.PENDING);
            ad.setIsActive(false);
            ad.setUpdatedAt(LocalDateTime.now());
            advertisementRepository.save(ad);
            log.info("Saga reserved existing advertisement id={}", existingAdId);
            return;
        }

        AdvertisementRequest request = ctx.get(ADVERTISEMENT_REQUEST);
        if (request == null) {
            throw new IllegalArgumentException("Advertisement request or advertisementId is required");
        }

        // Force pending state for the Saga flow
        request.setStatus(AdvertisementStatus.PENDING_PAYMENT);
        request.setPaymentStatus(PaymentStatus.PENDING);
        request.setIsActive(false);

        var dto = advertisementService.createAd(request);
        advertisementRepository.findById(dto.getId()).ifPresent(ad -> {
            Long userId = ctx.getLong(USER_ID);
            String userEmail = ctx.get(USER_EMAIL);
            if (userId != null) {
                ad.setCreatedByUserId(userId);
            }
            if (userEmail != null) {
                ad.setCreatedByUserEmail(userEmail);
            }
            advertisementRepository.save(ad);
        });

        ctx.set(ADVERTISEMENT_ID, dto.getId());
        ctx.set("previousAdStatus", AdvertisementStatus.DRAFT.name());
        log.info("Saga reserved new advertisement id={}", dto.getId());
    }

    public void compensateReserveAdvertisement(SagaContext ctx) {
        Long adId = ctx.getLong(ADVERTISEMENT_ID);
        if (adId == null) {
            return;
        }
        advertisementRepository.findById(adId).ifPresent(ad -> {
            String previous = ctx.get("previousAdStatus");
            AdvertisementStatus restored = previous != null ? AdvertisementStatus.valueOf(previous) : AdvertisementStatus.DRAFT;
            ad.setStatus(restored);
            ad.setPaymentStatus(PaymentStatus.FAILED);
            ad.setIsActive(false);
            ad.setUpdatedAt(LocalDateTime.now());
            advertisementRepository.save(ad);
            log.info("Saga compensated advertisement id={} to status={}", adId, restored);
        });
    }

    public void initiatePayment(SagaContext ctx) {
        String provider = ctx.get(PROVIDER);
        if (PROVIDER_CMI.equalsIgnoreCase(provider)) {
            initiateCmiPayment(ctx);
        } else if (PROVIDER_STRIPE.equalsIgnoreCase(provider)) {
            initiateStripePayment(ctx);
        } else {
            throw new IllegalArgumentException("Unsupported payment provider: " + provider);
        }
    }

    private void initiateCmiPayment(SagaContext ctx) {
        Long userId = ctx.getLong(USER_ID);
        Long adId = ctx.getLong(ADVERTISEMENT_ID);
        String orderId = ctx.get(ORDER_ID);
        Double amount = ctx.get(AMOUNT);
        String currency = ctx.get(CURRENCY);
        String lang = ctx.get(LANG);
        String email = ctx.get(USER_EMAIL);

        if (orderId == null) {
            orderId = "SAGA-" + System.currentTimeMillis();
            ctx.set(ORDER_ID, orderId);
        }

        PaymentTransaction tx = PaymentTransaction.builder()
                .providerTransactionId(orderId)
                .amount(BigDecimal.valueOf(amount))
                .currency(currency)
                .status(PaymentStatus.PENDING)
                .userId(userId)
                .advertisementId(adId)
                .createdAt(LocalDateTime.now())
                .build();
        paymentTransactionRepository.save(tx);
        ctx.set(PAYMENT_TRANSACTION_ID, tx.getId());

        Map<String, String> params = cmiService.buildPaymentRequest(orderId, amount, currency, lang, email);
        ctx.set(PAYMENT_PARAMS, params);
        log.info("Saga initiated CMI payment for order={}", orderId);
    }

    private void initiateStripePayment(SagaContext ctx) {
        Long adId = ctx.getLong(ADVERTISEMENT_ID);
        Long userId = ctx.getLong(USER_ID);
        Double amount = ctx.get(AMOUNT);
        String currency = ctx.get(CURRENCY);
        String correlationId = ctx.get(CORRELATION_ID);

        AdvertisementPayment payment = AdvertisementPayment.builder()
                .advertisementId(adId)
                .userId(userId)
                .amount(amount.longValue()) // minor units
                .currency(currency)
                .status(PaymentStatus.PENDING)
                .sagaCorrelationId(correlationId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        advertisementPaymentRepository.save(payment);
        ctx.set(PAYMENT_TRANSACTION_ID, payment.getId());

        Advertisement ad = advertisementRepository.findById(adId)
                .orElseThrow(() -> new IllegalArgumentException("Advertisement not found: " + adId));

        String successUrl = ctx.get(SUCCESS_URL);
        String cancelUrl = ctx.get(CANCEL_URL);

        try {
            Session session = stripeService.createCheckoutSession(ad, successUrl, cancelUrl, correlationId);
            payment.setStripeCheckoutSessionId(session.getId());
            payment.setUpdatedAt(LocalDateTime.now());
            advertisementPaymentRepository.save(payment);

            ad.setStripeCheckoutSessionId(session.getId());
            advertisementRepository.save(ad);

            ctx.set(CHECKOUT_SESSION_ID, session.getId());
            ctx.set(CHECKOUT_URL, session.getUrl());
            log.info("Saga initiated Stripe checkout session={} for advertisement id={}", session.getId(), adId);
        } catch (StripeException e) {
            throw new RuntimeException("Stripe checkout session creation failed: " + e.getMessage(), e);
        }
    }

    public void compensateInitiatePayment(SagaContext ctx) {
        String provider = ctx.get(PROVIDER);
        Long paymentId = ctx.getLong(PAYMENT_TRANSACTION_ID);
        if (paymentId == null) {
            return;
        }
        if (PROVIDER_CMI.equalsIgnoreCase(provider)) {
            paymentTransactionRepository.findById(paymentId).ifPresent(tx -> {
                tx.setStatus(PaymentStatus.FAILED);
                paymentTransactionRepository.save(tx);
                log.info("Saga compensated CMI payment transaction id={}", paymentId);
            });
        } else if (PROVIDER_STRIPE.equalsIgnoreCase(provider)) {
            advertisementPaymentRepository.findById(paymentId).ifPresent(p -> {
                p.setStatus(PaymentStatus.FAILED);
                p.setUpdatedAt(LocalDateTime.now());
                advertisementPaymentRepository.save(p);
                log.info("Saga compensated Stripe payment id={}", paymentId);
            });
        }
    }

    public void confirmPayment(SagaContext ctx) {
        String eventResult = ctx.get(EVENT_RESULT);
        if (!EVENT_SUCCESS.equalsIgnoreCase(eventResult)) {
            String reason = ctx.get(FAILURE_REASON);
            throw new RuntimeException("Payment failed or was rejected. Reason: " + reason);
        }

        String provider = ctx.get(PROVIDER);
        if (PROVIDER_CMI.equalsIgnoreCase(provider)) {
            confirmCmiPayment(ctx);
        } else if (PROVIDER_STRIPE.equalsIgnoreCase(provider)) {
            confirmStripePayment(ctx);
        }
    }

    private void confirmCmiPayment(SagaContext ctx) {
        String orderId = ctx.get(ORDER_ID);
        paymentTransactionRepository.findFirstByProviderTransactionIdOrderByCreatedAtDesc(orderId)
                .ifPresent(tx -> {
                    tx.setStatus(PaymentStatus.PAID);
                    paymentTransactionRepository.save(tx);
                    ctx.set(PAYMENT_TRANSACTION_ID, tx.getId());
                    log.info("Saga confirmed CMI payment for order={}", orderId);
                });
    }

    private void confirmStripePayment(SagaContext ctx) {
        Long paymentId = ctx.getLong(PAYMENT_TRANSACTION_ID);
        String paymentIntentId = ctx.get(STRIPE_PAYMENT_INTENT_ID);
        String invoiceId = ctx.get(STRIPE_INVOICE_ID);
        String checkoutSessionId = ctx.get(CHECKOUT_SESSION_ID);

        advertisementPaymentRepository.findById(paymentId).ifPresent(p -> {
            p.setStatus(PaymentStatus.PAID);
            p.setStripePaymentIntentId(paymentIntentId);
            p.setStripeInvoiceId(invoiceId);
            if (checkoutSessionId != null) {
                p.setStripeCheckoutSessionId(checkoutSessionId);
            }
            p.setUpdatedAt(LocalDateTime.now());
            advertisementPaymentRepository.save(p);
            log.info("Saga confirmed Stripe payment id={}", paymentId);
        });

        if (paymentIntentId != null) {
            Long adId = ctx.getLong(ADVERTISEMENT_ID);
            advertisementRepository.findById(adId).ifPresent(ad -> {
                ad.setStripePaymentIntentId(paymentIntentId);
                advertisementRepository.save(ad);
            });
        }
    }

    public void compensateConfirmPayment(SagaContext ctx) {
        // After payment confirmation, the only compensation is to mark the payment as FAILED/REFUND_PENDING.
        String provider = ctx.get(PROVIDER);
        if (PROVIDER_CMI.equalsIgnoreCase(provider)) {
            String orderId = ctx.get(ORDER_ID);
            paymentTransactionRepository.findFirstByProviderTransactionIdOrderByCreatedAtDesc(orderId)
                    .ifPresent(tx -> {
                        tx.setStatus(PaymentStatus.FAILED);
                        paymentTransactionRepository.save(tx);
                        log.info("Saga compensated confirmed CMI payment for order={}", orderId);
                    });
        } else if (PROVIDER_STRIPE.equalsIgnoreCase(provider)) {
            Long paymentId = ctx.getLong(PAYMENT_TRANSACTION_ID);
            advertisementPaymentRepository.findById(paymentId).ifPresent(p -> {
                // A real refund would require a Stripe API call; we flag it for manual processing.
                p.setStatus(PaymentStatus.REFUND_PENDING);
                p.setUpdatedAt(LocalDateTime.now());
                advertisementPaymentRepository.save(p);
                log.info("Saga compensated confirmed Stripe payment id={} - refund pending manual action", paymentId);
            });
        }
    }

    public void activateAdvertisement(SagaContext ctx) {
        Long adId = ctx.getLong(ADVERTISEMENT_ID);
        String orderId = ctx.get(ORDER_ID);
        Advertisement advertisement = advertisementRepository.findById(adId)
                .orElseThrow(() -> new IllegalArgumentException("Advertisement not found: " + adId));
        advertisement.setPaymentStatus(PaymentStatus.PAID);
        advertisement.setStatus(AdvertisementStatus.PENDING_APPROVAL);
        advertisement.setUpdatedAt(LocalDateTime.now());
        advertisementRepository.save(advertisement);
        log.info("Saga activated advertisement id={} after payment (tx: {})", adId, orderId);
    }

    public void compensateActivateAdvertisement(SagaContext ctx) {
        Long adId = ctx.getLong(ADVERTISEMENT_ID);
        if (adId == null) {
            return;
        }
        advertisementRepository.findById(adId).ifPresent(ad -> {
            ad.setPaymentStatus(PaymentStatus.FAILED);
            ad.setStatus(AdvertisementStatus.PENDING_PAYMENT);
            ad.setUpdatedAt(LocalDateTime.now());
            advertisementRepository.save(ad);
            log.info("Saga compensated advertisement activation id={}", adId);
        });
    }

    public void setCheckoutResult(SagaContext ctx, String checkoutSessionId, String checkoutUrl) {
        ctx.set(CHECKOUT_SESSION_ID, checkoutSessionId);
        ctx.set(CHECKOUT_URL, checkoutUrl);
    }
}
