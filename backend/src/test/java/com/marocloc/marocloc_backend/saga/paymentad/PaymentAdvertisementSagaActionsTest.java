package com.marocloc.marocloc_backend.saga.paymentad;

import com.marocloc.marocloc_backend.dto.AdvertisementDTO;
import com.marocloc.marocloc_backend.dto.AdvertisementRequest;
import com.marocloc.marocloc_backend.model.*;
import com.marocloc.marocloc_backend.repository.AdvertisementPaymentRepository;
import com.marocloc.marocloc_backend.repository.AdvertisementRepository;
import com.marocloc.marocloc_backend.repository.PaymentTransactionRepository;
import com.marocloc.marocloc_backend.service.AdvertisementService;
import com.marocloc.marocloc_backend.service.CMIService;
import com.marocloc.marocloc_backend.service.StripeService;
import com.marocloc.marocloc_backend.saga.core.SagaContext;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static com.marocloc.marocloc_backend.saga.paymentad.PaymentAdvertisementSagaData.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentAdvertisementSagaActionsTest {

    @Mock private AdvertisementService advertisementService;
    @Mock private AdvertisementRepository advertisementRepository;
    @Mock private AdvertisementPaymentRepository advertisementPaymentRepository;
    @Mock private PaymentTransactionRepository paymentTransactionRepository;
    @Mock private CMIService cmiService;
    @Mock private StripeService stripeService;

    private PaymentAdvertisementSagaActions actions;

    @BeforeEach
    void setUp() {
        actions = new PaymentAdvertisementSagaActions(
                advertisementService,
                advertisementRepository,
                advertisementPaymentRepository,
                paymentTransactionRepository,
                cmiService,
                stripeService
        );
    }

    @Test
    void reserveAdvertisement_shouldSetExistingAdToPendingPayment() {
        Advertisement ad = new Advertisement();
        ad.setId(5L);
        ad.setStatus(AdvertisementStatus.DRAFT);
        ad.setPaymentStatus(PaymentStatus.PENDING);
        when(advertisementRepository.findById(5L)).thenReturn(Optional.of(ad));

        SagaContext ctx = new SagaContext();
        ctx.set(ADVERTISEMENT_ID, 5L);

        actions.reserveAdvertisement(ctx);

        assertEquals(AdvertisementStatus.PENDING_PAYMENT, ad.getStatus());
        assertEquals(PaymentStatus.PENDING, ad.getPaymentStatus());
        assertFalse(ad.getIsActive());
        verify(advertisementRepository).save(ad);
        assertEquals(AdvertisementStatus.DRAFT.name(), ctx.get("previousAdStatus"));
    }

    @Test
    void reserveAdvertisement_shouldCreateNewAdAndSetCreatedBy() {
        AdvertisementRequest request = AdvertisementRequest.builder()
                .title("Test Ad")
                .description("Desc")
                .type(AdvertisementType.PROPERTY)
                .plan(AdvertisementPlan.BOOST_PRO)
                .propertyIds(List.of(1L))
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .budget(BigDecimal.TEN)
                .build();

        when(advertisementService.createAd(any())).thenReturn(
                AdvertisementDTO.builder().id(7L).title("Test Ad").build()
        );

        Advertisement savedAd = new Advertisement();
        savedAd.setId(7L);
        when(advertisementRepository.findById(7L)).thenReturn(Optional.of(savedAd));

        SagaContext ctx = new SagaContext();
        ctx.set(ADVERTISEMENT_REQUEST, request);
        ctx.set(USER_ID, 42L);
        ctx.set(USER_EMAIL, "owner@example.com");

        actions.reserveAdvertisement(ctx);

        assertEquals(7L, ctx.getLong(ADVERTISEMENT_ID));
        assertEquals(42L, savedAd.getCreatedByUserId());
        assertEquals("owner@example.com", savedAd.getCreatedByUserEmail());
        assertEquals(AdvertisementStatus.PENDING_PAYMENT, request.getStatus());
    }

    @Test
    void compensateReserveAdvertisement_shouldRestorePreviousStatus() {
        Advertisement ad = new Advertisement();
        ad.setId(5L);
        ad.setStatus(AdvertisementStatus.PENDING_PAYMENT);
        ad.setPaymentStatus(PaymentStatus.PENDING);
        when(advertisementRepository.findById(5L)).thenReturn(Optional.of(ad));

        SagaContext ctx = new SagaContext();
        ctx.set(ADVERTISEMENT_ID, 5L);
        ctx.set("previousAdStatus", AdvertisementStatus.DRAFT.name());

        actions.compensateReserveAdvertisement(ctx);

        assertEquals(AdvertisementStatus.DRAFT, ad.getStatus());
        assertEquals(PaymentStatus.FAILED, ad.getPaymentStatus());
        verify(advertisementRepository).save(ad);
    }

    @Test
    void initiateStripePayment_shouldCreatePaymentRecordAndCheckoutSession() throws StripeException {
        Advertisement ad = new Advertisement();
        ad.setId(10L);
        ad.setTitle("Ad");
        ad.setPlan(AdvertisementPlan.BOOST_PRO);
        ad.setBudget(BigDecimal.valueOf(50.00));
        when(advertisementRepository.findById(10L)).thenReturn(Optional.of(ad));

        when(advertisementPaymentRepository.save(any())).thenAnswer(invocation -> {
            AdvertisementPayment p = invocation.getArgument(0);
            p.setId(100L);
            return p;
        });

        Session session = mock(Session.class);
        when(session.getId()).thenReturn("cs_test_123");
        when(session.getUrl()).thenReturn("https://checkout.stripe.com/test");
        when(stripeService.createCheckoutSession(any(), any(), any(), any()))
                .thenReturn(session);

        SagaContext ctx = new SagaContext();
        ctx.set(PROVIDER, PROVIDER_STRIPE);
        ctx.set(ADVERTISEMENT_ID, 10L);
        ctx.set(USER_ID, 7L);
        ctx.set(AMOUNT, 5000.0);
        ctx.set(CURRENCY, "MAD");
        ctx.set(SUCCESS_URL, "https://success");
        ctx.set(CANCEL_URL, "https://cancel");
        ctx.set(CORRELATION_ID, "STRIPE-xyz");

        actions.initiatePayment(ctx);

        assertEquals(100L, ctx.getLong(PAYMENT_TRANSACTION_ID));
        assertEquals("cs_test_123", ctx.get(CHECKOUT_SESSION_ID));
        assertEquals("https://checkout.stripe.com/test", ctx.get(CHECKOUT_URL));

        ArgumentCaptor<AdvertisementPayment> paymentCaptor = ArgumentCaptor.forClass(AdvertisementPayment.class);
        verify(advertisementPaymentRepository, times(2)).save(paymentCaptor.capture());
        AdvertisementPayment savedPayment = paymentCaptor.getAllValues().get(0);
        assertEquals(PaymentStatus.PENDING, savedPayment.getStatus());
        assertEquals(5000L, savedPayment.getAmount());
        assertEquals("STRIPE-xyz", savedPayment.getSagaCorrelationId());

        AdvertisementPayment updatedPayment = paymentCaptor.getAllValues().get(1);
        assertEquals("cs_test_123", updatedPayment.getStripeCheckoutSessionId());

        verify(advertisementRepository).save(argThat(a -> "cs_test_123".equals(a.getStripeCheckoutSessionId())));
    }

    @Test
    void confirmStripePayment_shouldMarkPaymentPaidAndStoreIntentId() {
        AdvertisementPayment payment = new AdvertisementPayment();
        payment.setId(200L);
        payment.setStatus(PaymentStatus.PENDING);
        when(advertisementPaymentRepository.findById(200L)).thenReturn(Optional.of(payment));

        Advertisement ad = new Advertisement();
        ad.setId(20L);
        when(advertisementRepository.findById(20L)).thenReturn(Optional.of(ad));

        SagaContext ctx = new SagaContext();
        ctx.set(PROVIDER, PROVIDER_STRIPE);
        ctx.set(PAYMENT_TRANSACTION_ID, 200L);
        ctx.set(ADVERTISEMENT_ID, 20L);
        ctx.set(STRIPE_PAYMENT_INTENT_ID, "pi_123");
        ctx.set(STRIPE_INVOICE_ID, "inv_123");
        ctx.set(CHECKOUT_SESSION_ID, "cs_123");
        ctx.set(EVENT_RESULT, EVENT_SUCCESS);
        actions.confirmPayment(ctx);

        assertEquals(PaymentStatus.PAID, payment.getStatus());
        assertEquals("pi_123", payment.getStripePaymentIntentId());
        assertEquals("inv_123", payment.getStripeInvoiceId());
        assertEquals("pi_123", ad.getStripePaymentIntentId());
    }

    @Test
    void compensateConfirmPayment_forStripe_shouldMarkRefundPending() {
        AdvertisementPayment payment = new AdvertisementPayment();
        payment.setId(300L);
        payment.setStatus(PaymentStatus.PAID);
        when(advertisementPaymentRepository.findById(300L)).thenReturn(Optional.of(payment));

        SagaContext ctx = new SagaContext();
        ctx.set(PROVIDER, PROVIDER_STRIPE);
        ctx.set(PAYMENT_TRANSACTION_ID, 300L);

        actions.compensateConfirmPayment(ctx);

        assertEquals(PaymentStatus.REFUND_PENDING, payment.getStatus());
    }
}
