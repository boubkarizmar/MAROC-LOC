package com.marocloc.marocloc_backend.dto;

import java.util.Map;

public class AISearchRequest {
    private String query;
    private int topK = 5;
    private Map<String, Object> filters;

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public int getTopK() { return topK; }
    public void setTopK(int topK) { this.topK = topK; }
    public Map<String, Object> getFilters() { return filters; }
    public void setFilters(Map<String, Object> filters) { this.filters = filters; }
}