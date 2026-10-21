package com.marocloc.marocloc_backend.event.repository;

import com.marocloc.marocloc_backend.event.model.EventLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventLogRepository extends JpaRepository<EventLog, Long> {

    Optional<EventLog> findByEventId(UUID eventId);

    Page<EventLog> findByUserIdOrderByServerTimestampDesc(Long userId, Pageable pageable);

    Page<EventLog> findByEventTypeOrderByServerTimestampDesc(String eventType, Pageable pageable);

    Page<EventLog> findByEventTypeAndUserIdOrderByServerTimestampDesc(String eventType, Long userId, Pageable pageable);

    List<EventLog> findByProcessedFalseAndServerTimestampBefore(Instant before, Pageable pageable);

    @Modifying
    @Query("UPDATE EventLog e SET e.processed = true, e.processedAt = :now WHERE e.id IN :ids")
    int markAsProcessed(@Param("ids") List<Long> ids, @Param("now") Instant now);

    @Query(value = """
        SELECT payload->>'propertyId' as propertyId, COUNT(*) as views
        FROM event_log
        WHERE event_type = 'property.view'
          AND server_timestamp >= :since
          AND (payload->>'propertyId') IS NOT NULL
        GROUP BY payload->>'propertyId'
        ORDER BY views DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopViewedProperties(@Param("since") Instant since, @Param("limit") int limit);

    @Query(value = """
        SELECT payload->>'query' as query, COUNT(*) as searches
        FROM event_log
        WHERE event_type = 'search.query'
          AND server_timestamp >= :since
          AND (payload->>'query') IS NOT NULL
        GROUP BY payload->>'query'
        ORDER BY searches DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopSearchQueries(@Param("since") Instant since, @Param("limit") int limit);

    @Query(value = """
        SELECT COUNT(DISTINCT user_id) as uniqueUsers,
               COUNT(*) as totalEvents,
               COUNT(DISTINCT session_id) as sessions
        FROM event_log
        WHERE server_timestamp >= :since
        """, nativeQuery = true)
    Object[] getEngagementSummary(@Param("since") Instant since);
}
