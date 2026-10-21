package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDTO {

    private Long id;
    private String content;
    private Long userId;
    private String userName;
    private Long reviewId;
    private Long parentId;
    private Integer likeCount;
    private Integer dislikeCount;
    private Boolean isPinned;
    private String status;
    private LocalDateTime createdAt;
    private List<CommentDTO> replies;
}
