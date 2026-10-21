package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.Comment;
import com.marocloc.marocloc_backend.model.CommentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    /** Top-level comments for a review (parent = null) */
    Page<Comment> findByReviewIdAndParentIsNullAndStatus(Long reviewId, CommentStatus status, Pageable pageable);

    /** Replies to a specific comment */
    List<Comment> findByParentIdAndStatusOrderByCreatedAtAsc(Long parentId, CommentStatus status);

    /** All comments by a user */
    Page<Comment> findByUserIdAndStatus(Long userId, CommentStatus status, Pageable pageable);

    /** Comments pending moderation */
    Page<Comment> findByStatus(CommentStatus status, Pageable pageable);

    /** Count comments by review */
    long countByReviewIdAndStatus(Long reviewId, CommentStatus status);

    @Modifying
    @Query("UPDATE Comment c SET c.likeCount = c.likeCount + 1 WHERE c.id = :commentId")
    void incrementLikeCount(@Param("commentId") Long commentId);

    @Modifying
    @Query("UPDATE Comment c SET c.dislikeCount = c.dislikeCount + 1 WHERE c.id = :commentId")
    void incrementDislikeCount(@Param("commentId") Long commentId);
}
