package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.UserBehavior;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for UserBehavior entity
 * Provides methods for behavior analysis and ML data extraction
 */
@Repository
public interface UserBehaviorRepository extends JpaRepository<UserBehavior, Long> {

    List<UserBehavior> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<UserBehavior> findByUserIdAndBehaviorTypeOrderByCreatedAtDesc(Long userId, String behaviorType);

    List<UserBehavior> findByBehaviorTypeAndCreatedAtAfter(String behaviorType, LocalDateTime since);

    @Query("SELECT ub FROM UserBehavior ub WHERE ub.user.id = :userId AND ub.createdAt > :since ORDER BY ub.createdAt DESC")
    List<UserBehavior> findRecentBehaviors(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Query("SELECT DISTINCT ub.entityId FROM UserBehavior ub WHERE ub.user.id = :userId AND ub.entityType = 'PROPERTY' AND ub.behaviorType IN ('VIEW', 'FAVORITE', 'CONTACT') ORDER BY ub.createdAt DESC")
    List<Long> findInteractedPropertyIds(@Param("userId") Long userId);

    @Query("SELECT COUNT(ub) FROM UserBehavior ub WHERE ub.user.id = :userId AND ub.entityType = 'PROPERTY' AND ub.entityId = :propertyId AND ub.behaviorType = :behaviorType")
    Long countBehaviorForProperty(@Param("userId") Long userId, @Param("propertyId") Long propertyId, @Param("behaviorType") String behaviorType);

    @Query("SELECT ub FROM UserBehavior ub WHERE ub.sessionId = :sessionId ORDER BY ub.createdAt ASC")
    List<UserBehavior> findBySessionId(@Param("sessionId") String sessionId);

    @Query("SELECT DISTINCT ub.user.id FROM UserBehavior ub WHERE ub.behaviorType = :behaviorType AND ub.createdAt > :since")
    List<Long> findActiveUserIds(@Param("behaviorType") String behaviorType, @Param("since") LocalDateTime since);

    @Query("SELECT ub.entityId, COUNT(ub), MAX(ub.weight) FROM UserBehavior ub WHERE ub.behaviorType = :behaviorType AND ub.entityType = 'PROPERTY' AND ub.entityId IN :propertyIds GROUP BY ub.entityId")
    List<Object[]> countBehaviorsByPropertyIds(@Param("behaviorType") String behaviorType, @Param("propertyIds") List<Long> propertyIds);

    @Query("SELECT ub.entityId FROM UserBehavior ub WHERE ub.user.id = :userId AND ub.behaviorType = 'FAVORITE' AND ub.entityType = 'PROPERTY' ORDER BY ub.createdAt DESC")
    List<Long> findFavoritedPropertyIdsByUser(@Param("userId") Long userId);

    @Query("SELECT ub.entityId FROM UserBehavior ub WHERE ub.user.id = :userId AND ub.behaviorType = 'VIEW' AND ub.entityType = 'PROPERTY' ORDER BY ub.createdAt DESC")
    List<Long> findViewedPropertyIdsByUser(@Param("userId") Long userId);

    @Query("SELECT ub.user.id FROM UserBehavior ub WHERE ub.behaviorType = 'FAVORITE' AND ub.entityId = :propertyId")
    List<Long> findUsersWhoFavoritedProperty(@Param("propertyId") Long propertyId);
}