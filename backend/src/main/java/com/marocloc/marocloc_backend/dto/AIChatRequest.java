package com.marocloc.marocloc_backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class AIChatRequest {
    private String message;
    @JsonProperty("session_id")
    @JsonAlias("sessionId")
    private String sessionId;
    private String language = "auto";
    @JsonProperty("user_role")
    @JsonAlias("userRole")
    private String userRole; // "locataire", "proprietaire", "admin", or null for guest

    public AIChatRequest() {}
    public AIChatRequest(String message) { this.message = message; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
}
