#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# MAROC-LOC — Health Check Script
# ============================================================

BACKEND_URL="${BACKEND_URL:-http://localhost:8080/api/actuator/health}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
AI_URL="${AI_URL:-http://localhost:8000/health}"

echo "🔍 Checking service health..."
echo ""

check() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "${url}" || echo "000")
  if [ "${code}" = "200" ] || [ "${code}" = "401" ]; then
    echo "  ✅ ${name}: OK (${code})"
  else
    echo "  ❌ ${name}: FAIL (${code})"
  fi
}

check "Backend"  "${BACKEND_URL}"
check "Frontend" "${FRONTEND_URL}"
check "AI"       "${AI_URL}"

echo ""
