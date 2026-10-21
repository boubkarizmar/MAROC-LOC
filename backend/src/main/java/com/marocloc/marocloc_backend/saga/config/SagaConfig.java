package com.marocloc.marocloc_backend.saga.config;

import com.marocloc.marocloc_backend.saga.core.SagaDefinition;
import com.marocloc.marocloc_backend.saga.core.SagaStepDefinition;
import com.marocloc.marocloc_backend.saga.model.SagaType;
import com.marocloc.marocloc_backend.saga.paymentad.PaymentAdvertisementSagaActions;
import com.marocloc.marocloc_backend.saga.paymentad.PaymentAdvertisementSagaStep;
import com.marocloc.marocloc_backend.saga.propertyres.PropertyReservationSagaActions;
import com.marocloc.marocloc_backend.saga.propertyres.PropertyReservationSagaStep;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SagaConfig {

    @Bean
    public SagaDefinition paymentAdvertisementSagaDefinition(PaymentAdvertisementSagaActions actions) {
        return new SagaDefinition(SagaType.PAYMENT_ADVERTISEMENT, List.of(
                SagaStepDefinition.of(
                        PaymentAdvertisementSagaStep.RESERVE_ADVERTISEMENT,
                        actions::reserveAdvertisement,
                        actions::compensateReserveAdvertisement
                ),
                SagaStepDefinition.of(
                        PaymentAdvertisementSagaStep.INITIATE_PAYMENT,
                        actions::initiatePayment,
                        actions::compensateInitiatePayment
                ),
                SagaStepDefinition.waiting(
                        PaymentAdvertisementSagaStep.WAIT_PAYMENT_RESULT,
                        actions::compensateInitiatePayment
                ),
                SagaStepDefinition.of(
                        PaymentAdvertisementSagaStep.CONFIRM_PAYMENT,
                        actions::confirmPayment,
                        actions::compensateConfirmPayment
                ),
                SagaStepDefinition.of(
                        PaymentAdvertisementSagaStep.ACTIVATE_ADVERTISEMENT,
                        actions::activateAdvertisement,
                        actions::compensateActivateAdvertisement
                )
        ));
    }

    @Bean
    public SagaDefinition propertyReservationSagaDefinition(PropertyReservationSagaActions actions) {
        return new SagaDefinition(SagaType.PROPERTY_RESERVATION, List.of(
                SagaStepDefinition.of(
                        PropertyReservationSagaStep.RESERVE_PROPERTY,
                        actions::reserveProperty,
                        actions::compensateReserveProperty
                ),
                SagaStepDefinition.of(
                        PropertyReservationSagaStep.INITIATE_PAYMENT,
                        actions::initiatePayment,
                        actions::compensateInitiatePayment
                ),
                SagaStepDefinition.waiting(
                        PropertyReservationSagaStep.WAIT_PAYMENT_RESULT,
                        actions::compensateInitiatePayment
                ),
                SagaStepDefinition.of(
                        PropertyReservationSagaStep.CONFIRM_PAYMENT,
                        actions::confirmPayment,
                        actions::compensateConfirmPayment
                ),
                SagaStepDefinition.of(
                        PropertyReservationSagaStep.ACTIVATE_PROPERTY,
                        actions::activateProperty,
                        actions::compensateActivateProperty
                )
        ));
    }
}
