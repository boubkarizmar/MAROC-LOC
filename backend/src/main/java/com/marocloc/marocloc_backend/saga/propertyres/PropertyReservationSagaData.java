package com.marocloc.marocloc_backend.saga.propertyres;

import lombok.experimental.UtilityClass;

@UtilityClass
public class PropertyReservationSagaData {

    public static final String SAGA_ID = "sagaId";
    public static final String CORRELATION_ID = "correlationId";
    public static final String PROVIDER = "provider";
    public static final String PROVIDER_CMI = "CMI";

    public static final String USER_ID = "userId";
    public static final String USER_EMAIL = "userEmail";
    public static final String USERNAME = "username";

    public static final String PROPERTY_ID = "propertyId";
    public static final String PROPERTY_RESERVATION_ID = "propertyReservationId";
    public static final String TRANSACTION_TYPE = "transactionType";

    public static final String AMOUNT = "amount";
    public static final String CURRENCY = "currency";
    public static final String LANG = "lang";
    public static final String ORDER_ID = "orderId";

    public static final String PAYMENT_TRANSACTION_ID = "paymentTransactionId";
    public static final String PAYMENT_PARAMS = "paymentParams";

    public static final String EVENT_RESULT = "eventResult";
    public static final String EVENT_SUCCESS = "SUCCESS";
    public static final String EVENT_FAILURE = "FAILURE";
    public static final String FAILURE_REASON = "failureReason";

    public static final String PREVIOUS_PROPERTY_STATUS = "previousPropertyStatus";
}
