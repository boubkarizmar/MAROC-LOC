package com.marocloc.marocloc_backend.saga.paymentad;

import lombok.experimental.UtilityClass;

@UtilityClass
public class PaymentAdvertisementSagaData {

    public static final String SAGA_ID = "sagaId";
    public static final String CORRELATION_ID = "correlationId";
    public static final String PROVIDER = "provider";
    public static final String PROVIDER_CMI = "CMI";
    public static final String PROVIDER_STRIPE = "STRIPE";

    public static final String USER_ID = "userId";
    public static final String USER_EMAIL = "userEmail";
    public static final String USERNAME = "username";

    public static final String ADVERTISEMENT_ID = "advertisementId";
    public static final String ADVERTISEMENT_REQUEST = "advertisementRequest";
    public static final String PROPERTY_IDS = "propertyIds";

    public static final String PLAN = "plan";
    public static final String AMOUNT = "amount";
    public static final String CURRENCY = "currency";
    public static final String LANG = "lang";
    public static final String ORDER_ID = "orderId";

    public static final String SUCCESS_URL = "successUrl";
    public static final String CANCEL_URL = "cancelUrl";

    public static final String PAYMENT_TRANSACTION_ID = "paymentTransactionId";
    public static final String CHECKOUT_SESSION_ID = "checkoutSessionId";
    public static final String CHECKOUT_URL = "checkoutUrl";
    public static final String PAYMENT_PARAMS = "paymentParams";

    public static final String EVENT_RESULT = "eventResult";
    public static final String EVENT_SUCCESS = "SUCCESS";
    public static final String EVENT_FAILURE = "FAILURE";

    public static final String STRIPE_PAYMENT_INTENT_ID = "stripePaymentIntentId";
    public static final String STRIPE_INVOICE_ID = "stripeInvoiceId";

    public static final String FAILURE_REASON = "failureReason";
}
