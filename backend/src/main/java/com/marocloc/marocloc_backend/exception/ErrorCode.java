package com.marocloc.marocloc_backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Standardized error codes for all API responses.
 * Each error code maps to a specific HTTP status and provides a machine-readable identifier.
 */
@Getter
public enum ErrorCode {

    // Authentication & Authorization
    AUTH_REQUIRED("AUTH_REQUIRED", "Authentification requise", HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Email ou mot de passe incorrect", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("ACCESS_DENIED", "Accès refusé", HttpStatus.FORBIDDEN),
    TOKEN_EXPIRED("TOKEN_EXPIRED", "Token expiré", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID("TOKEN_INVALID", "Token invalide", HttpStatus.UNAUTHORIZED),

    // Resource Errors
    NOT_FOUND("NOT_FOUND", "Ressource non trouvée", HttpStatus.NOT_FOUND),
    USER_EXISTS("USER_EXISTS", "Utilisateur déjà existant", HttpStatus.CONFLICT),
    PROPERTY_NOT_FOUND("PROPERTY_NOT_FOUND", "Annonce non trouvée", HttpStatus.NOT_FOUND),
    REVIEW_NOT_FOUND("REVIEW_NOT_FOUND", "Avis non trouvé", HttpStatus.NOT_FOUND),

    // Validation Errors
    VALIDATION_ERROR("VALIDATION_ERROR", "Validation échouée", HttpStatus.BAD_REQUEST),
    BAD_REQUEST("BAD_REQUEST", "Requête invalide", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE("FILE_TOO_LARGE", "Fichier trop volumineux", HttpStatus.PAYLOAD_TOO_LARGE),

    // Business Logic Errors
    PAYMENT_FAILED("PAYMENT_FAILED", "Paiement échoué", HttpStatus.BAD_REQUEST),
    SUBSCRIPTION_INVALID("SUBSCRIPTION_INVALID", "Abonnement invalide", HttpStatus.BAD_REQUEST),
    AD_LIMIT_REACHED("AD_LIMIT_REACHED", "Limite d'annonces atteinte", HttpStatus.BAD_REQUEST),

    // Database Errors
    DATA_INTEGRITY_VIOLATION("DATA_INTEGRITY_VIOLATION", "Contrainte de base de données violée", HttpStatus.CONFLICT),
    CONCURRENT_MODIFICATION("CONCURRENT_MODIFICATION", "Modification concurrente détectée", HttpStatus.CONFLICT),

    // External Service Errors
    AI_SERVICE_UNAVAILABLE("AI_SERVICE_UNAVAILABLE", "Service IA indisponible", HttpStatus.SERVICE_UNAVAILABLE),
    STRIPE_ERROR("STRIPE_ERROR", "Erreur de paiement Stripe", HttpStatus.BAD_GATEWAY),

    // Generic
    INTERNAL_ERROR("INTERNAL_ERROR", "Une erreur interne s'est produite", HttpStatus.INTERNAL_SERVER_ERROR),
    SERVICE_UNAVAILABLE("SERVICE_UNAVAILABLE", "Service temporairement indisponible", HttpStatus.SERVICE_UNAVAILABLE),
    RATE_LIMIT_EXCEEDED("RATE_LIMIT_EXCEEDED", "Trop de requêtes", HttpStatus.TOO_MANY_REQUESTS);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String defaultMessage, HttpStatus httpStatus) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.httpStatus = httpStatus;
    }
}
