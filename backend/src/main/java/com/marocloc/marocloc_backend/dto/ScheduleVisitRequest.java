package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleVisitRequest {

    @NotNull(message = "Property ID is required")
    private Long propertyId;

    @NotBlank(message = "Visit date is required")
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Date must be in YYYY-MM-DD format")
    private String visitDate;

    @NotBlank(message = "Visit time is required")
    @Pattern(regexp = "\\d{2}:\\d{2}", message = "Time must be in HH:MM format")
    private String visitTime;

    @NotBlank(message = "Visitor name is required")
    @Size(min = 2, max = 120, message = "Name must be between 2 and 120 characters")
    private String visitorName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(?:\\+212|0)(?:6|7)\\d{8}$", message = "Invalid Moroccan phone number")
    private String visitorPhone;

    @Email(message = "Invalid email format")
    private String visitorEmail;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
