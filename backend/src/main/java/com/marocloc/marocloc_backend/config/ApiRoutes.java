package com.marocloc.marocloc_backend.config;

/**
 * Central API route definitions.
 *
 * The application already mounts every controller below /api through
 * server.servlet.context-path. Controller mappings must therefore never include
 * another /api prefix.
 */
public final class ApiRoutes {

    public static final String V1 = "/v1";
    public static final String V2 = "/v2";

    public static final String AUTH = V1 + "/auth";
    public static final String ADMIN = V1 + "/admin";
    public static final String ADS = V1 + "/ads";
    public static final String AI = V1 + "/ai";
    public static final String CHATBOT = V1 + "/chatbot";
    public static final String FAVORITES = V1 + "/favorites";
    public static final String MESSAGES = V1 + "/messages";
    public static final String VISITS = V1 + "/visits";
    public static final String PAYMENTS = V1 + "/payments";
    public static final String RECOMMENDATIONS = V1 + "/recommendations";
    public static final String REVIEWS = V1 + "/reviews";
    public static final String REVIEWS_V1 = V1 + "/reviews";
    public static final String VIDEOS = V1 + "/videos";
    public static final String EVENTS = V1 + "/events";
    public static final String FRAUD = V1 + "/fraud";
    public static final String SUBSCRIPTION = V1 + "/subscription";
    public static final String NOTIFICATIONS = V1 + "/notifications";
    public static final String FCM = V1 + "/fcm";
    public static final String WEBSOCKET = "/ws";

    public static final String PROPERTIES_V2 = V2 + "/properties";

    private ApiRoutes() {
    }
}
