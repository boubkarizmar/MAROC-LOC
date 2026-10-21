package com.marocloc.marocloc_backend.saga.core;

@FunctionalInterface
public interface SagaStepCompensation {
    void compensate(SagaContext context) throws Exception;
}
