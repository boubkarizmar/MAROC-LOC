#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# MAROC-LOC — Development Environment Setup
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🚀 Setting up MAROC-LOC development environment..."
echo ""

# --- Check prerequisites ---
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting."; exit 1; }

# --- Create .env if missing ---
if [ ! -f "${PROJECT_ROOT}/.env" ]; then
  echo "📄 Creating .env from template..."
  cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
  echo "⚠️  Please edit ${PROJECT_ROOT}/.env and fill in real secrets before running."
  echo ""
fi

# --- Create uploads directories ---
mkdir -p "${PROJECT_ROOT}/backend/uploads"
mkdir -p "${PROJECT_ROOT}/backend/logs"

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your secrets"
echo "  2. Run: ./scripts/start.sh"
echo ""
