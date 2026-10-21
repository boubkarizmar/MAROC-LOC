package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.*;
import com.marocloc.marocloc_backend.model.*;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.service.AdvertisementPaymentService;
import com.marocloc.marocloc_backend.service.AdvertisementService;
import com.marocloc.marocloc_backend.service.StripeService;
import com.marocloc.marocloc_backend.saga.core.SagaOrchestrator;
import com.marocloc.marocloc_backend.saga.model.SagaInstance;
import com.marocloc.marocloc_backend.saga.model.SagaType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.marocloc.marocloc_backend.saga.paymentad.PaymentAdvertisementSagaData.*;

@RestController
@RequestMapping(ApiRoutes.ADS)
@RequiredArgsConstructor
//@CrossOrigin(origins = "*")
public class AdvertisementController {

    private final AdvertisementService advertisementService;
    private final AdvertisementPaymentService advertisementPaymentService;
    private final SagaOrchestrator sagaOrchestrator;
    private final UserRepository userRepository;
    private final StripeService stripeService;

    @GetMapping
    public ResponseEntity<List<AdvertisementDTO>> getActiveAds() {
        return ResponseEntity.ok(advertisementService.getActiveAds());
    }

    @GetMapping("/active")
    public ResponseEntity<List<AdvertisementDTO>> getActiveAdsByStatus() {
        return ResponseEntity.ok(advertisementService.getActiveAdsByStatus());
    }

    @GetMapping("/plans")
    public ResponseEntity<List<AdvertisementPlanInfoDTO>> getPlans() {
        return ResponseEntity.ok(advertisementPaymentService.getAvailablePlans());
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<StripeCheckoutSessionResponse> createCheckoutSession(
            @Valid @RequestBody AdvertisementPlanCheckoutRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + userDetails.getUsername()));

        AdvertisementPlan plan = request.getPlan();
        if (request.getPropertyIds().size() > plan.getMaxProperties()) {
            throw new IllegalArgumentException("The selected plan does not allow more than " + plan.getMaxProperties() + " properties.");
        }

        LocalDate today = LocalDate.now();
        int durationDays = request.getDurationMonths() != null ? request.getDurationMonths() * 30 : plan.getDurationDays();
        LocalDate endDate = today.plusDays(durationDays);

        AdvertisementRequest adRequest = AdvertisementRequest.builder()
                .title(plan.getDisplayName())
                .description(plan.getDescription())
                .type(plan == AdvertisementPlan.PREMIUM_ADS ? AdvertisementType.BANNER : AdvertisementType.PROPERTY)
                .plan(plan)
                .propertyId(request.getPropertyIds().get(0))
                .propertyIds(request.getPropertyIds())
                .isActive(false)
                .status(AdvertisementStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .startDate(today)
                .endDate(endDate)
                .priority(plan == AdvertisementPlan.PREMIUM_ADS ? 100 : plan == AdvertisementPlan.BOOST_PRO ? 50 : 10)
                .budget(BigDecimal.valueOf(plan.getAmountMinorUnits()).divide(BigDecimal.valueOf(100)))
                .currency("MAD")
                .targetAudience(request.getTargetAudience())
                .build();

        String correlationId = "STRIPE-" + UUID.randomUUID();

        Map<String, Object> payload = new HashMap<>();
        payload.put(PROVIDER, PROVIDER_STRIPE);
        payload.put(USER_ID, user.getId());
        payload.put(USER_EMAIL, user.getEmail());
        payload.put(ADVERTISEMENT_REQUEST, adRequest);
        payload.put(PLAN, plan.name());
        payload.put(AMOUNT, (double) plan.getAmountMinorUnits());
        payload.put(CURRENCY, "MAD");
        payload.put(SUCCESS_URL, request.getSuccessUrl() != null ? request.getSuccessUrl() : stripeService.getStripeConfig().getSuccessUrl());
        payload.put(CANCEL_URL, request.getCancelUrl() != null ? request.getCancelUrl() : stripeService.getStripeConfig().getCancelUrl());
        payload.put(CORRELATION_ID, correlationId);
        payload.put(ORDER_ID, correlationId);

        SagaInstance saga = sagaOrchestrator.start(SagaType.PAYMENT_ADVERTISEMENT, correlationId, PROVIDER_STRIPE, payload);

        Map<String, Object> result = saga.getPayload();
        Long advertisementId = saga.getPayload() != null ? (Long) saga.getPayload().get(ADVERTISEMENT_ID) : null;

        return ResponseEntity.status(HttpStatus.CREATED).body(StripeCheckoutSessionResponse.builder()
                .sessionId((String) result.get(CHECKOUT_SESSION_ID))
                .checkoutUrl((String) result.get(CHECKOUT_URL))
                .sagaId(saga.getId())
                .advertisementId(advertisementId)
                .build());
    }

    @PostMapping("/stripe/webhook")
    public ResponseEntity<Void> handleStripeWebhook(
            @RequestHeader("Stripe-Signature") String signature,
            @RequestBody String payload) {
        advertisementPaymentService.handleStripeWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','ADMIN')")
    public ResponseEntity<List<AdvertisementPaymentDTO>> getPaymentHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return ResponseEntity.ok(advertisementPaymentService.getAllPaymentHistory());
        }
        return ResponseEntity.ok(advertisementPaymentService.getUserPaymentHistory(userDetails.getUsername()));
    }

    @PostMapping("/payments/{id}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdvertisementPaymentDTO> refundPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentRefundRequest request) {
        return ResponseEntity.ok(advertisementPaymentService.refundPayment(id, request.getReason()));
    }

    @PostMapping("/preview")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','ADMIN')")
    public ResponseEntity<AdvertisementDTO> previewAd(
            @Valid @RequestBody AdvertisementRequest request) {
        return ResponseEntity.ok(advertisementService.previewAd(request));
    }

    @GetMapping("/user")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','ADMIN')")
    public ResponseEntity<List<AdvertisementDTO>> getCurrentUserAds(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(advertisementService.getUserAds(userDetails.getUsername()));
    }

    @PostMapping("/requests")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<AdvertisementDTO> submitAdRequest(
            @Valid @RequestBody AdvertisementRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        AdvertisementDTO created = advertisementService.submitAdRequest(request, userDetails.getUsername());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdvertisementDTO>> getPendingAdRequests() {
        return ResponseEntity.ok(advertisementService.getPendingRequests());
    }

    @PostMapping("/pending/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdvertisementDTO> approveAdRequest(
            @PathVariable Long id,
            @Valid @RequestBody AdvertisementReviewRequest request) {
        return ResponseEntity.ok(advertisementService.approveAdRequest(id, request.getComment()));
    }

    @PostMapping("/pending/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdvertisementDTO> rejectAdRequest(
            @PathVariable Long id,
            @Valid @RequestBody AdvertisementReviewRequest request) {
        return ResponseEntity.ok(advertisementService.rejectAdRequest(id, request.getComment()));
    }

    @GetMapping("/{id}/analytics")
    @PreAuthorize("hasAnyRole('ADMIN','PROPRIETAIRE')")
    public ResponseEntity<AdvertisementAnalyticsDTO> getAdAnalytics(
            @PathVariable Long id) {
        return ResponseEntity.ok(advertisementService.getAdAnalytics(id));
    }

    @GetMapping("/rotation")
    public ResponseEntity<List<AdvertisementDTO>> getRotatedAds(
            @RequestParam(required = false) String slot,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(advertisementService.getRotatedAds(slot, limit));
    }

    @PutMapping("/{id}/metrics")
    @PreAuthorize("hasAnyRole('ADMIN','PROPRIETAIRE')")
    public ResponseEntity<AdvertisementDTO> updateAdMetrics(
            @PathVariable Long id,
            @Valid @RequestBody AdvertisementMetricsRequest request) {
        request.setAdvertisementId(id);
        return ResponseEntity.ok(advertisementService.updateAdMetrics(request));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdvertisementDTO> createAd(@Valid @RequestBody AdvertisementRequest request) {
        AdvertisementDTO created = advertisementService.createAd(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdvertisementDTO> updateAd(
            @PathVariable Long id,
            @Valid @RequestBody AdvertisementRequest request) {
        return ResponseEntity.ok(advertisementService.updateAd(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAd(@PathVariable Long id) {
        advertisementService.deleteAd(id);
        return ResponseEntity.noContent().build();
    }
}
