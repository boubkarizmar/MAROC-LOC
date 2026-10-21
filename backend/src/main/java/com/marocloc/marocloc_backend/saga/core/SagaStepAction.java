package com.marocloc.marocloc_backend.saga.core;

@FunctionalInterface
public interface SagaStepAction {
    void execute(SagaContext context) throws Exception;
}
