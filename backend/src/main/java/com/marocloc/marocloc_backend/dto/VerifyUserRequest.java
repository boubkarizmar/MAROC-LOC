package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyUserRequest {
    @jakarta.validation.constraints.NotNull(message = "User ID is required")
    private Long userId;
}
