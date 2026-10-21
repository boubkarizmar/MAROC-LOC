package com.marocloc.marocloc_backend.exception;


/**
 * Custom exception for resource not found scenarios
 */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String resource, String identifier) {
    super(String.format("%s not found: %s", resource, identifier));
}


    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(String resource, Long id) {
        super(String.format("%s not found with id: %d", resource, id));
    }
}