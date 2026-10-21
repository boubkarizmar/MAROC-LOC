package com.marocloc.marocloc_backend.feign;

import com.marocloc.marocloc_backend.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Component
public class BillingServiceClientFallback implements BillingServiceClient {

    @Override
    public ApiResponse<Map<String, Object>> getFeatureUsage(Long userId) {
        log.warn("Billing service fallback triggered for user {}", userId);
        return ApiResponse.success(Map.of("tier", "FREE"), "Fallback: FREE tier");
    }

    @Override
    public ApiResponse<Map<String, Object>> initiatePayment(String orderId, BigDecimal amount, String email) {
        log.warn("Billing service fallback triggered for payment");
        return ApiResponse.failure("Payment service unavailable", "BILLING_DOWN");
    }

    @Override
    public ApiResponse<Map<String, Object>> getUserInvoices(Long userId) {
        log.warn("Billing service fallback triggered for invoices");
        return ApiResponse.success(Map.of("invoices", java.util.List.of()), "Fallback: empty invoices");
    }
}
