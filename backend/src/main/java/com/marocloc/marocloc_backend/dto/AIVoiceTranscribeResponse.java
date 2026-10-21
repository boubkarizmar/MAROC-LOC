package com.marocloc.marocloc_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AIVoiceTranscribeResponse {
    private String text;
    @JsonProperty("language_detected")
    private String languageDetected;
    private double confidence;

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getLanguageDetected() { return languageDetected; }
    public void setLanguageDetected(String languageDetected) { this.languageDetected = languageDetected; }
    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
}
