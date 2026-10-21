package com.marocloc.marocloc_backend.exception;

import com.marocloc.marocloc_backend.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Global Exception Handler for consistent, production-ready error responses.
 * All errors return structured ApiErrorResponse with traceId for debugging.
 */
@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    private String generateTraceId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private ResponseEntity<ApiErrorResponse> buildErrorResponse(ErrorCode errorCode, String message,
                                                                 String traceId, String path, String suggestion) {
        return ResponseEntity.status(errorCode.getHttpStatus())
                .body(ApiErrorResponse.builder()
                        .success(false)
                        .message(message != null ? message : errorCode.getDefaultMessage())
                        .errorCode(errorCode.getCode())
                        .path(path)
                        .timestamp(LocalDateTime.now())
                        .traceId(traceId)
                        .suggestion(suggestion)
                        .build());
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFoundException(NotFoundException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Resource not found: {}", traceId, ex.getMessage());
        return buildErrorResponse(ErrorCode.NOT_FOUND, ex.getMessage(), traceId, request.getRequestURI(),
                "Vérifiez l'identifiant de la ressource demandée.");
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiErrorResponse> handleUnauthorizedException(UnauthorizedException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Unauthorized access: {}", traceId, ex.getMessage());
        return buildErrorResponse(ErrorCode.ACCESS_DENIED, ex.getMessage(), traceId, request.getRequestURI(),
                "Vérifiez que vous avez les permissions nécessaires.");
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleUserAlreadyExistsException(UserAlreadyExistsException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] User already exists: {}", traceId, ex.getMessage());
        return buildErrorResponse(ErrorCode.USER_EXISTS, ex.getMessage(), traceId, request.getRequestURI(),
                "Utilisez une autre adresse email ou connectez-vous.");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentialsException(BadCredentialsException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Bad credentials attempt", traceId);
        return buildErrorResponse(ErrorCode.INVALID_CREDENTIALS, "Email ou mot de passe incorrect", traceId, request.getRequestURI(),
                "Vérifiez vos identifiants ou réinitialisez votre mot de passe.");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(AuthenticationException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Authentication failed: {}", traceId, ex.getMessage());
        return buildErrorResponse(ErrorCode.AUTH_REQUIRED, "Authentification requise", traceId, request.getRequestURI(),
                "Connectez-vous pour accéder à cette ressource.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(AccessDeniedException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Access denied: {}", traceId, ex.getMessage());
        return buildErrorResponse(ErrorCode.ACCESS_DENIED, "Accès refusé", traceId, request.getRequestURI(),
                "Votre rôle ne permet pas cette action.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        log.warn("[{}] Validation failed: {}", traceId, errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.builder()
                        .success(false)
                        .message("Validation échouée")
                        .errorCode(ErrorCode.VALIDATION_ERROR.getCode())
                        .path(request.getRequestURI())
                        .timestamp(LocalDateTime.now())
                        .traceId(traceId)
                        .validationErrors(errors)
                        .suggestion("Corrigez les erreurs indiquées et réessayez.")
                        .build());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        Map<String, String> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(violation -> {
            String propertyPath = violation.getPropertyPath().toString();
            errors.put(propertyPath, violation.getMessage());
        });
        log.warn("[{}] Constraint violation: {}", traceId, errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.builder()
                        .success(false)
                        .message("Validation échouée")
                        .errorCode(ErrorCode.VALIDATION_ERROR.getCode())
                        .path(request.getRequestURI())
                        .timestamp(LocalDateTime.now())
                        .traceId(traceId)
                        .validationErrors(errors)
                        .suggestion("Corrigez les erreurs indiquées et réessayez.")
                        .build());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Malformed request body: {}", traceId, ex.getMessage());
        return buildErrorResponse(ErrorCode.BAD_REQUEST, "Requête invalide", traceId, request.getRequestURI(),
                "Vérifiez le format de votre requête.");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingParameter(MissingServletRequestParameterException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Missing parameter: {}", traceId, ex.getParameterName());
        return buildErrorResponse(ErrorCode.BAD_REQUEST, "Paramètre requis manquant: " + ex.getParameterName(), traceId, request.getRequestURI(),
                "Assurez-vous que tous les paramètres requis sont fournis.");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Type mismatch for parameter: {}", traceId, ex.getName());
        return buildErrorResponse(ErrorCode.BAD_REQUEST, "Type de paramètre invalide: " + ex.getName(), traceId, request.getRequestURI(),
                "Vérifiez le type des paramètres de votre requête.");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] File too large", traceId);
        return buildErrorResponse(ErrorCode.FILE_TOO_LARGE, "Fichier trop volumineux", traceId, request.getRequestURI(),
                "La taille maximale est de 10MB par image et 50MB par vidéo.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Data integrity violation: {}", traceId, ex.getMostSpecificCause().getMessage());
        return buildErrorResponse(ErrorCode.DATA_INTEGRITY_VIOLATION, "Contrainte de base de données violée", traceId, request.getRequestURI(),
                "Les données soumises entrent en conflit avec des contraintes existantes.");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResourceFound(NoResourceFoundException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Resource not found: {}", traceId, ex.getMessage());
        return buildErrorResponse(ErrorCode.NOT_FOUND, "Ressource non trouvée", traceId, request.getRequestURI(),
                "Vérifiez l'URL de la ressource demandée.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Illegal argument: {}", traceId, ex.getMessage());
        return buildErrorResponse(ErrorCode.BAD_REQUEST, ex.getMessage(), traceId, request.getRequestURI(),
                "Vérifiez les paramètres de votre requête.");
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalStateException(IllegalStateException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.error("[{}] Illegal state: {}", traceId, ex.getMessage(), ex);
        return buildErrorResponse(ErrorCode.BAD_REQUEST, ex.getMessage(), traceId, request.getRequestURI(),
                "L'opération demandée est invalide dans l'état actuel.");
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiErrorResponse> handleSecurityException(SecurityException ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Security violation: {}", traceId, ex.getMessage());
        return buildErrorResponse(ErrorCode.ACCESS_DENIED, ex.getMessage(), traceId, request.getRequestURI(),
                "Vous n'avez pas les permissions nécessaires pour cette action.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        String traceId = generateTraceId();
        log.error("[{}] Unexpected error: {}", traceId, ex.getMessage(), ex);
        return buildErrorResponse(ErrorCode.INTERNAL_ERROR, "Une erreur interne s'est produite", traceId, request.getRequestURI(),
                "Veuillez réessayer dans quelques instants. Si le problème persiste, contactez le support.");
    }
}
