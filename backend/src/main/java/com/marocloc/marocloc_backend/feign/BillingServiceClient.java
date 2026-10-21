package com.marocloc.marocloc_backend.feign;

import com.marocloc.marocloc_backend.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;
import java.util.Map;

@FeignClient(name = "billing-service", fallback = BillingServiceClientFallback.class)
public interface BillingServiceClient {

    @GetMapping("/api/v1/subscription/usage")
    ApiResponse<Map<String, Object>> getFeatureUsage(@RequestParam("userId") Long userId);

    @PostMapping("/api/v1/payments/cmi/initiate")
    ApiResponse<Map<String, Object>> initiatePayment(@RequestParam("orderId") String orderId,
                                                       @RequestParam("amount") BigDecimal amount,
                                                       @RequestParam("email") String email);

    @GetMapping("/api/v1/invoices/user/{userId}")
    ApiResponse<Map<String, Object>> getUserInvoices(@PathVariable("userId") Long userId);
}
