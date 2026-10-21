#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../../ai-service"
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
