package com.marocloc.marocloc_backend.config;

import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.context.annotation.Configuration;

/**
 * API Versioning Strategy Configuration.
 *
 * Supports multiple versioning approaches:
 * 1. URI Versioning: /api/v1/properties, /api/v2/properties
 * 2. Header Versioning: X-API-Version: 1
 * 3. Query Parameter: /api/properties?version=1
 *
 * Currently using URI versioning as primary strategy.
 */
@Configuration
public class ApiVersioningConfig implements WebMvcConfigurer {

    // Version constants for API endpoints
    public static final String API_V1 = "/api/v1";
    public static final String API_V2 = "/api/v2";

    // Mapping of versions to descriptions
    public static final String VERSION_1_DESC = "Legacy API - Initial version with basic operations";
    public static final String VERSION_2_DESC = "Current API - Enhanced with QueryDSL, advanced filtering, and performance optimizations";
}
