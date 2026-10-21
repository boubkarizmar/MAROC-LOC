package com.marocloc.marocloc_backend.saga.model;

public enum SagaStepStatus {
    PENDING,
    EXECUTING,
    SUCCEEDED,
    FAILED,
    COMPENSATING,
    COMPENSATED
}
