package com.marocloc.marocloc_backend.dto;

import java.util.List;
import java.util.Map;

public class AISearchResponse {
    private List<Map<String, Object>> results;
    private int total;

    public List<Map<String, Object>> getResults() { return results; }
    public void setResults(List<Map<String, Object>> results) { this.results = results; }
    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }
}