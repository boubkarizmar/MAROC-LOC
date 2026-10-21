package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.dto.CMIPaymentRequest;
import com.marocloc.marocloc_backend.model.PaymentStatus;
import com.marocloc.marocloc_backend.model.PaymentTransaction;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import com.marocloc.marocloc_backend.repository.PaymentTransactionRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.service.CMIService;
import com.marocloc.marocloc_backend.saga.core.SagaOrchestrator;
import com.marocloc.marocloc_backend.saga.model.SagaInstance;
import com.marocloc.marocloc_backend.saga.model.SagaStatus;
import com.marocloc.marocloc_backend.saga.model.SagaType;
import com.marocloc.marocloc_backend.saga.propertyres.PropertyReservationSagaData;
import com.marocloc.marocloc_backend.saga.repository.SagaInstanceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static com.marocloc.marocloc_backend.saga.paymentad.PaymentAdvertisementSagaData.*;

@RestController
@RequestMapping(ApiRoutes.PAYMENTS)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "CMI Payment", description = "Moroccan CMI payment gateway integration with Saga orchestration")
public class CMIPaymentController {

    private final CMIService cmiService;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;
    private final SagaOrchestrator sagaOrchestrator;
    private final SagaInstanceRepository sagaInstanceRepository;
    private final NotificationService notificationService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @PostMapping("/cmi/initiate")
    @PreAuthorize("hasAnyRole('LOCATAIRE', 'PROPRIETAIRE', 'ADMIN')")
    @Operation(summary = "Initiate CMI payment", description = "Starts a Saga, reserves the advertisement, builds signed CMI parameters and records a PENDING transaction")
    public ResponseEntity<ApiResponse<Map<String, Object>>> initiatePayment(
            @Valid @RequestBody CMIPaymentRequest request,
            Authentication authentication
    ) {
        Long userId = extractUserId(authentication);
        String orderId = request.getOrderId();

        Optional<SagaInstance> existingSaga = sagaInstanceRepository.findByCorrelationId(orderId);
        if (existingSaga.isPresent()) {
            log.info("CMI payment re-initiated for existing order: {}", orderId);
            Map<String, String> cmiParams = cmiService.buildPaymentRequest(
                    orderId, request.getAmount(), request.getCurrency(), request.getLang(), request.getEmail());
            Map<String, Object> data = new HashMap<>(cmiParams);
            data.put("sagaId", existingSaga.get().getId());
            return ResponseEntity.ok(ApiResponse.success(data));
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put(PROVIDER, PROVIDER_CMI);
        payload.put(USER_ID, userId);
        payload.put(USER_EMAIL, request.getEmail());
        payload.put(USERNAME, authentication != null ? authentication.getName() : null);
        payload.put(ORDER_ID, orderId);
        payload.put(AMOUNT, request.getAmount());
        payload.put(CURRENCY, request.getCurrency());
        payload.put(LANG, request.getLang());
        if (request.getAdvertisementId() != null) {
            payload.put(ADVERTISEMENT_ID, request.getAdvertisementId());
        }

        SagaType sagaType;
        if (request.getPropertyId() != null) {
            payload.put(PropertyReservationSagaData.PROPERTY_ID, request.getPropertyId());
            payload.put(PropertyReservationSagaData.TRANSACTION_TYPE,
                    request.getTransactionType() != null ? request.getTransactionType() : "RESERVATION");
            sagaType = SagaType.PROPERTY_RESERVATION;
        } else {
            sagaType = SagaType.PAYMENT_ADVERTISEMENT;
        }

        SagaInstance saga = sagaOrchestrator.start(sagaType, orderId, PROVIDER_CMI, payload);

        Map<String, Object> result = saga.getPayload();
        @SuppressWarnings("unchecked")
        Map<String, Object> paymentParams = (Map<String, Object>) result.getOrDefault(PAYMENT_PARAMS, new HashMap<>());
        paymentParams.put("sagaId", saga.getId());

        log.info("CMI Saga {} started for order: {}", saga.getId(), orderId);
        return ResponseEntity.ok(ApiResponse.success(paymentParams));
    }

    @PostMapping("/cmi/callback/success")
    @Operation(summary = "CMI success callback", description = "Advances the Saga after successful CMI payment and redirects the browser to the frontend callback page")
    public ResponseEntity<Void> handleSuccessCallback(
            @RequestParam Map<String, String> params
    ) {
        String orderId = params.get("oid");
        log.info("CMI success callback received for order: {}", orderId);

        if (!cmiService.verifyCallback(new HashMap<>(params))) {
            log.error("Invalid CMI success callback signature for order: {}", orderId);
            return redirectToFrontend("fail", orderId, "invalid_signature");
        }

        Optional<SagaInstance> sagaOpt = sagaInstanceRepository.findByCorrelationId(orderId);
        if (sagaOpt.isPresent()) {
            SagaInstance saga = sagaOpt.get();
            if (saga.getStatus() == SagaStatus.COMPLETED) {
                return redirectToFrontend("success", orderId, null);
            }
            if (saga.getStatus() == SagaStatus.FAILED || saga.getStatus() == SagaStatus.COMPENSATED) {
                return redirectToFrontend("fail", orderId, "already_failed");
            }
        }

        try {
            Map<String, Object> eventData = new HashMap<>();
            eventData.put(EVENT_RESULT, EVENT_SUCCESS);
            eventData.put("amount", params.get("amount"));
            sagaOrchestrator.advance(orderId, "PAYMENT_SUCCESS", eventData);
            log.info("Saga advanced to success for order: {}", orderId);
        } catch (Exception e) {
            log.error("Failed to advance Saga for order: {}", orderId, e);
            return redirectToFrontend("fail", orderId, "saga_error");
        }

        notifyPayment(orderId, true, null);
        return redirectToFrontend("success", orderId, null);
    }

    @PostMapping("/cmi/callback/fail")
    @Operation(summary = "CMI failure callback", description = "Advances the Saga after failed CMI payment and redirects the browser to the frontend callback page")
    public ResponseEntity<Void> handleFailCallback(
            @RequestParam Map<String, String> params
    ) {
        String orderId = params.get("oid");
        log.warn("CMI failure callback received for order: {}", orderId);

        if (!cmiService.verifyCallback(new HashMap<>(params))) {
            log.error("Invalid CMI failure callback signature for order: {}", orderId);
            return redirectToFrontend("fail", orderId, "invalid_signature");
        }

        Optional<SagaInstance> sagaOpt = sagaInstanceRepository.findByCorrelationId(orderId);
        if (sagaOpt.isPresent()) {
            SagaStatus status = sagaOpt.get().getStatus();
            if (status == SagaStatus.FAILED || status == SagaStatus.COMPENSATED) {
                return redirectToFrontend("fail", orderId, params.get("ErrorCode"));
            }
            if (status == SagaStatus.COMPLETED) {
                return redirectToFrontend("success", orderId, null);
            }
        }

        String errorCode = params.get("ErrorCode");
        String errorMessage = params.get("ErrorMessage");

        try {
            Map<String, Object> eventData = new HashMap<>();
            eventData.put(EVENT_RESULT, EVENT_FAILURE);
            eventData.put(FAILURE_REASON, errorCode + " - " + errorMessage);
            sagaOrchestrator.advance(orderId, "PAYMENT_FAILURE", eventData);
            log.info("Saga advanced to failure/compensated for order: {}", orderId);
        } catch (Exception e) {
            log.error("Failed to advance Saga for order: {}", orderId, e);
            return redirectToFrontend("fail", orderId, "saga_error");
        }

        notifyPayment(orderId, false, errorCode);
        return redirectToFrontend("fail", orderId, errorCode);
    }

    private void notifyPayment(String orderId, boolean success, String errorCode) {
        try {
            paymentTransactionRepository.findFirstByProviderTransactionIdOrderByCreatedAtDesc(orderId)
                    .ifPresent(tx -> {
                        if (tx.getAdvertisementId() != null && tx.getUserId() != null) {
                            if (success) {
                                notificationService.createFromTemplate(NotificationTemplate.paymentSuccess(
                                        tx.getUserId(), "CMI", orderId));
                            } else {
                                notificationService.createFromTemplate(NotificationTemplate.paymentFailed(
                                        tx.getUserId(), "CMI", orderId));
                            }
                        }
                    });
        } catch (Exception e) {
            log.warn("Failed to emit payment notification for order {}", orderId, e);
        }
    }

    private ResponseEntity<Void> redirectToFrontend(String status, String orderId, String errorCode) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/payment/cmi/callback")
                .queryParam("status", status)
                .queryParam("oid", orderId != null ? orderId : "");
        if (errorCode != null && !errorCode.isBlank()) {
            builder.queryParam("error", errorCode);
        }
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(builder.build().toUri())
                .build();
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('LOCATAIRE', 'PROPRIETAIRE', 'ADMIN')")
    @Operation(summary = "Get payment status", description = "Returns the status of a payment transaction by orderId")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStatus(
            @RequestParam String orderId
    ) {
        Optional<PaymentTransaction> txOpt = paymentTransactionRepository.findFirstByProviderTransactionIdOrderByCreatedAtDesc(orderId);
        if (txOpt.isPresent()) {
            PaymentTransaction tx = txOpt.get();
            Map<String, Object> data = new HashMap<>();
            data.put("orderId", tx.getProviderTransactionId());
            data.put("status", tx.getStatus().name());
            data.put("amount", tx.getAmount());
            data.put("currency", tx.getCurrency());
            data.put("createdAt", tx.getCreatedAt());
            return ResponseEntity.ok(ApiResponse.success(data));
        }

        Optional<SagaInstance> sagaOpt = sagaInstanceRepository.findByCorrelationId(orderId);
        if (sagaOpt.isPresent()) {
            SagaInstance saga = sagaOpt.get();
            Map<String, Object> data = new HashMap<>();
            data.put("orderId", orderId);
            data.put("status", saga.getStatus().name());
            data.put("sagaId", saga.getId());
            return ResponseEntity.ok(ApiResponse.success(data));
        }

        Map<String, Object> data = new HashMap<>();
        data.put("orderId", orderId);
        data.put("status", "UNKNOWN");
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    private Long extractUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return 0L;
        }
        return userRepository.findByEmail(authentication.getName())
                .map(user -> user.getId())
                .orElse(0L);
    }
}
