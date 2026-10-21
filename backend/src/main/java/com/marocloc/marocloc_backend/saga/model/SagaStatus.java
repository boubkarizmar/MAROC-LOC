package com.marocloc.marocloc_backend.saga.model;

public enum SagaStatus {
    STARTED,
    IN_PROGRESS,
    WAITING,
    COMPLETED,
    FAILED,
    COMPENSATED
}
