package com.marocloc.marocloc_backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import org.springframework.boot.autoconfigure.info.ProjectInfoProperties.Build;

/**
 * Standard API Response wrapper for all endpoints.
 * Ensures consistent response format across all API versions.
 *
 * Usage:
 * - Success: ApiResponse.success(data, "Operation successful")
 * - Error: ApiResponse.failure("Operation failed", "Invalid input")
 * - List: ApiResponse.success(page, totalElements, "List retrieved")
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    /**
     * Response status: "SUCCESS", "FAILURE", "ERROR"
     */
    private String status;

    /**
     * Human-readable message
     */
    private String message;

    /**
     * Detailed error message (if applicable)
     */
    private String error;

    /**
     * Response data payload
     */
    private T data;

    /**
     * Response timestamp (UTC)
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * HTTP Status Code
     */
    private Integer code;

    /**
     * For paginated responses: total elements
     */
    private Long totalElements;

    /**
     * For paginated responses: total pages
     */
    private Integer totalPages;

    /**
     * For paginated responses: current page number (0-based)
     */
    private Integer currentPage;

    /**
     * For paginated responses: items per page
     */
    private Integer pageSize;

    /**
     * Build successful response with data
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
            .status("SUCCESS")
            .message(message)
            .data(data)
            .code(200)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Build successful response with paginated data
     */
    public static <T> ApiResponse<T> successPaginated(
        T data,
        String message,
        Long totalElements,
        Integer totalPages,
        Integer currentPage,
        Integer pageSize) {
        return ApiResponse.<T>builder()
            .status("SUCCESS")
            .message(message)
            .data(data)
            .code(200)
            .totalElements(totalElements)
            .totalPages(totalPages)
            .currentPage(currentPage)
            .pageSize(pageSize)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Build failure response
     */
    public static <T> ApiResponse<T> failure(String message, String error) {
        return ApiResponse.<T>builder()
            .status("FAILURE")
            .message(message)
            .error(error)
            .code(400)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Build error response
     */
    public static <T> ApiResponse<T> error(String message, String error, Integer code) {
        return ApiResponse.<T>builder()
            .status("ERROR")
            .message(message)
            .error(error)
            .code(code)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Build unauthorized response
     */
    public static <T> ApiResponse<T> unauthorized(String message) {
        return ApiResponse.<T>builder()
            .status("ERROR")
            .message(message)
            .error("Unauthorized")
            .code(401)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Build not found response
     */
    public static <T> ApiResponse<T> notFound(String message) {
        return ApiResponse.<T>builder()
            .status("FAILURE")
            .message(message)
            .error("Resource not found")
            .code(404)
            .timestamp(LocalDateTime.now())
            .build();
    }
    /**
 * Build successful response with data only (convenience method)
 */
public static <T> ApiResponse<T> success(T data) {
    return ApiResponse.<T>builder()
        .status("SUCCESS")
        .message("Operation completed successfully")
        .data(data)
        .code(200)
        .timestamp(LocalDateTime.now())
        .build();
}
}
