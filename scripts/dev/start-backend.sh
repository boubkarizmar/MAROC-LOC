#!/usr/bin/env bash
set -euo pipefail

# Start backend in dev mode (requires local PostgreSQL + Redis)
cd "$(dirname "$0")/../../backend"
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
