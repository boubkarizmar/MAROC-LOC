#!/usr/bin/env bash
# Start the Spring Boot backend against the local Docker-supplied PostgreSQL/Redis
# for real E2E validation on port 8081.
set -euo pipefail

cd "$(dirname "$0")/../backend"

export JWT_SECRET="${JWT_SECRET:-marocloc_jwt_secret_key_32chars_long}"
export JWT_ACCESS_EXPIRATION="${JWT_ACCESS_EXPIRATION:-86400000}"
export JWT_REFRESH_EXPIRATION="${JWT_REFRESH_EXPIRATION:-604800000}"
export ENCRYPTION_SECRET="${ENCRYPTION_SECRET:-marocloc_encryption_secret_key_32chars}"
export SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL:-jdbc:postgresql://localhost:5432/marocloc_db}"
export SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-marocloc}"
export SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-marocloc_secret_2024}"
export SPRING_DATA_REDIS_HOST="${SPRING_DATA_REDIS_HOST:-localhost}"
export SPRING_DATA_REDIS_PORT="${SPRING_DATA_REDIS_PORT:-6379}"
export SERVER_PORT="${SERVER_PORT:-8081}"
export LOGGING_FILE_PATH="logs"
export UPLOAD_PATH="uploads"
: "${STRIPE_SECRET_KEY:?Set STRIPE_SECRET_KEY before running this test}"
export STRIPE_SECRET_KEY
: "${STRIPE_WEBHOOK_SECRET:?Set STRIPE_WEBHOOK_SECRET before running this test}"
export STRIPE_WEBHOOK_SECRET
export CMI_MERCHANT_ID="${CMI_MERCHANT_ID:-SAND123456}"
export CMI_STORE_KEY="${CMI_STORE_KEY:-SANDKEY789}"
export CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-http://localhost:5173,http://localhost:4173,http://localhost:3000,http://localhost:8081,http://127.0.0.1:4173,http://localhost:5050,http://127.0.0.1:5050}"

mkdir -p logs uploads

# Kill any previous backend on the same port
if command -v taskkill >/dev/null 2>&1; then
  taskkill //IM java.exe //F >/dev/null 2>&1 || true
fi

nohup ./mvnw spring-boot:run -Dspring-boot.run.profiles=docker > logs/validation-run.log 2>&1 &
echo $!
