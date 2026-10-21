package com.marocloc.marocloc_backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    private boolean success;
    private String message;
    private String errorCode;
    private String path;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    private Map<String, String> validationErrors;
    private String traceId;
    private String suggestion;

    public static ApiErrorResponse of(String message, String path) {
        return ApiErrorResponse.builder()
                .success(false)
                .message(message)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiErrorResponse of(String message, String path, String errorCode) {
        return ApiErrorResponse.builder()
                .success(false)
                .message(message)
                .path(path)
                .errorCode(errorCode)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiErrorResponse validationError(String path, Map<String, String> errors) {
        return ApiErrorResponse.builder()
                .success(false)
                .message("Validation failed")
                .path(path)
                .errorCode("VALIDATION_ERROR")
                .validationErrors(errors)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
