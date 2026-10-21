#!/bin/bash
BASE="http://localhost:8080/api"
AI_BASE="http://localhost:8000"
PASS=0
FAIL=0

pass() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

# Get token once
TOKEN=$(curl -s -X POST "$BASE/v1/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"e2e_test@marocloc.com","password":"E2ePass123!"}' | py -3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
REFRESH=$(curl -s -X POST "$BASE/v1/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"e2e_test@marocloc.com","password":"E2ePass123!"}' | py -3 -c "import sys,json; print(json.load(sys.stdin)['refreshToken'])" 2>/dev/null)

echo "--- AUTH: LOGIN ---"
[ -n "$TOKEN" ] && pass "Login" || fail "Login"

# 1. Register (expect 409 since user exists)
echo "--- AUTH: REGISTER ---"
REG=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/v1/auth/register" -H "Content-Type: application/json" \
  -d '{"firstName":"Jean","lastName":"Test","fullName":"Jean Test","city":"Casablanca","phone":"+212611111111","email":"e2e_test@marocloc.com","password":"E2ePass123!","role":"LOCATAIRE"}' 2>&1)
if echo "$REG" | grep -q 'HTTP_CODE:409'; then
  pass "Register (user already exists - expected)"
else
  fail "Register: unexpected $(echo "$REG" | grep HTTP_CODE)"
fi

# 2. Refresh
echo "--- AUTH: REFRESH ---"
if [ -n "$REFRESH" ]; then
  REF=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/v1/auth/refresh" -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$REFRESH\"}" 2>&1)
  echo "$REF" | grep -q '"accessToken"' && pass "Refresh token" || fail "Refresh token"
else
  fail "Refresh token (no refresh token)"
fi

# 3. Property list
echo "--- PROPERTY: LIST ---"
PROPS=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties?page=0&size=5" 2>&1)
if echo "$PROPS" | grep -q '"content"'; then
  pass "List properties"
  PROP_ID=$(echo "$PROPS" | sed 's/HTTP_CODE:.*//' | py -3 -c "import sys,json; d=json.load(sys.stdin); print(d['content'][0]['id'] if d.get('content') else '')" 2>/dev/null)
else
  fail "List properties"
fi

# 4. Property search
echo "--- PROPERTY: SEARCH ---"
SEARCH=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties/search?keyword=casa&page=0&size=5" 2>&1)
echo "$SEARCH" | grep -q '"content"' && pass "Search properties" || fail "Search properties"

# 5. Categories
echo "--- PROPERTY: CATEGORIES ---"
CATS=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties/categories" 2>&1)
echo "$CATS" | grep -q 'HTTP_CODE:200' && pass "Get categories" || fail "Get categories"

# 6. Cities
echo "--- PROPERTY: CITIES ---"
CITIES=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties/cities" 2>&1)
echo "$CITIES" | grep -q 'HTTP_CODE:200' && pass "Get cities" || fail "Get cities"

# 7. Property detail
echo "--- PROPERTY: DETAIL ---"
if [ -n "$PROP_ID" ]; then
  DETAIL=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties/$PROP_ID" 2>&1)
  echo "$DETAIL" | grep -q '"id"' && pass "Get property detail" || fail "Get property detail"
else
  fail "Get property detail (no property ID)"
fi

# 8. Favorites
echo "--- FAVORITES ---"
if [ -n "$TOKEN" ]; then
  FAVS=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v1/favorites" -H "Authorization: Bearer $TOKEN" 2>&1)
  echo "$FAVS" | grep -q 'HTTP_CODE:200' && pass "List favorites" || fail "List favorites"

  if [ -n "$PROP_ID" ]; then
    FAV_ADD=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/v1/favorites/$PROP_ID" -H "Authorization: Bearer $TOKEN" 2>&1)
    echo "$FAV_ADD" | grep -q 'HTTP_CODE:20' && pass "Add favorite" || fail "Add favorite"
  fi
else
  fail "Favorites (no token)"
fi

# 9. Messages
echo "--- MESSAGING ---"
if [ -n "$TOKEN" ]; then
  CONVS=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v1/messages/conversation?userId=1" -H "Authorization: Bearer $TOKEN" 2>&1)
  echo "$CONVS" | grep -q 'HTTP_CODE:200' && pass "Get conversation" || fail "Get conversation"

  UNREAD=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v1/messages/unread-count" -H "Authorization: Bearer $TOKEN" 2>&1)
  echo "$UNREAD" | grep -q 'HTTP_CODE:200' && pass "Unread count" || fail "Unread count"
else
  fail "Messages (no token)"
fi

# 10. AI Health
echo "--- AI: HEALTH ---"
AI_HEALTH=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$AI_BASE/health" 2>&1)
echo "$AI_HEALTH" | grep -q '"status":"healthy"' && pass "AI health" || fail "AI health"

# 11. AI Chat
echo "--- AI: CHAT ---"
AI_CHAT=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$AI_BASE/chat" -H "Content-Type: application/json" \
  -d '{"message":"hello"}' 2>&1)
echo "$AI_CHAT" | grep -q 'HTTP_CODE:200' && pass "AI chat" || fail "AI chat"

# 12. AI Search
echo "--- AI: SEARCH ---"
AI_SEARCH=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$AI_BASE/search" -H "Content-Type: application/json" \
  -d '{"query":"appartement"}' 2>&1)
echo "$AI_SEARCH" | grep -q 'HTTP_CODE:200' && pass "AI search" || fail "AI search"

# 13. AI Recommendations
echo "--- AI: RECOMMENDATIONS ---"
AI_REC=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$AI_BASE/recommendations" -H "Content-Type: application/json" \
  -d '{"user_id":"e2e_test","n_results":5}' 2>&1)
echo "$AI_REC" | grep -q 'HTTP_CODE:200' && pass "AI recommendations" || fail "AI recommendations"

# 14. Actuator
echo "--- ACTUATOR ---"
ACT=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/actuator/health" 2>&1)
echo "$ACT" | grep -q '"status":"UP"' && pass "Actuator health" || fail "Actuator health"

# 15. Logout
echo "--- AUTH: LOGOUT ---"
if [ -n "$REFRESH" ]; then
  LOGOUT=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/v1/auth/logout" -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$REFRESH\"}" 2>&1)
  echo "$LOGOUT" | grep -q 'HTTP_CODE:204' && pass "Logout" || fail "Logout"
else
  fail "Logout (no refresh token)"
fi

echo ""
echo "===== RESULTS: $PASS passed, $FAIL failed ====="
