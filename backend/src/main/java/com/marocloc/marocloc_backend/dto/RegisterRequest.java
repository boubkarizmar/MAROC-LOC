package com.marocloc.marocloc_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.marocloc.marocloc_backend.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user registration requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 60, message = "First name must be between 2 and 60 characters")
    @Pattern(
        regexp = "^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$",
        message = "First name must contain only letters, spaces, apostrophes or hyphens"
    )
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 60, message = "Last name must be between 2 and 60 characters")
    @Pattern(
        regexp = "^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$",
        message = "Last name must contain only letters, spaces, apostrophes or hyphens"
    )
    private String lastName;

    @NotBlank(message = "Full name is required")
    @Size(min = 5, max = 120, message = "Full name must be between 5 and 120 characters")
    @Pattern(
        regexp = "^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*(?: [A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*)+$",
        message = "Full name must contain first and last name and use only letters, spaces, apostrophes or hyphens"
    )
    private String fullName;

    @NotBlank(message = "City is required")
    @Size(min = 2, max = 80, message = "City must be between 2 and 80 characters")
    private String city;

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^(?:\\+212|0)(?:6|7)\\d{8}$",
        message = "Phone must be a valid Moroccan number like +2126XXXXXXXX or 06XXXXXXXX"
    )
    private String phone;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&*!?&]).{8,}$",
        message = "Password must include uppercase, lowercase, a number, and a special character"
    )
    private String password;

    @NotNull(message = "Role is required")
    private Role role;
}