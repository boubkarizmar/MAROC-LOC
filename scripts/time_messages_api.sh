#!/usr/bin/env bash
set -e
BASE=http://localhost:8081/api
login() {
  curl -s -X POST $BASE/v1/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$1\",\"password\":\"$2\"}" -o /tmp/login.json
  sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p' /tmp/login.json
}
time_call() {
  curl -s -o /tmp/resp.json -w "%{time_total}" "$@"
}
A=$(login admin@gmail.com Admin@123)
P=$(login proprio_e2e_20260714@test.local TestPass123!)
L=$(login locataire_e2e_v2_20260714@test.local TestPass123!)
echo "Admin token OK"
echo "Conversations admin: $(time_call -H "Authorization: Bearer $A" $BASE/v1/messages/conversations)s"
echo "Conversation admin-proprio: $(time_call -H "Authorization: Bearer $A" "$BASE/v1/messages/conversation?userId=68&page=0&size=20&sort=DESC")s"
echo "Unread admin: $(time_call -H "Authorization: Bearer $A" $BASE/v1/messages/unread-count)s"
echo "Conversation proprio-locataire: $(time_call -H "Authorization: Bearer $P" "$BASE/v1/messages/conversation?userId=69&page=0&size=20&sort=DESC")s"
echo "Conversation locataire-admin: $(time_call -H "Authorization: Bearer $L" "$BASE/v1/messages/conversation?userId=21&page=0&size=20&sort=DESC")s"
