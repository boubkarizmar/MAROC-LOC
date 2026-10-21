package com.marocloc.marocloc_backend.saga.core;

import com.marocloc.marocloc_backend.saga.model.SagaType;
import lombok.Getter;

import java.util.List;

@Getter
public class SagaDefinition {

    private final SagaType type;
    private final List<SagaStepDefinition> steps;

    public SagaDefinition(SagaType type, List<SagaStepDefinition> steps) {
        this.type = type;
        this.steps = steps;
    }

    public int stepCount() {
        return steps.size();
    }
}
