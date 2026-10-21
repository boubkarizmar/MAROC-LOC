package com.marocloc.marocloc_backend.notification.fcm;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {

    List<FcmToken> findByUserId(Long userId);

    Optional<FcmToken> findByUserIdAndToken(Long userId, String token);

    @Modifying
    @Query("DELETE FROM FcmToken t WHERE t.user.id = :userId AND t.token = :token")
    void deleteByUserIdAndToken(@Param("userId") Long userId, @Param("token") String token);
}
