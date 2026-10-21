package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateSiteReviewRequest {
    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;

    @Size(max = 2000)
    private String comment;

    @Size(max = 100)
    private String userName;

    @Email
    @Size(max = 200)
    private String userEmail;
}
