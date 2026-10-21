#!/bin/bash
BASE="http://localhost:8080/api"
AI_BASE="http://localhost:8000"
PASS=0
FAIL=0

pass() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

# 1. Register
echo "--- AUTH: REGISTER ---"
REG=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/v1/auth/register" -H "Content-Type: application/json" \
  -d '{"firstName":"Jean","lastName":"Test","fullName":"Jean Test","city":"Casablanca","phone":"+212611111111","email":"e2e_test@marocloc.com","password":"E2ePass123!","role":"LOCATAIRE"}' 2>&1)
if echo "$REG" | grep -q '"accessToken"'; then
  pass "Register/login existing user"
  ACCESS=$(echo "$REG" | sed 's/HTTP_CODE:.*//' | py -3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
  REFRESH=$(echo "$REG" | sed 's/HTTP_CODE:.*//' | py -3 -c "import sys,json; print(json.load(sys.stdin)['refreshToken'])" 2>/dev/null)
  USER_ID=$(echo "$REG" | sed 's/HTTP_CODE:.*//' | py -3 -c "import sys,json; print(json.load(sys.stdin)['userId'])" 2>/dev/null)
else
  fail "Register: $(echo "$REG" | grep HTTP_CODE)"
fi

# 2. Login
echo "--- AUTH: LOGIN ---"
if [ -z "$ACCESS" ]; then
  LOGIN=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/v1/auth/login" -H "Content-Type: application/json" \
    -d '{"email":"e2e_test@marocloc.com","password":"E2ePass123!"}' 2>&1)
  if echo "$LOGIN" | grep -q '"accessToken"'; then
    pass "Login"
    ACCESS=$(echo "$LOGIN" | sed 's/HTTP_CODE:.*//' | py -3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
    REFRESH=$(echo "$LOGIN" | sed 's/HTTP_CODE:.*//' | py -3 -c "import sys,json; print(json.load(sys.stdin)['refreshToken'])" 2>/dev/null)
    USER_ID=$(echo "$LOGIN" | sed 's/HTTP_CODE:.*//' | py -3 -c "import sys,json; print(json.load(sys.stdin)['userId'])" 2>/dev/null)
  else
    fail "Login: $(echo "$LOGIN" | grep HTTP_CODE)"
  fi
else
  pass "Login (from register)"
fi

# 3. Me
echo "--- AUTH: ME ---"
if [ -n "$ACCESS" ]; then
  ME=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v1/users/me" -H "Authorization: Bearer $ACCESS" 2>&1)
  if echo "$ME" | grep -q '"email"'; then
    pass "Get current user"
  else
    fail "Get current user: $(echo "$ME" | grep HTTP_CODE)"
  fi
else
  fail "Get current user (no token)"
fi

# 4. Refresh
echo "--- AUTH: REFRESH ---"
if [ -n "$REFRESH" ]; then
  REF=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/v1/auth/refresh" -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$REFRESH\"}" 2>&1)
  if echo "$REF" | grep -q '"accessToken"'; then
    pass "Refresh token"
    ACCESS=$(echo "$REF" | sed 's/HTTP_CODE:.*//' | py -3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
  else
    fail "Refresh token: $(echo "$REF" | grep HTTP_CODE)"
  fi
else
  fail "Refresh token (no refresh token)"
fi

# 5. Properties
echo "--- PROPERTY: LIST ---"
PROPS=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties?page=0&size=5" 2>&1)
if echo "$PROPS" | grep -q '"content"'; then
  pass "List properties"
  PROP_ID=$(echo "$PROPS" | sed 's/HTTP_CODE:.*//' | py -3 -c "import sys,json; d=json.load(sys.stdin); print(d['content'][0]['id'] if d.get('content') else '')" 2>/dev/null)
else
  fail "List properties: $(echo "$PROPS" | grep HTTP_CODE)"
fi

# 6. Search
echo "--- PROPERTY: SEARCH ---"
SEARCH=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties/search?keyword=casa&page=0&size=5" 2>&1)
if echo "$SEARCH" | grep -q '"content"'; then
  pass "Search properties"
else
  fail "Search properties: $(echo "$SEARCH" | grep HTTP_CODE)"
fi

# 7. Categories
echo "--- PROPERTY: CATEGORIES ---"
CATS=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties/categories" 2>&1)
if echo "$CATS" | grep -q 'HTTP_CODE:200'; then
  pass "Get categories"
else
  fail "Get categories: $(echo "$CATS" | grep HTTP_CODE)"
fi

# 8. Cities
echo "--- PROPERTY: CITIES ---"
CITIES=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties/cities" 2>&1)
if echo "$CITIES" | grep -q 'HTTP_CODE:200'; then
  pass "Get cities"
else
  fail "Get cities: $(echo "$CITIES" | grep HTTP_CODE)"
fi

# 9. Property detail
echo "--- PROPERTY: DETAIL ---"
if [ -n "$PROP_ID" ]; then
  DETAIL=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v2/properties/$PROP_ID" 2>&1)
  if echo "$DETAIL" | grep -q '"id"'; then
    pass "Get property detail"
  else
    fail "Get property detail: $(echo "$DETAIL" | grep HTTP_CODE)"
  fi
else
  fail "Get property detail (no property ID)"
fi

# 10. Favorites
echo "--- FAVORITES ---"
if [ -n "$ACCESS" ]; then
  FAVS=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v1/favorites" -H "Authorization: Bearer $ACCESS" 2>&1)
  if echo "$FAVS" | grep -q 'HTTP_CODE:200'; then
    pass "List favorites"
  else
    fail "List favorites: $(echo "$FAVS" | grep HTTP_CODE)"
  fi

  if [ -n "$PROP_ID" ]; then
    FAV_ADD=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/v1/favorites/$PROP_ID" -H "Authorization: Bearer $ACCESS" 2>&1)
    if echo "$FAV_ADD" | grep -q 'HTTP_CODE:20'; then
      pass "Add favorite"
    else
      fail "Add favorite: $(echo "$FAV_ADD" | grep HTTP_CODE)"
    fi
  fi
else
  fail "Favorites (no token)"
fi

# 11. Messages
echo "--- MESSAGING ---"
if [ -n "$ACCESS" ]; then
  CONVS=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/v1/messages/conversations" -H "Authorization: Bearer $ACCESS" 2>&1)
  if echo "$CONVS" | grep -q 'HTTP_CODE:200'; then
    pass "List conversations"
  else
    fail "List conversations: $(echo "$CONVS" | grep HTTP_CODE)"
  fi
else
  fail "Messages (no token)"
fi

# 12. AI Health
echo "--- AI: HEALTH ---"
AI_HEALTH=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$AI_BASE/health" 2>&1)
if echo "$AI_HEALTH" | grep -q '"status":"healthy"'; then
  pass "AI health"
else
  fail "AI health: $(echo "$AI_HEALTH" | grep HTTP_CODE)"
fi

# 13. AI Chat
echo "--- AI: CHAT ---"
AI_CHAT=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$AI_BASE/chat" -H "Content-Type: application/json" \
  -d '{"message":"Bonjour, cherche un appartement à Casablanca","sessionId":"test_session"}' 2>&1)
if echo "$AI_CHAT" | grep -q 'HTTP_CODE:200'; then
  pass "AI chat"
else
  fail "AI chat: $(echo "$AI_CHAT" | grep HTTP_CODE)"
fi

# 14. AI Search
echo "--- AI: SEARCH ---"
AI_SEARCH=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$AI_BASE/search" -H "Content-Type: application/json" \
  -d '{"query":"appartement casablanca"}' 2>&1)
if echo "$AI_SEARCH" | grep -q 'HTTP_CODE:200'; then
  pass "AI search"
else
  fail "AI search: $(echo "$AI_SEARCH" | grep HTTP_CODE)"
fi

# 15. AI Recommendations
echo "--- AI: RECOMMENDATIONS ---"
AI_REC=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$AI_BASE/recommendations" -H "Content-Type: application/json" \
  -d '{"user_id":"e2e_test","n_results":5}' 2>&1)
if echo "$AI_REC" | grep -q 'HTTP_CODE:200'; then
  pass "AI recommendations"
else
  fail "AI recommendations: $(echo "$AI_REC" | grep HTTP_CODE)"
fi

# 16. Actuator
echo "--- ACTUATOR ---"
ACT=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/actuator/health" 2>&1)
if echo "$ACT" | grep -q '"status":"UP"'; then
  pass "Actuator health"
else
  fail "Actuator health: $(echo "$ACT" | grep HTTP_CODE)"
fi

# 17. Logout
echo "--- AUTH: LOGOUT ---"
if [ -n "$REFRESH" ]; then
  LOGOUT=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/v1/auth/logout" -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$REFRESH\"}" 2>&1)
  if echo "$LOGOUT" | grep -q 'HTTP_CODE:204'; then
    pass "Logout"
  elif echo "$LOGOUT" | grep -q 'HTTP_CODE:200'; then
    pass "Logout"
  else
    fail "Logout: $(echo "$LOGOUT" | grep HTTP_CODE)"
  fi
else
  fail "Logout (no refresh token)"
fi

echo ""
echo "===== RESULTS: $PASS passed, $FAIL failed ====="
