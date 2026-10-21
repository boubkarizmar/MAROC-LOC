package com.marocloc.marocloc_backend.saga.propertyres;

import lombok.experimental.UtilityClass;

@UtilityClass
public class PropertyReservationSagaStep {

    public static final String RESERVE_PROPERTY = "RESERVE_PROPERTY";
    public static final String INITIATE_PAYMENT = "INITIATE_PAYMENT";
    public static final String WAIT_PAYMENT_RESULT = "WAIT_PAYMENT_RESULT";
    public static final String CONFIRM_PAYMENT = "CONFIRM_PAYMENT";
    public static final String ACTIVATE_PROPERTY = "ACTIVATE_PROPERTY";
}
