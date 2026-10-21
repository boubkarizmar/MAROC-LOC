package com.marocloc.marocloc_backend.saga.paymentad;

import lombok.experimental.UtilityClass;

@UtilityClass
public class PaymentAdvertisementSagaStep {

    public static final String RESERVE_ADVERTISEMENT = "RESERVE_ADVERTISEMENT";
    public static final String INITIATE_PAYMENT = "INITIATE_PAYMENT";
    public static final String WAIT_PAYMENT_RESULT = "WAIT_PAYMENT_RESULT";
    public static final String CONFIRM_PAYMENT = "CONFIRM_PAYMENT";
    public static final String ACTIVATE_ADVERTISEMENT = "ACTIVATE_ADVERTISEMENT";
}
