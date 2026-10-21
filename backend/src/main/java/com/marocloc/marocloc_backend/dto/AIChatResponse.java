package com.marocloc.marocloc_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class AIChatResponse {
    // Legacy field (from /chat endpoint)
    private String response;

    // Smart chat fields (from /smart/chat endpoint)
    private String reply;
    private String role;
    private String intent;
    private Map<String, Object> entities;

    @JsonProperty("quick_replies")
    private List<Map<String, Object>> quickReplies;
    private List<Map<String, Object>> actions;
    private List<Map<String, Object>> properties;

    private List<Map<String, Object>> sources;
    @JsonProperty("property_ids")
    private List<String> propertyIds;
    private double confidence;
    @JsonProperty("session_id")
    private String sessionId;
    private String language;
    private String transcript;
    private Map<String, Object> filters;

    // Unified response text accessor
    public String getResponseText() {
        if (reply != null && !reply.isEmpty()) return reply;
        return response;
    }

    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }
    public Map<String, Object> getEntities() { return entities; }
    public void setEntities(Map<String, Object> entities) { this.entities = entities; }
    public List<Map<String, Object>> getQuickReplies() { return quickReplies; }
    public void setQuickReplies(List<Map<String, Object>> quickReplies) { this.quickReplies = quickReplies; }
    public List<Map<String, Object>> getActions() { return actions; }
    public void setActions(List<Map<String, Object>> actions) { this.actions = actions; }
    public List<Map<String, Object>> getProperties() { return properties; }
    public void setProperties(List<Map<String, Object>> properties) { this.properties = properties; }
    public List<Map<String, Object>> getSources() { return sources; }
    public void setSources(List<Map<String, Object>> sources) { this.sources = sources; }
    public List<String> getPropertyIds() { return propertyIds; }
    public void setPropertyIds(List<String> propertyIds) { this.propertyIds = propertyIds; }
    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }
    public Map<String, Object> getFilters() { return filters; }
    public void setFilters(Map<String, Object> filters) { this.filters = filters; }
}
