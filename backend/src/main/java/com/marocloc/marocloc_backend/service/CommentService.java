package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.CommentDTO;
import com.marocloc.marocloc_backend.dto.CreateCommentRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CommentService {

    CommentDTO createComment(String userEmail, CreateCommentRequest request);

    Page<CommentDTO> getReviewComments(Long reviewId, Pageable pageable);

    Page<CommentDTO> getReviewCommentsWithReplies(Long reviewId, Pageable pageable);

    CommentDTO likeComment(Long commentId);

    CommentDTO dislikeComment(Long commentId);

    void deleteComment(Long commentId, String userEmail);

    CommentDTO pinComment(Long commentId);

    CommentDTO unpinComment(Long commentId);
}
