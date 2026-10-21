package com.marocloc.marocloc_backend.fraud.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudCheckResponse {

    public enum Decision {
        AUTO_APPROVE, MANUAL_REVIEW, AUTO_FLAG
    }

    private Long propertyId;
    private BigDecimal score;
    private Decision decision;
    private BigDecimal confidence;
    private Map<String, Object> features;
    private List<String> rulesTriggered;
    private String explanation;
    private String modelVersion;
}
