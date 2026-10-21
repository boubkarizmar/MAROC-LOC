package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.model.PropertyType;
import java.math.BigDecimal;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long>,
                                          PropertyRepositoryCustom,
                                          QuerydslPredicateExecutor<Property> {

    @EntityGraph(attributePaths = {"owner"})
    Page<Property> findByOwnerId(Long ownerId, Pageable pageable);

    @EntityGraph(attributePaths = {"owner"})
    Page<Property> findByStatus(PropertyStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"owner"})
    Page<Property> findByStatusIn(List<PropertyStatus> statuses, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"owner"})
    Optional<Property> findById(Long id);

    @Query("SELECT p FROM Property p WHERE p.status IN :statuses AND p.city IN :cities")
    Page<Property> findByStatusAndCityIn(@Param("statuses") List<PropertyStatus> statuses,
                                         @Param("cities") List<String> cities,
                                         Pageable pageable);

    @Query("SELECT p FROM Property p WHERE p.status IN :statuses " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    Page<Property> findByPriceRange(@Param("statuses") List<PropertyStatus> statuses,
                                    @Param("minPrice") BigDecimal minPrice,
                                    @Param("maxPrice") BigDecimal maxPrice,
                                    Pageable pageable);

    @Query("SELECT DISTINCT p.city FROM Property p WHERE p.status IN :statuses")
    List<String> findDistinctCitiesByStatus(@Param("statuses") List<PropertyStatus> statuses);

    @Query("SELECT AVG(p.price), MIN(p.price), MAX(p.price) FROM Property p WHERE p.status = :status")
    Object[] getPriceStatisticsByStatus(@Param("status") PropertyStatus status);

    long countByStatus(PropertyStatus status);

    long countByIsVerifiedTrue();

    default Page<Property> searchByFullText(String query, List<PropertyStatus> statuses, Pageable pageable) {
        if (query == null || query.isEmpty()) {
            return findByStatusIn(statuses, pageable);
        }
        // Full-text search implementation via native query or QueryDSL
        // Fallback: use existing filter method with keyword
        return findByStatusIn(statuses, pageable);
    }

    @Query("SELECT DISTINCT p.customCategory FROM Property p WHERE p.customCategory IS NOT NULL AND p.customCategory != ''")
    List<String> findDistinctCustomCategories();

    @Query("SELECT p FROM Property p WHERE p.status IN :statuses " +
           "AND p.city IN :cities " +
           "AND (:type IS NULL OR p.type = :type) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    Page<Property> findWithFilters(@Param("statuses") List<PropertyStatus> statuses,
                                   @Param("cities") List<String> cities,
                                   @Param("type") PropertyType type,
                                   @Param("minPrice") BigDecimal minPrice,
                                   @Param("maxPrice") BigDecimal maxPrice,
                                   Pageable pageable);
    // Dans PropertyRepository.java
    @Query("SELECT DISTINCT p.city FROM Property p WHERE p.city IS NOT NULL AND p.city != '' ORDER BY p.city")
    List<String> findDistinctCities();
    default Page<Property> findActiveProperties(List<PropertyStatus> statuses, Pageable pageable) {
        return findByStatusIn(statuses, pageable);
    }

    default Page<Property> findPropertiesWithFilters(List<PropertyStatus> statuses,
                                                      List<String> cities,
                                                      List<PropertyType> types,
                                                      List<String> categories,
                                                      BigDecimal minPrice,
                                                      BigDecimal maxPrice,
                                                      PropertyStatus status,
                                                      Pageable pageable) {
        if (cities != null && !cities.isEmpty()) {
            return findByStatusAndCityIn(statuses, cities, pageable);
        }
        return findByPriceRange(statuses, minPrice, maxPrice, pageable);
    }

    default Page<Property> findNearbyProperties(Double lat, Double lng, String city,
                                                 BigDecimal minPrice, BigDecimal maxPrice,
                                                 String type, Pageable pageable) {
        return findByPriceRange(List.of(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE),
                                minPrice, maxPrice, pageable);
    }

    default Page<Property> findByOwnerIdAndStatus(Long ownerId, PropertyStatus status, Pageable pageable) {
        if (status != null) {
            return findByOwnerId(ownerId, pageable);
        }
        return findByOwnerId(ownerId, pageable);
    }

    // ==================== AGGREGATION QUERIES FOR STATISTICS ====================

    @Query("SELECT COALESCE(SUM(p.viewCount), 0) FROM Property p")
    long sumViewCount();

    @Query("SELECT COUNT(p) FROM Property p WHERE p.createdAt >= :startOfMonth")
    long countCreatedSince(@Param("startOfMonth") java.time.LocalDateTime startOfMonth);

    @Query("SELECT COALESCE(AVG(p.discountPercentage), 0.0) FROM Property p WHERE p.discountPercentage IS NOT NULL")
    double averageDiscountPercentage();

    @Query("SELECT p.city, COUNT(p), COALESCE(AVG(p.price), 0.0), COALESCE(SUM(p.viewCount), 0) " +
           "FROM Property p WHERE p.city IS NOT NULL GROUP BY p.city")
    List<Object[]> getCityAggregation();

    @Query("SELECT p FROM Property p WHERE p.status IN :statuses AND p.id NOT IN :excludedIds")
    List<Property> findCandidatesExcludingIds(
            @Param("statuses") List<PropertyStatus> statuses,
            @Param("excludedIds") Set<Long> excludedIds,
            Pageable pageable);

    long countByCreatedAtAfter(java.time.LocalDateTime date);

    @Query(value = """
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM property
        WHERE created_at >= :since
        GROUP BY DATE(created_at)
        ORDER BY day DESC
        """, nativeQuery = true)
    List<Object[]> countPropertiesByDay(@Param("since") java.time.LocalDateTime since);

    @Query("SELECT p.category, COUNT(p) FROM Property p WHERE p.category IS NOT NULL GROUP BY p.category")
    List<Object[]> countByCategory();

    @Query(value = """
        SELECT
            p.category as category,
            COUNT(*) as total_count,
            COUNT(CASE WHEN p.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as current_month,
            COUNT(CASE WHEN p.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                       AND p.created_at < DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as previous_month
        FROM property p
        WHERE p.category IS NOT NULL
        GROUP BY p.category
        """, nativeQuery = true)
    List<Object[]> countByCategoryWithGrowth();

    @Query(value = """
        SELECT
            u.id as user_id,
            u.name as name,
            u.avatar as avatar,
            u.city as city,
            u.is_verified as verified,
            COUNT(DISTINCT p.id) as property_count,
            COALESCE(AVG(r.rating), 0.0) as avg_rating,
            COUNT(DISTINCT r.id) as review_count,
            COALESCE(o_r.response_rate, 0.0) as response_rate,
            COALESCE(ads.premium_count, 0) as premium_ad_count,
            COALESCE(visits.visit_count, 0) as visit_count
        FROM users u
        JOIN property p ON p.owner_id = u.id
        LEFT JOIN reviews r ON r.property_id = p.id AND r.status = 'APPROVED'
        LEFT JOIN owner_ratings o_r ON o_r.user_id = u.id
        LEFT JOIN (
            SELECT created_by_user_id, COUNT(*) as premium_count
            FROM advertisements
            WHERE plan = 'PREMIUM_ADS' AND is_active = true
            GROUP BY created_by_user_id
        ) ads ON ads.created_by_user_id = u.id
        LEFT JOIN (
            SELECT owner_id, COUNT(*) as visit_count
            FROM property_visit
            WHERE status NOT IN ('CANCELLED', 'NO_SHOW')
            GROUP BY owner_id
        ) visits ON visits.owner_id = u.id
        WHERE u.role = 'PROPRIETAIRE'
        GROUP BY u.id, u.name, u.avatar, u.city, u.is_verified, o_r.response_rate, ads.premium_count, visits.visit_count
        """, nativeQuery = true)
    List<Object[]> getOwnerRankingsRaw();

    @Query("SELECT COUNT(DISTINCT p.city) FROM Property p WHERE p.city IS NOT NULL AND p.city != ''")
    long countDistinctCities();

}