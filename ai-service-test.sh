#!/bin/bash
BASE=http://localhost:8000
LOG=/tmp/ai_service_test.log
: > "$LOG"

req() {
  local method="$1" path="$2" body="$3" ctype="${4:-application/json}"
  local url="${BASE}${path}"
  echo "===== $method $path =====" | tee -a "$LOG"
  if [ -n "$body" ]; then
    curl -s --max-time 30 -o /tmp/resp.json -w "HTTP %{http_code} time_total=%{time_total}\n" -X "$method" -H "Content-Type: $ctype" -d "$body" "$url" 2>&1 | tee -a "$LOG"
  else
    curl -s --max-time 30 -o /tmp/resp.json -w "HTTP %{http_code} time_total=%{time_total}\n" -X "$method" "$url" 2>&1 | tee -a "$LOG"
  fi
  cat /tmp/resp.json | head -c 2000 | tee -a "$LOG"
  echo -e "\n" | tee -a "$LOG"
}

req GET /health
req POST /search '{"query":"appartement Casablanca","filters":{},"limit":5}'
req POST /smart/chat '{"message":"je cherche un appartement à Casablanca","session_id":"test-session-1","user_id":"u1","user_role":"locataire","language":"french"}'
req GET "/smart/session/test-session-1"
req POST /rag/chat '{"message":"appartement Casablanca","session_id":"test-session-2","user_id":"u1","language":"french"}'
req POST "/rag/feedback?session_id=test-session-2&helpful=true&user_id=u1"
req POST /analytics/tts '{"text":"Bonjour, ceci est un test","language":"french"}'
req POST /analytics/tts '{"text":"مرحبا","language":"arabic"}'
req POST /fraud/check '{"property_id":1,"user_id":1,"title":"test","description":"test","price":5000,"city":"Casablanca","property_type":"apartment","account_age_days":30,"listings_count":1}'
req POST /recommendations '{"user_id":"u1","context":{"city":"Casablanca"},"n_results":5}'
req POST "/recommendations/feedback?user_id=u1&property_id=p1&clicked=true"
req GET /analytics/overview
req GET /analytics/intents
req GET /analytics/languages
req GET /analytics/top-searches
req POST /owner/generate-description '{"title":"Bel appartement","city":"Casablanca","category":"APARTMENT","propertyType":"RENT","surface":80,"rooms":3,"bedrooms":2,"language":"fr"}'
req POST /owner/suggest-price '{"city":"Casablanca","category":"APARTMENT","propertyType":"RENT","surface":80,"rooms":3,"bedrooms":2}'
req POST /sentiment/analyze '{"text":"très bon service"}'
req POST /ltv/predict '{"user_id":"u1","interactions":[{"property_id":"p1","event_type":"view","timestamp":"2026-01-01T00:00:00Z"}]}'
req GET /kaggle/datasets
req POST /kaggle/synthetic-fraud '{"n_legit":100,"n_fraud":10}'
