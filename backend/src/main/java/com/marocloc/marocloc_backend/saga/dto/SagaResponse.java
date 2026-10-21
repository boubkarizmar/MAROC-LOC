package com.marocloc.marocloc_backend.saga.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class SagaResponse {

    private Long id;
    private String sagaType;
    private String status;
    private String correlationId;
    private String provider;
    private String result;
    private String resultMessage;
    private Map<String, Object> payload;
    private List<SagaStepResponse> steps;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class SagaStepResponse {
        private Long id;
        private String name;
        private Integer order;
        private String status;
        private Map<String, Object> input;
        private Map<String, Object> output;
        private String errorMessage;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
