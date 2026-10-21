#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# MAROC-LOC — Start All Services
# ============================================================
# Usage:
#   ./scripts/start.sh          # start everything
#   ./scripts/start.sh -d       # start in detached mode
#   ./scripts/start.sh --build  # force rebuild
#   ./scripts/start.sh --local-backend  # use backend running on the host
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DETACHED=""
BUILD=""
LOCAL_BACKEND=""

while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--detach)
      DETACHED="-d"
      shift
      ;;
    --build)
      BUILD="--build"
      shift
      ;;
    --local-backend)
      LOCAL_BACKEND="1"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "🐳 Starting MAROC-LOC services..."
cd "${PROJECT_ROOT}"

COMPOSE_FILES="-f docker-compose.yml"
if [ -n "${LOCAL_BACKEND}" ]; then
  COMPOSE_FILES="${COMPOSE_FILES} -f docker-compose.local-backend.yml"
  echo "ℹ️  Using local backend (backend container will not be started)."
fi

docker compose ${COMPOSE_FILES} up ${DETACHED} ${BUILD}

if [ -n "${DETACHED}" ]; then
  echo ""
  echo "✅ Services started in detached mode."
  echo ""
  echo "Services:"
  echo "  Frontend:       http://localhost:3000"
  if [ -n "${LOCAL_BACKEND}" ]; then
    echo "  Backend API:    http://localhost:8080 (running on host)"
  else
    echo "  Backend API:    http://localhost:8080/api"
  fi
  echo "  AI Service:     http://localhost:8000"
  echo "  Grafana:        http://localhost:3001"
  echo "  Prometheus:     http://localhost:9090"
  echo ""
  echo "Logs: docker compose ${COMPOSE_FILES} logs -f"
  echo "Stop: docker compose ${COMPOSE_FILES} down"
fi
