package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for User entity operations
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email (used for login and duplicate checks)
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if email already exists
     */
    boolean existsByEmail(String email);

    /**
     * Find unverified users with pagination (admin use)
     */
    Page<User> findByIsVerifiedFalse(Pageable pageable);

    /**
     * Count verified users (admin statistics)
     */
    long countByIsVerifiedTrue();

    long countByRole(Role role);

    long countByRoleNot(Role role);

    long countByCreatedAtAfter(LocalDateTime date);
}