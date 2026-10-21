package com.marocloc.marocloc_backend.fraud.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.fraud.dto.FraudCheckRequest;
import com.marocloc.marocloc_backend.fraud.dto.FraudCheckResponse;
import com.marocloc.marocloc_backend.fraud.service.FraudDetectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping(ApiRoutes.FRAUD)
@RequiredArgsConstructor
public class FraudDetectionController {

    private final FraudDetectionService fraudDetectionService;

    @PostMapping("/check")
    @PreAuthorize("hasAnyRole('ADMIN','PROPRIETAIRE')")
    public ResponseEntity<ApiResponse<FraudCheckResponse>> checkProperty(
            @Valid @RequestBody FraudCheckRequest request) {
        log.info("Fraud check requested for property {}", request.getPropertyId());
        FraudCheckResponse result = fraudDetectionService.analyze(request);
        return ResponseEntity.ok(ApiResponse.success(result, "Analyse de fraude terminée"));
    }

    @PostMapping("/check/{propertyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FraudCheckResponse>> quickCheck(
            @PathVariable Long propertyId) {
        // Admin quick-check placeholder - would fetch property from DB
        FraudCheckRequest request = FraudCheckRequest.builder()
                .propertyId(propertyId)
                .userId(0L)
                .build();
        FraudCheckResponse result = fraudDetectionService.analyze(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
