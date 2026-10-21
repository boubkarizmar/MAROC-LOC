package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentResponse {

    private String label;
    private Double score;
    private Double confidence;
    private String languageDetected;
    private List<String> positiveWords;
    private List<String> negativeWords;
}
