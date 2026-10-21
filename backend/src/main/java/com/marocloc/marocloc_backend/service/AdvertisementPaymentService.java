package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.AdvertisementPaymentDTO;
import com.marocloc.marocloc_backend.dto.AdvertisementPlanCheckoutRequest;
import com.marocloc.marocloc_backend.dto.AdvertisementPlanInfoDTO;
import com.marocloc.marocloc_backend.dto.StripeCheckoutSessionResponse;

import java.util.List;

public interface AdvertisementPaymentService {

    List<AdvertisementPlanInfoDTO> getAvailablePlans();

    StripeCheckoutSessionResponse createCheckoutSession(AdvertisementPlanCheckoutRequest request, String username);

    void handleStripeWebhook(String payload, String signature);

    List<AdvertisementPaymentDTO> getUserPaymentHistory(String username);

    List<AdvertisementPaymentDTO> getAllPaymentHistory();

    AdvertisementPaymentDTO refundPayment(Long paymentId, String reason);

    void processPaymentSuccess(Long advertisementId, String providerTransactionId);

    void processPaymentFailure(Long advertisementId);
}
