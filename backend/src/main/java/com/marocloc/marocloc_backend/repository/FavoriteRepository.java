package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.Favorite;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    @EntityGraph(attributePaths = {"property"})
    List<Favorite> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user"})
    List<Favorite> findByPropertyId(Long propertyId);

    Optional<Favorite> findByUserIdAndPropertyId(Long userId, Long propertyId);

    boolean existsByUserIdAndPropertyId(Long userId, Long propertyId);

    void deleteByUserIdAndPropertyId(Long userId, Long propertyId);

    @Query("SELECT COUNT(f) FROM Favorite f WHERE f.property.id IN ?1")
    Long countByPropertyIdIn(List<Long> propertyIds);

    long countByPropertyId(Long propertyId);

    @Query("SELECT f.property.id, COUNT(f) FROM Favorite f GROUP BY f.property.id")
    List<Object[]> countFavoritesGroupedByProperty();

    @Query("SELECT f.property.id FROM Favorite f WHERE f.user.id = :userId")
    List<Long> findPropertyIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT f.user.id FROM Favorite f WHERE f.property.id = :propertyId")
    List<Long> findUserIdsByPropertyId(@Param("propertyId") Long propertyId);

    @Query("SELECT f.property.id, COUNT(f) FROM Favorite f WHERE f.property.id IN :propertyIds GROUP BY f.property.id")
    List<Object[]> countFavoritesByPropertyIds(@Param("propertyIds") List<Long> propertyIds);

    @Query("SELECT COUNT(f) FROM Favorite f WHERE f.user.id = :userId AND f.property.id = :propertyId")
    Long countByUserIdAndPropertyId(@Param("userId") Long userId, @Param("propertyId") Long propertyId);

    @Query("SELECT f.user.id, f.property.id FROM Favorite f WHERE f.user.id IN :userIds")
    List<Object[]> findFavoritesForUsers(@Param("userIds") List<Long> userIds);
}