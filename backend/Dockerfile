# Multi-stage build for Spring Boot
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app
COPY pom.xml .
COPY src ./src

# Build the application with persistent Maven cache via BuildKit
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy the built JAR from builder
COPY --from=builder /app/target/*.jar app.jar

# Create uploads directory and make it writable by the runtime user
RUN mkdir -p /app/uploads && \
    addgroup -S spring && \
    adduser -S spring -G spring && \
    chown -R spring:spring /app/uploads && \
    chmod 755 /app/uploads

# JVM optimization for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

USER spring:spring

EXPOSE 8080

# Health check using curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/api/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
