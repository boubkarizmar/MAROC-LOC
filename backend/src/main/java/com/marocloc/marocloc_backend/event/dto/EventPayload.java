package com.marocloc.marocloc_backend.event.dto;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventPayload {

    private String url;
    private String referrer;
    private Long durationMs;
    private JsonNode metadata;

    private Long propertyId;
    private String propertyType;
    private String city;
    private Double price;

    private String query;
    private JsonNode filters;
    private Integer resultCount;
    private Integer resultPosition;

    private String messageContent;
    private String roomId;

    private Map<String, Object> extra = new HashMap<>();

    @JsonAnyGetter
    public Map<String, Object> getExtra() {
        return extra;
    }

    @JsonAnySetter
    public void setExtra(String key, Object value) {
        this.extra.put(key, value);
    }
}
