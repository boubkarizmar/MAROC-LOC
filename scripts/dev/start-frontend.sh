#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../../frontend"
npm install --legacy-peer-deps
npm run dev
