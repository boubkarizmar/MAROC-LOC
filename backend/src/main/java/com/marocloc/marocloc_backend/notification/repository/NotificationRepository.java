package com.marocloc.marocloc_backend.notification.repository;

import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.notification.model.Notification;
import com.marocloc.marocloc_backend.notification.model.NotificationStatus;
import com.marocloc.marocloc_backend.notification.model.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("""
            SELECT n FROM Notification n
            WHERE n.user.id = :userId
              AND n.deletedAt IS NULL
              AND (:status IS NULL OR n.status = :status)
              AND (:type IS NULL OR n.type = :type)
              AND (:search IS NULL OR LOWER(n.title) LIKE :search OR LOWER(n.message) LIKE :search)
            ORDER BY n.createdAt DESC
            """)
    Page<Notification> findByUserIdAndFilters(
            @Param("userId") Long userId,
            @Param("status") NotificationStatus status,
            @Param("type") NotificationType type,
            @Param("search") String search,
            Pageable pageable);

    @Query("""
            SELECT n FROM Notification n
            WHERE n.deletedAt IS NULL
              AND (:status IS NULL OR n.status = :status)
              AND (:type IS NULL OR n.type = :type)
              AND (:role IS NULL OR n.role = :role)
              AND (:search IS NULL OR LOWER(n.title) LIKE :search OR LOWER(n.message) LIKE :search)
            ORDER BY n.createdAt DESC
            """)
    Page<Notification> findAllByFilters(
            @Param("status") NotificationStatus status,
            @Param("type") NotificationType type,
            @Param("role") Role role,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.status = 'UNREAD' AND n.deletedAt IS NULL")
    long countUnreadByUserId(@Param("userId") Long userId);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.status = 'UNREAD' AND n.deletedAt IS NULL ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.id = :id AND n.user.id = :userId AND n.deletedAt IS NULL")
    Optional<Notification> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.status = 'READ', n.readAt = :now WHERE n.user.id = :userId AND n.status = 'UNREAD' AND n.deletedAt IS NULL")
    int markAllAsReadByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Notification n SET n.status = 'DELETED', n.deletedAt = :now WHERE n.id = :id AND n.user.id = :userId")
    int softDeleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Query("""
        SELECT n.type, COUNT(n) FROM Notification n
        WHERE n.user.id = :userId AND n.deletedAt IS NULL
        GROUP BY n.type
        """)
    List<Object[]> countByTypeForUser(@Param("userId") Long userId);

    @Query("""
        SELECT n.type, COUNT(n) FROM Notification n
        WHERE n.deletedAt IS NULL
        GROUP BY n.type
        """)
    List<Object[]> countByTypeGlobal();

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.deletedAt IS NULL")
    long countAllActive();

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.deletedAt IS NULL")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.status = :status AND n.deletedAt IS NULL")
    long countByStatus(@Param("status") NotificationStatus status);

    @Query("""
        SELECT n FROM Notification n
        WHERE n.user.id = :userId
          AND n.type = :type
          AND n.entityId = :entityId
          AND n.entityType = :entityType
          AND n.createdAt > :since
          AND n.deletedAt IS NULL
        ORDER BY n.createdAt DESC
        """)
    List<Notification> findRecentByUserTypeAndEntity(
            @Param("userId") Long userId,
            @Param("type") NotificationType type,
            @Param("entityId") Long entityId,
            @Param("entityType") String entityType,
            @Param("since") LocalDateTime since);
}
