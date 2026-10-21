package com.marocloc.marocloc_backend.saga.core;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SagaStepDefinition {

    private final String name;
    private final SagaStepAction action;
    private final SagaStepCompensation compensation;
    private final boolean waitForExternalEvent;

    public static SagaStepDefinition of(String name, SagaStepAction action, SagaStepCompensation compensation) {
        return SagaStepDefinition.builder()
                .name(name)
                .action(action)
                .compensation(compensation)
                .waitForExternalEvent(false)
                .build();
    }

    public static SagaStepDefinition waiting(String name, SagaStepCompensation compensation) {
        return SagaStepDefinition.builder()
                .name(name)
                .action(ctx -> {
                    // no-op: saga pauses until an external event advances it
                })
                .compensation(compensation)
                .waitForExternalEvent(true)
                .build();
    }
}
