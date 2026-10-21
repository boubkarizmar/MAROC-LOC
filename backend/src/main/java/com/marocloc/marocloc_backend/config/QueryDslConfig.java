package com.marocloc.marocloc_backend.config;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for QueryDSL integration.
 * Provides JPAQueryFactory bean for type-safe dynamic queries.
 */
@Configuration
public class QueryDslConfig {

    /**
     * Create JPAQueryFactory bean for QueryDSL queries.
     * This enables type-safe query construction without raw JPQL or native SQL.
     *
     * @param entityManager JPA Entity Manager
     * @return JPAQueryFactory configured with the entity manager
     */
    @Bean
    public JPAQueryFactory jpaQueryFactory(EntityManager entityManager) {
        return new JPAQueryFactory(entityManager);
    }
}
