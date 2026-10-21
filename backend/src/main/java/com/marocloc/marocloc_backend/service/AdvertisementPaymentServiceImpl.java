package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.AdvertisementPaymentDTO;
import com.marocloc.marocloc_backend.dto.AdvertisementPlanCheckoutRequest;
import com.marocloc.marocloc_backend.dto.AdvertisementPlanInfoDTO;
import com.marocloc.marocloc_backend.dto.StripeCheckoutSessionResponse;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.model.*;
import com.marocloc.marocloc_backend.repository.AdvertisementPaymentRepository;
import com.marocloc.marocloc_backend.repository.AdvertisementRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import com.marocloc.marocloc_backend.saga.core.SagaOrchestrator;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.marocloc.marocloc_backend.saga.paymentad.PaymentAdvertisementSagaData.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdvertisementPaymentServiceImpl implements AdvertisementPaymentService {

    private final AdvertisementRepository advertisementRepository;
    private final AdvertisementPaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final StripeService stripeService;
    private final SagaOrchestrator sagaOrchestrator;
    private final NotificationService notificationService;

    @Override
    public List<AdvertisementPlanInfoDTO> getAvailablePlans() {
        return Arrays.stream(AdvertisementPlan.values())
                .map(plan -> AdvertisementPlanInfoDTO.builder()
                        .name(plan.name())
                        .displayName(plan.getDisplayName())
                        .description(plan.getDescription())
                        .amountMinorUnits(plan.getAmountMinorUnits())
                        .maxProperties(plan.getMaxProperties())
                        .maxImages(plan.getMaxImages())
                        .videoAllowed(plan.isVideoAllowed())
                        .homepagePlacement(plan.isHomepagePlacement())
                        .featuredBadge(plan.isFeaturedBadge())
                        .supportsAdvancedTargeting(plan.isSupportsAdvancedTargeting())
                        .durationDays(plan.getDurationDays())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StripeCheckoutSessionResponse createCheckoutSession(AdvertisementPlanCheckoutRequest request, String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("User", username));

        AdvertisementPlan plan = request.getPlan();
        if (request.getPropertyIds().size() > plan.getMaxProperties()) {
            throw new IllegalArgumentException("The selected plan does not allow more than " + plan.getMaxProperties() + " properties.");
        }

        LocalDate today = LocalDate.now();
        int durationDays = request.getDurationMonths() != null ? request.getDurationMonths() * 30 : plan.getDurationDays();
        LocalDate endDate = today.plusDays(durationDays);

        Advertisement advertisement = Advertisement.builder()
                .title(plan.getDisplayName())
                .description(plan.getDescription())
                .imageUrl(null)
                .videoUrl(null)
                .type(plan == AdvertisementPlan.PREMIUM_ADS ? AdvertisementType.BANNER : AdvertisementType.PROPERTY)
                .plan(plan)
                .propertyId(request.getPropertyIds().get(0))
                .propertyIds(request.getPropertyIds().stream()
                        .map(String::valueOf)
                        .collect(Collectors.joining(",")))
                .isActive(false)
                .status(AdvertisementStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .startDate(today)
                .endDate(endDate)
                .priority(plan == AdvertisementPlan.PREMIUM_ADS ? 100 : plan == AdvertisementPlan.BOOST_PRO ? 50 : 10)
                .budget(BigDecimal.valueOf(plan.getAmountMinorUnits()).divide(BigDecimal.valueOf(100)))
                .currency("MAD")
                .targetAudience(request.getTargetAudience())
                .createdByUserId(user.getId())
                .createdByUserEmail(user.getEmail())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Advertisement savedAd = advertisementRepository.save(advertisement);

        try {
            Session stripeSession = stripeService.createCheckoutSession(savedAd,
                    request.getSuccessUrl() != null ? request.getSuccessUrl() : stripeService.getStripeConfig().getSuccessUrl(),
                    request.getCancelUrl() != null ? request.getCancelUrl() : stripeService.getStripeConfig().getCancelUrl());

            AdvertisementPayment payment = AdvertisementPayment.builder()
                    .advertisementId(savedAd.getId())
                    .userId(user.getId())
                    .amount(plan.getAmountMinorUnits())
                    .currency(stripeService.getStripeConfig().getCurrency())
                    .status(PaymentStatus.PENDING)
                    .stripeCheckoutSessionId(stripeSession.getId())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            paymentRepository.save(payment);

            savedAd.setStripeCheckoutSessionId(stripeSession.getId());
            advertisementRepository.save(savedAd);

            return StripeCheckoutSessionResponse.builder()
                    .sessionId(stripeSession.getId())
                    .checkoutUrl(stripeSession.getUrl())
                    .build();
        } catch (StripeException e) {
            throw new RuntimeException("Stripe checkout failed: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void handleStripeWebhook(String payload, String signature) {
        try {
            Event event = stripeService.constructEvent(payload, signature);
            String type = event.getType();

            if ("checkout.session.completed".equals(type)) {
                Session session = extractSessionFromEvent(event);
                if (session != null) {
                    String correlationId = extractCorrelationId(session);
                    if (correlationId != null) {
                        advanceSagaWithSuccess(session, correlationId);
                    } else {
                        processCheckoutCompleted(session);
                    }
                } else {
                    log.warn("Could not deserialize checkout.session object from event {}", event.getId());
                }
            } else if ("payment_intent.payment_failed".equals(type)) {
                Object dataObject = event.getDataObjectDeserializer().getObject().orElse(null);
                if (dataObject instanceof PaymentIntent intent) {
                    Optional<AdvertisementPayment> paymentOpt = paymentRepository.findByStripePaymentIntentId(intent.getId());
                    if (paymentOpt.isPresent() && paymentOpt.get().getSagaCorrelationId() != null) {
                        advanceSagaWithFailure(intent, paymentOpt.get().getSagaCorrelationId());
                    } else {
                        processPaymentFailed(intent);
                    }
                }
            }
        } catch (SignatureVerificationException e) {
            throw new RuntimeException("Stripe webhook signature verification failed", e);
        }
    }

    private String extractCorrelationId(Session session) {
        Map<String, String> metadata = session.getMetadata();
        if (metadata != null && metadata.containsKey("correlationId")) {
            return metadata.get("correlationId");
        }
        // Fallback: lookup by session id and use stored correlation id
        return paymentRepository.findByStripeCheckoutSessionId(session.getId())
                .map(AdvertisementPayment::getSagaCorrelationId)
                .orElse(null);
    }

    /**
     * Extract a Stripe Checkout Session from a webhook event. The SDK deserializer
     * may return an empty Optional when the event was produced by a newer API version
     * or contains unknown fields, so we fall back to manual parsing of the raw JSON.
     */
    private Session extractSessionFromEvent(Event event) {
        Object dataObject = event.getDataObjectDeserializer().getObject().orElse(null);
        if (dataObject instanceof Session session) {
            return session;
        }

        String rawJson = event.getDataObjectDeserializer().getRawJson();
        if (rawJson == null || rawJson.isBlank()) {
            return null;
        }
        JsonObject raw = JsonParser.parseString(rawJson).getAsJsonObject();
        if (!raw.has("object") || !"checkout.session".equals(raw.get("object").getAsString())) {
            return null;
        }

        Session session = new Session();
        session.setId(getString(raw, "id"));
        session.setPaymentIntent(getString(raw, "payment_intent"));
        session.setInvoice(getString(raw, "invoice"));

        if (raw.has("metadata") && !raw.get("metadata").isJsonNull()) {
            JsonObject metadataJson = raw.get("metadata").getAsJsonObject();
            Map<String, String> metadata = new HashMap<>();
            metadataJson.entrySet().forEach(e -> metadata.put(e.getKey(), e.getValue().getAsString()));
            session.setMetadata(metadata);
        }

        return session;
    }

    private String getString(JsonObject obj, String key) {
        if (!obj.has(key) || obj.get(key).isJsonNull()) {
            return null;
        }
        return obj.get(key).getAsString();
    }

    private void advanceSagaWithSuccess(Session session, String correlationId) {
        Map<String, Object> eventData = new HashMap<>();
        eventData.put(EVENT_RESULT, EVENT_SUCCESS);
        eventData.put(CHECKOUT_SESSION_ID, session.getId());
        eventData.put(STRIPE_PAYMENT_INTENT_ID, session.getPaymentIntent());
        eventData.put(STRIPE_INVOICE_ID, session.getInvoice());
        sagaOrchestrator.advance(correlationId, "PAYMENT_SUCCESS", eventData);
        log.info("Advanced Saga {} after Stripe checkout.session.completed", correlationId);
    }

    private void advanceSagaWithFailure(PaymentIntent intent, String correlationId) {
        Map<String, Object> eventData = new HashMap<>();
        eventData.put(EVENT_RESULT, EVENT_FAILURE);
        eventData.put(FAILURE_REASON, intent.getLastPaymentError() != null ? intent.getLastPaymentError().getMessage() : "Payment failed");
        sagaOrchestrator.advance(correlationId, "PAYMENT_FAILURE", eventData);
        log.info("Advanced Saga {} after Stripe payment_intent.payment_failed", correlationId);
    }

    @Override
    public List<AdvertisementPaymentDTO> getUserPaymentHistory(String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("User", username));

        return paymentRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapPaymentToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AdvertisementPaymentDTO> getAllPaymentHistory() {
        return paymentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapPaymentToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public AdvertisementPaymentDTO refundPayment(Long paymentId, String reason) {
        AdvertisementPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Payment", paymentId));

        if (payment.getStripePaymentIntentId() == null) {
            throw new IllegalStateException("Cannot refund payment without Stripe Payment Intent");
        }

        try {
            PaymentIntent intent = stripeService.retrievePaymentIntent(payment.getStripePaymentIntentId());
            String chargeId = intent.getLatestCharge();
            com.stripe.model.Refund refund = com.stripe.model.Refund.create(
                    com.stripe.param.RefundCreateParams.builder().setCharge(chargeId).build());

            payment.setStatus(PaymentStatus.REFUNDED);
            payment.setFailureMessage(reason);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            advertisementRepository.findById(payment.getAdvertisementId()).ifPresent(ad -> {
                ad.setPaymentStatus(PaymentStatus.REFUNDED);
                ad.setStatus(AdvertisementStatus.PAUSED);
                ad.setUpdatedAt(LocalDateTime.now());
                advertisementRepository.save(ad);
            });

            return mapPaymentToDTO(payment);
        } catch (StripeException e) {
            throw new RuntimeException("Refund failed: " + e.getMessage(), e);
        }
    }

    private AdvertisementPaymentDTO mapPaymentToDTO(AdvertisementPayment payment) {
        return AdvertisementPaymentDTO.builder()
                .id(payment.getId())
                .advertisementId(payment.getAdvertisementId())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .stripeCheckoutSessionId(payment.getStripeCheckoutSessionId())
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .stripeInvoiceId(payment.getStripeInvoiceId())
                .receiptUrl(payment.getReceiptUrl())
                .failureMessage(payment.getFailureMessage())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void processPaymentSuccess(Long advertisementId, String providerTransactionId) {
        Advertisement advertisement = advertisementRepository.findById(advertisementId)
                .orElseThrow(() -> new NotFoundException("Advertisement", advertisementId));
        advertisement.setPaymentStatus(PaymentStatus.PAID);
        advertisement.setStatus(AdvertisementStatus.PENDING_APPROVAL);
        advertisement.setUpdatedAt(LocalDateTime.now());
        advertisementRepository.save(advertisement);
        if (advertisement.getCreatedByUserId() != null) {
            notificationService.createFromTemplate(NotificationTemplate.paymentSuccess(
                    advertisement.getCreatedByUserId(), "Stripe", providerTransactionId));
        }
        log.info("Advertisement {} activated after successful payment (tx: {})", advertisementId, providerTransactionId);
    }

    @Override
    @Transactional
    public void processPaymentFailure(Long advertisementId) {
        Advertisement advertisement = advertisementRepository.findById(advertisementId)
                .orElseThrow(() -> new NotFoundException("Advertisement", advertisementId));
        advertisement.setPaymentStatus(PaymentStatus.FAILED);
        advertisement.setStatus(AdvertisementStatus.PENDING_PAYMENT);
        advertisement.setUpdatedAt(LocalDateTime.now());
        advertisementRepository.save(advertisement);
        if (advertisement.getCreatedByUserId() != null) {
            notificationService.createFromTemplate(NotificationTemplate.paymentFailed(
                    advertisement.getCreatedByUserId(), "Stripe", "AD-" + advertisementId));
        }
        log.info("Advertisement {} deactivated after payment failure", advertisementId);
    }

    private void processCheckoutCompleted(Session session) {
        String checkoutSessionId = session.getId();
        AdvertisementPayment payment = paymentRepository.findByStripeCheckoutSessionId(checkoutSessionId)
                .orElseThrow(() -> new NotFoundException("Payment", checkoutSessionId));

        processPaymentSuccess(payment.getAdvertisementId(), checkoutSessionId);

        // Stripe-specific updates
        String paymentIntentId = session.getPaymentIntent();
        Advertisement advertisement = advertisementRepository.findById(payment.getAdvertisementId())
                .orElseThrow(() -> new NotFoundException("Advertisement", payment.getAdvertisementId()));
        advertisement.setStripePaymentIntentId(paymentIntentId);
        advertisementRepository.save(advertisement);

        payment.setStripePaymentIntentId(paymentIntentId);
        payment.setStripeInvoiceId(session.getInvoice());
        payment.setStatus(PaymentStatus.PAID);
        payment.setReceiptUrl(session.getPaymentIntent() != null ? "" : null);
        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepository.save(payment);
    }

    private void processPaymentFailed(PaymentIntent intent) {
        String paymentIntentId = intent.getId();
        paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .ifPresent(payment -> {
                    processPaymentFailure(payment.getAdvertisementId());

                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setFailureMessage(intent.getLastPaymentError() != null ? intent.getLastPaymentError().getMessage() : "Payment failed");
                    payment.setUpdatedAt(LocalDateTime.now());
                    paymentRepository.save(payment);
                });
    }
}
