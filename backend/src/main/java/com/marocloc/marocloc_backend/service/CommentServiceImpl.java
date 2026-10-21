package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.CommentDTO;
import com.marocloc.marocloc_backend.dto.CreateCommentRequest;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.model.Comment;
import com.marocloc.marocloc_backend.model.CommentStatus;
import com.marocloc.marocloc_backend.model.Review;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.CommentRepository;
import com.marocloc.marocloc_backend.repository.ReviewRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CommentDTO createComment(String userEmail, CreateCommentRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", userEmail));

        Review review = reviewRepository.findById(request.getReviewId())
                .orElseThrow(() -> new NotFoundException("Review", request.getReviewId()));

        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new NotFoundException("Comment", request.getParentId()));
        }

        Comment comment = Comment.builder()
                .content(request.getContent())
                .review(review)
                .user(user)
                .parent(parent)
                .status(CommentStatus.APPROVED)
                .build();

        Comment saved = commentRepository.save(comment);
        log.info("Comment {} created by user {} on review {}", saved.getId(), userEmail, review.getId());
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentDTO> getReviewComments(Long reviewId, Pageable pageable) {
        return commentRepository.findByReviewIdAndParentIsNullAndStatus(reviewId, CommentStatus.APPROVED, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentDTO> getReviewCommentsWithReplies(Long reviewId, Pageable pageable) {
        Page<Comment> topComments = commentRepository.findByReviewIdAndParentIsNullAndStatus(reviewId, CommentStatus.APPROVED, pageable);
        return topComments.map(comment -> {
            CommentDTO dto = mapToDTO(comment);
            List<Comment> replies = commentRepository.findByParentIdAndStatusOrderByCreatedAtAsc(comment.getId(), CommentStatus.APPROVED);
            dto.setReplies(replies.stream().map(this::mapToDTO).collect(Collectors.toList()));
            return dto;
        });
    }

    @Override
    @Transactional
    public CommentDTO likeComment(Long commentId) {
        commentRepository.incrementLikeCount(commentId);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment", commentId));
        return mapToDTO(comment);
    }

    @Override
    @Transactional
    public CommentDTO dislikeComment(Long commentId) {
        commentRepository.incrementDislikeCount(commentId);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment", commentId));
        return mapToDTO(comment);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", userEmail));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment", commentId));

        if (!comment.getUser().getId().equals(user.getId()) && user.getRole() != com.marocloc.marocloc_backend.model.Role.ADMIN) {
            throw new SecurityException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
        log.info("Comment {} deleted by user {}", commentId, userEmail);
    }

    @Override
    @Transactional
    public CommentDTO pinComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment", commentId));
        comment.setIsPinned(true);
        return mapToDTO(commentRepository.save(comment));
    }

    @Override
    @Transactional
    public CommentDTO unpinComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment", commentId));
        comment.setIsPinned(false);
        return mapToDTO(commentRepository.save(comment));
    }

    private CommentDTO mapToDTO(Comment comment) {
        return CommentDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getName())
                .reviewId(comment.getReview().getId())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .likeCount(comment.getLikeCount())
                .dislikeCount(comment.getDislikeCount())
                .isPinned(comment.getIsPinned())
                .status(comment.getStatus().name())
                .createdAt(comment.getCreatedAt())
                .replies(new ArrayList<>())
                .build();
    }
}
