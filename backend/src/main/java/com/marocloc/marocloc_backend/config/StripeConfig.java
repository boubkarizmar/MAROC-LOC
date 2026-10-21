package com.marocloc.marocloc_backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
public class StripeConfig {

    @Value("${stripe.api.key}")
    private String apiKey;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @Value("${stripe.currency:MAD}")
    private String currency;

    @Value("${stripe.checkout.success-url:http://localhost:3000/payment-success}")
    private String successUrl;

    @Value("${stripe.checkout.cancel-url:http://localhost:3000/payment-cancel}")
    private String cancelUrl;
}
