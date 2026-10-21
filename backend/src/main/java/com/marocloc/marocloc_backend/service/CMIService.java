package com.marocloc.marocloc_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * CMI (Centre Monétique Interbancaire) Payment Service for Morocco.
 * Implements HMAC-SHA256 signing for CMI payment gateway integration.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CMIService {

    @Value("${cmi.merchant.id:}")
    private String merchantId;

    @Value("${cmi.store.key:}")
    private String storeKey;

    @Value("${cmi.api.key:}")
    private String apiKey;

    @Value("${cmi.gateway.url:https://payment.cmi.co.ma/fim/est3Dgate}")
    private String gatewayUrl;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.backend-url:http://localhost:8080/api}")
    private String backendUrl;

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final DateTimeFormatter CMI_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Build CMI payment form parameters with HMAC signature.
     */
    public Map<String, String> buildPaymentRequest(
            String orderId,
            Double amount,
            String currency,
            String lang,
            String email
    ) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("clientid", merchantId);
        params.put("oid", orderId);
        params.put("amount", String.format(Locale.US, "%.2f", amount));
        params.put("currency", currency != null ? currency : "504"); // MAD = 504
        params.put("okUrl", backendUrl + "/v1/payments/cmi/callback/success");
        params.put("failUrl", backendUrl + "/v1/payments/cmi/callback/fail");
        params.put("shopUrl", frontendUrl);
        params.put("lang", lang != null ? lang : "fr");
        params.put("email", email);
        params.put("BillToEmail", email);
        params.put("rnd", generateRandomValue());
        params.put("storetype", "3d_pay_hosting");
        params.put("hashAlgorithm", "ver3");
        params.put("encoding", "UTF-8");
        params.put("txntype", "auth");
        params.put("txnSubType", "C");

        String hash = generateHash(params, storeKey);
        params.put("hash", hash);

        log.info("CMI payment request built for order: {}", orderId);
        return params;
    }

    /**
     * Verify CMI callback response hash.
     */
    public boolean verifyCallback(Map<String, String> params) {
        try {
            String receivedHash = params.get("hash");
            if (receivedHash == null || receivedHash.isBlank()) {
                log.warn("CMI callback missing hash");
                return false;
            }

            String computedHash = generateHash(params, storeKey);
            boolean valid = MessageDigest.isEqual(
                    receivedHash.getBytes(StandardCharsets.UTF_8),
                    computedHash.getBytes(StandardCharsets.UTF_8)
            );

            if (!valid) {
                log.error("CMI callback hash mismatch");
            }
            return valid;
        } catch (Exception e) {
            log.error("Failed to verify CMI callback", e);
            return false;
        }
    }

    /**
     * Generate CMI hash according to their specification.
     * Concatenates storeKey + sorted parameter values, then HMAC-SHA256.
     */
    private String generateHash(Map<String, String> params, String key) {
        try {
            // Filter out empty values and excluded keys, without mutating the input map
            Map<String, String> filtered = params.entrySet().stream()
                    .filter(e -> e.getValue() != null && !e.getValue().isBlank())
                    .filter(e -> !e.getKey().equalsIgnoreCase("hash"))
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            Map.Entry::getValue,
                            (a, b) -> a,
                            LinkedHashMap::new
                    ));

            // Sort by key alphabetically
            List<String> sortedKeys = new ArrayList<>(filtered.keySet());
            Collections.sort(sortedKeys);

            StringBuilder sb = new StringBuilder();
            for (String k : sortedKeys) {
                sb.append(filtered.get(k));
            }

            String dataToHash = key + sb.toString();
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(secretKey);
            byte[] hashBytes = mac.doFinal(dataToHash.getBytes(StandardCharsets.UTF_8));

            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (Exception e) {
            log.error("Failed to generate CMI hash", e);
            throw new RuntimeException("CMI hash generation failed", e);
        }
    }

    private String generateRandomValue() {
        return LocalDateTime.now().format(CMI_DATE_FORMAT) + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    public String getGatewayUrl() {
        return gatewayUrl;
    }
}
