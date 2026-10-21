#!/bin/bash
BASE="http://localhost:8080/api"
AI_BASE="http://localhost:8000"
PASS=0
FAIL=0

pass() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

# Get token
LOGIN_RESP=$(curl -s -X POST "$BASE/v1/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"e2e_test@marocloc.com","password":"E2ePass123!"}')
TOKEN=$(echo "$LOGIN_RESP" | py -3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
REFRESH=$(echo "$LOGIN_RESP" | py -3 -c "import sys,json; print(json.load(sys.stdin)['refreshToken'])" 2>/dev/null)

echo "=== AUTH ==="
[ -n "$TOKEN" ] && pass "Login" || fail "Login"
[ -n "$REFRESH" ] && pass "Refresh token received" || fail "Refresh token received"

REF=$(curl -s -X POST "$BASE/v1/auth/refresh" -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}")
echo "$REF" | grep -q '"accessToken"' && pass "Refresh token" || fail "Refresh token"

echo "=== PROPERTIES ==="
PROPS=$(curl -s "$BASE/v2/properties?page=0&size=5")
echo "$PROPS" | grep -q '"content"' && pass "List properties" || fail "List properties"
PROP_ID=$(echo "$PROPS" | py -3 -c "import sys,json; d=json.load(sys.stdin); print(d['content'][0]['id'] if d.get('content') else '')" 2>/dev/null)

SEARCH=$(curl -s "$BASE/v2/properties/search?keyword=casa&page=0&size=5")
echo "$SEARCH" | grep -q '"content"' && pass "Search properties" || fail "Search properties"

DETAIL=$(curl -s "$BASE/v2/properties/$PROP_ID")
echo "$DETAIL" | grep -q '"id"' && pass "Property detail" || fail "Property detail"

CITIES=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties/cities")
echo "$CITIES" | grep -q 'HTTP_CODE:200' && pass "Cities" || fail "Cities"

CATS=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties/categories")
echo "$CATS" | grep -q 'HTTP_CODE:200' && pass "Categories" || fail "Categories"

echo "=== FAVORITES ==="
FAVS=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v1/favorites" -H "Authorization: Bearer $TOKEN")
echo "$FAVS" | grep -q 'HTTP_CODE:200' && pass "List favorites" || fail "List favorites"

echo "=== MESSAGES ==="
CONVS=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v1/messages/conversation?userId=1" -H "Authorization: Bearer $TOKEN")
echo "$CONVS" | grep -q 'HTTP_CODE:200' && pass "Get conversation" || fail "Get conversation"

UNREAD=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v1/messages/unread-count" -H "Authorization: Bearer $TOKEN")
echo "$UNREAD" | grep -q 'HTTP_CODE:200' && pass "Unread count" || fail "Unread count"

SEND=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/v1/messages" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"receiverId":1,"content":"Hello from test"}')
echo "$SEND" | grep -q 'HTTP_CODE:20' && pass "Send message" || fail "Send message"

echo "=== AI SERVICE ==="
AI_H=$(curl -s "$AI_BASE/health")
echo "$AI_H" | grep -q '"status":"healthy"' && pass "AI health" || fail "AI health"

AI_C=$(curl -s -X POST "$AI_BASE/chat" -H "Content-Type: application/json" -d '{"message":"hello"}')
echo "$AI_C" | grep -q '"response"' && pass "AI chat" || fail "AI chat"

AI_S=$(curl -s -X POST "$AI_BASE/search" -H "Content-Type: application/json" -d '{"query":"appartement"}')
echo "$AI_S" | grep -q '"results"' && pass "AI search" || fail "AI search"

AI_R=$(curl -s -X POST "$AI_BASE/recommendations" -H "Content-Type: application/json" -d '{"user_id":"e2e_test","n_results":5}')
echo "$AI_R" | grep -q '"recommendations"' && pass "AI recommendations" || fail "AI recommendations"

echo "=== DOCS & MONITORING ==="
SWAG=$(curl -sL -w "\nHTTP_CODE:%{http_code}" "$BASE/swagger-ui.html")
echo "$SWAG" | grep -q 'HTTP_CODE:200' && pass "Swagger UI" || fail "Swagger UI"

ACT=$(curl -s "$BASE/actuator/health")
echo "$ACT" | grep -q '"status":"UP"' && pass "Actuator health" || fail "Actuator health"

echo "=== LOGOUT ==="
LOGOUT=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/v1/auth/logout" -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}")
echo "$LOGOUT" | grep -q 'HTTP_CODE:204' && pass "Logout" || fail "Logout"

echo ""
echo "===== RESULTS: $PASS passed, $FAIL failed ====="
