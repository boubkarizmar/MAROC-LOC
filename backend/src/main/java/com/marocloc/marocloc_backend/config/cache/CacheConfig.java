package com.marocloc.marocloc_backend.config.cache;

import com.fasterxml.jackson.annotation.JsonIgnoreType;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.http.ResponseEntity;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    @Primary
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.addMixIn(ResponseEntity.class, IgnoreTypeMixin.class);
        objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(objectMapper);

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .prefixCacheNameWith("marocloc:")
                .entryTtl(Duration.ofMinutes(30))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer))
                .disableCachingNullValues();

        // Custom TTLs per cache region
        Map<String, RedisCacheConfiguration> configMap = new HashMap<>();
        configMap.put("properties", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        configMap.put("propertyDetail", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        configMap.put("searchResults", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        configMap.put("userProfile", defaultConfig.entryTtl(Duration.ofHours(1)));
        configMap.put("recommendations", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        configMap.put("analytics", defaultConfig.entryTtl(Duration.ofHours(1)));
        configMap.put("subscriptions", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        configMap.put("cityStats", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        configMap.put("platformStats", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(configMap)
                .transactionAware()
                .build();
    }

    @JsonIgnoreType
    public abstract static class IgnoreTypeMixin {}
}
