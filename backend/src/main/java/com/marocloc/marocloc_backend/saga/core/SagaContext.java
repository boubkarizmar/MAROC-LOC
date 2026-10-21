package com.marocloc.marocloc_backend.saga.core;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class SagaContext {

    private final Map<String, Object> data = new HashMap<>();
    private String result;
    private String resultMessage;

    public void set(String key, Object value) {
        data.put(key, value);
    }

    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        return (T) data.get(key);
    }

    public Long getLong(String key) {
        Object value = data.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String str) {
            return Long.valueOf(str);
        }
        throw new IllegalArgumentException("Value for key " + key + " is not a number: " + value.getClass());
    }

    public void remove(String key) {
        data.remove(key);
    }

    public Map<String, Object> toMap() {
        return new HashMap<>(data);
    }

    public static SagaContext fromMap(Map<String, Object> map) {
        SagaContext ctx = new SagaContext();
        if (map != null) {
            ctx.data.putAll(map);
        }
        return ctx;
    }
}
