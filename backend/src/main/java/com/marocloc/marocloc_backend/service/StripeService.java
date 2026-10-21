package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.config.StripeConfig;
import com.marocloc.marocloc_backend.model.Advertisement;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StripeService {

    private final StripeConfig stripeConfig;

    public Session createCheckoutSession(Advertisement advertisement, String successUrl, String cancelUrl) throws StripeException {
        return createCheckoutSession(advertisement, successUrl, cancelUrl, null);
    }

    public Session createCheckoutSession(Advertisement advertisement, String successUrl, String cancelUrl, String correlationId) throws StripeException {
        Stripe.apiKey = stripeConfig.getApiKey();

        SessionCreateParams.LineItem.PriceData.ProductData productData = SessionCreateParams.LineItem.PriceData.ProductData.builder()
                .setName(advertisement.getTitle())
                .setDescription(advertisement.getDescription())
                .build();

        long amountMinorUnits = advertisement.getBudget() != null
                ? advertisement.getBudget().multiply(BigDecimal.valueOf(100)).longValue()
                : 0L;

        SessionCreateParams.LineItem.PriceData priceData = SessionCreateParams.LineItem.PriceData.builder()
                .setCurrency(stripeConfig.getCurrency().toLowerCase())
                .setUnitAmount(amountMinorUnits)
                .setProductData(productData)
                .build();

        SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                .setPriceData(priceData)
                .setQuantity(1L)
                .build();

        Map<String, String> metadata = new HashMap<>();
        metadata.put("advertisementId", advertisement.getId().toString());
        metadata.put("plan", advertisement.getPlan().name());
        if (correlationId != null && !correlationId.isBlank()) {
            metadata.put("correlationId", correlationId);
        }

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .addLineItem(lineItem)
                .putAllMetadata(metadata)
                .build();

        return Session.create(params);
    }

    public Event constructEvent(String payload, String sigHeader) throws SignatureVerificationException {
        return Webhook.constructEvent(payload, sigHeader, stripeConfig.getWebhookSecret());
    }

    public PaymentIntent retrievePaymentIntent(String paymentIntentId) throws StripeException {
        Stripe.apiKey = stripeConfig.getApiKey();
        return PaymentIntent.retrieve(paymentIntentId);
    }

    public void setApiKey() {
        Stripe.apiKey = stripeConfig.getApiKey();
    }

    public StripeConfig getStripeConfig() {
        return stripeConfig;
    }
}
