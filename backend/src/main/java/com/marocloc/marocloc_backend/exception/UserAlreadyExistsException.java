package com.marocloc.marocloc_backend.exception;

/**
 * Custom exception for duplicate user registration attempts
 */
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String email) {
        super(String.format("User already exists with email: %s", email));
    }
}