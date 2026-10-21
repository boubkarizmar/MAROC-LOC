package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.CommentDTO;
import com.marocloc.marocloc_backend.dto.CreateCommentRequest;
import com.marocloc.marocloc_backend.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiRoutes.REVIEWS + "/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentDTO> createComment(
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.createComment(userDetails.getUsername(), request));
    }

    @GetMapping("/review/{reviewId}")
    public ResponseEntity<Page<CommentDTO>> getReviewComments(
            @PathVariable Long reviewId,
            Pageable pageable) {

        return ResponseEntity.ok(commentService.getReviewComments(reviewId, pageable));
    }

    @GetMapping("/review/{reviewId}/with-replies")
    public ResponseEntity<Page<CommentDTO>> getReviewCommentsWithReplies(
            @PathVariable Long reviewId,
            Pageable pageable) {

        return ResponseEntity.ok(commentService.getReviewCommentsWithReplies(reviewId, pageable));
    }

    @PostMapping("/{commentId}/like")
    public ResponseEntity<CommentDTO> likeComment(@PathVariable Long commentId) {
        return ResponseEntity.ok(commentService.likeComment(commentId));
    }

    @PostMapping("/{commentId}/dislike")
    public ResponseEntity<CommentDTO> dislikeComment(@PathVariable Long commentId) {
        return ResponseEntity.ok(commentService.dislikeComment(commentId));
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        commentService.deleteComment(commentId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{commentId}/pin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommentDTO> pinComment(@PathVariable Long commentId) {
        return ResponseEntity.ok(commentService.pinComment(commentId));
    }

    @PostMapping("/{commentId}/unpin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommentDTO> unpinComment(@PathVariable Long commentId) {
        return ResponseEntity.ok(commentService.unpinComment(commentId));
    }
}
