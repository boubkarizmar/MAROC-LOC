package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyReservationTransactionType;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.saga.core.SagaContext;
import com.marocloc.marocloc_backend.saga.model.SagaInstance;
import com.marocloc.marocloc_backend.saga.model.SagaType;
import com.marocloc.marocloc_backend.saga.propertyres.PropertyReservationSagaData;
import com.marocloc.marocloc_backend.saga.core.SagaOrchestrator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyReservationService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final SagaOrchestrator sagaOrchestrator;
    private final CMIService cmiService;

    private static final BigDecimal RESERVATION_RATE = new BigDecimal("0.10");
    private static final BigDecimal MIN_RESERVATION_AMOUNT = new BigDecimal("1000");

    @Transactional
    public Map<String, Object> initiateTransaction(Long propertyId,
                                                    PropertyReservationTransactionType transactionType,
                                                    Long buyerId,
                                                    String buyerEmail,
                                                    String lang) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found: " + propertyId));
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + buyerId));

        if (buyerId.equals(property.getOwner().getId())) {
            throw new IllegalArgumentException("Buyer cannot be the property owner");
        }
        if (!property.getStatus().isAvailableForTransaction()) {
            throw new IllegalStateException("Property is not available for transaction: " + property.getStatus());
        }

        BigDecimal amount = computeAmount(property, transactionType);
        String orderId = generateOrderId(propertyId, transactionType);
        String currency = "504"; // MAD numeric code for CMI

        Map<String, Object> payload = new HashMap<>();
        payload.put(PropertyReservationSagaData.PROVIDER, PropertyReservationSagaData.PROVIDER_CMI);
        payload.put(PropertyReservationSagaData.USER_ID, buyerId);
        payload.put(PropertyReservationSagaData.USER_EMAIL, buyerEmail);
        payload.put(PropertyReservationSagaData.USERNAME, buyer.getEmail());
        payload.put(PropertyReservationSagaData.ORDER_ID, orderId);
        payload.put(PropertyReservationSagaData.AMOUNT, amount.doubleValue());
        payload.put(PropertyReservationSagaData.CURRENCY, currency);
        payload.put(PropertyReservationSagaData.LANG, lang != null ? lang : "fr");
        payload.put(PropertyReservationSagaData.PROPERTY_ID, propertyId);
        payload.put(PropertyReservationSagaData.TRANSACTION_TYPE, transactionType.name());

        SagaInstance saga = sagaOrchestrator.start(SagaType.PROPERTY_RESERVATION, orderId,
                PropertyReservationSagaData.PROVIDER_CMI, payload);

        Map<String, Object> result = new HashMap<>(saga.getPayload());
        @SuppressWarnings("unchecked")
        Map<String, Object> paymentParams = (Map<String, Object>) result.getOrDefault(
                PropertyReservationSagaData.PAYMENT_PARAMS, new HashMap<>());
        paymentParams.put("sagaId", saga.getId());
        paymentParams.put("orderId", orderId);
        paymentParams.put("amount", amount.doubleValue());
        paymentParams.put("transactionType", transactionType.name());
        return paymentParams;
    }

    public BigDecimal computeAmount(Property property, PropertyReservationTransactionType transactionType) {
        BigDecimal basePrice = property.getFinalPrice() != null
                ? property.getFinalPrice()
                : property.getPrice();
        if (transactionType == PropertyReservationTransactionType.PURCHASE) {
            return basePrice.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal reservationAmount = basePrice.multiply(RESERVATION_RATE);
        if (reservationAmount.compareTo(MIN_RESERVATION_AMOUNT) < 0) {
            reservationAmount = MIN_RESERVATION_AMOUNT;
        }
        return reservationAmount.setScale(2, RoundingMode.HALF_UP);
    }

    private String generateOrderId(Long propertyId, PropertyReservationTransactionType transactionType) {
        return "PROP-" + transactionType.name() + "-" + propertyId + "-" + System.currentTimeMillis();
    }

    @Transactional(readOnly = true)
    public boolean canTransact(Long propertyId, Long buyerId) {
        Property property = propertyRepository.findById(propertyId).orElse(null);
        if (property == null) return false;
        return !buyerId.equals(property.getOwner().getId())
                && property.getStatus().isAvailableForTransaction();
    }
}
