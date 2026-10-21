package com.marocloc.marocloc_backend;

import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import com.marocloc.marocloc_backend.event.service.KafkaEventProducer;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import org.junit.jupiter.api.BeforeEach;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
            DockerImageName.parse("postgis/postgis:15-3.4").asCompatibleSubstituteFor("postgres")
    )
            .withDatabaseName("marocloc_test")
            .withUsername("test")
            .withPassword("test")
            .withInitScript("db/init-postgis.sql");

    @MockBean
    protected StringRedisTemplate stringRedisTemplate;

    @MockBean
    protected KafkaEventProducer kafkaEventProducer;

    @MockBean
    private CacheManager cacheManager;

    @BeforeEach
    void setupCacheManager() {
        when(cacheManager.getCache(anyString())).thenAnswer(invocation ->
                new ConcurrentMapCache(invocation.getArgument(0)));
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName);
    }
}
