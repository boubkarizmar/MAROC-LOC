package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Get conversation between two users (bidirectional) with pagination.
     */
    @EntityGraph(attributePaths = {"sender", "receiver"})
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.id = :user1 AND m.receiver.id = :user2) OR " +
           "(m.sender.id = :user2 AND m.receiver.id = :user1)")
    Page<Message> findConversation(
            @Param("user1") Long user1Id,
            @Param("user2") Long user2Id,
            Pageable pageable);

    /**
     * Get all messages where the user is a participant, newest first.
     */
    @EntityGraph(attributePaths = {"sender", "receiver"})
    @Query("SELECT m FROM Message m WHERE m.sender.id = :userId OR m.receiver.id = :userId ORDER BY m.timestamp DESC")
    Page<Message> findParticipantMessages(
            @Param("userId") Long userId,
            Pageable pageable);

    /**
     * Get unread message count grouped by sender for a receiver.
     */
    @Query("SELECT m.sender.id, COUNT(m) FROM Message m WHERE m.receiver.id = :userId AND m.isRead = false GROUP BY m.sender.id")
    List<Object[]> countUnreadBySender(@Param("userId") Long userId);

    /**
     * Get all messages sent by user
     */
    @EntityGraph(attributePaths = {"receiver"})
    List<Message> findBySenderIdOrderByTimestampDesc(Long senderId);

    /**
     * Get all messages received by user
     */
    @EntityGraph(attributePaths = {"sender"})
    List<Message> findByReceiverIdOrderByTimestampDesc(Long receiverId);

    /**
     * Count unread messages for user
     */
    long countByReceiverIdAndIsReadFalse(Long receiverId);

    /**
     * Count total messages received by user
     */
    long countByReceiverId(Long receiverId);

    @Query("SELECT m.receiver.id, COUNT(m) FROM Message m GROUP BY m.receiver.id")
    List<Object[]> countMessagesGroupedByReceiver();

    @Query("SELECT m.receiver.id, COUNT(m) FROM Message m WHERE m.isRead = true GROUP BY m.receiver.id")
    List<Object[]> countReadMessagesGroupedByReceiver();

    /**
     * Get latest message in conversation
     */
    @EntityGraph(attributePaths = {"sender", "receiver"})
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.id = :user1 AND m.receiver.id = :user2) OR " +
           "(m.sender.id = :user2 AND m.receiver.id = :user1) " +
           "ORDER BY m.timestamp DESC")
    Optional<Message> findLatestMessage(
            @Param("user1") Long user1Id,
            @Param("user2") Long user2Id);
}
