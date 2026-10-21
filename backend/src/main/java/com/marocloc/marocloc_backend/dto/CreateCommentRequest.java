package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCommentRequest {

    @NotNull(message = "Review ID is required")
    private Long reviewId;

    @NotBlank(message = "Content is required")
    @Size(min = 1, max = 3000, message = "Content must be between 1 and 3000 characters")
    private String content;

    private Long parentId;
}
