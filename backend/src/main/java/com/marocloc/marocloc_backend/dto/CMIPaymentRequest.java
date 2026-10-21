package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CMIPaymentRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be at least 1")
    private Double amount;

    private String currency = "504"; // MAD default

    private String lang = "fr";

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private Long advertisementId;

    private Long propertyId;

    private String transactionType; // RESERVATION or PURCHASE
}
