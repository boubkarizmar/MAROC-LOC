#!/usr/bin/env python3
"""Fetch current messaging state from backend for all test users."""
import json
import urllib.request
import urllib.error

BASE = "http://localhost:8081/api"
USERS = {
    "admin": {"email": "admin@gmail.com", "password": "Admin@123"},
    "proprio": {"email": "proprio_e2e_20260714@test.local", "password": "TestPass123!"},
    "locataire": {"email": "locataire_e2e_v2_20260714@test.local", "password": "TestPass123!"},
}


def call(method, path, token=None, data=None):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(data).encode() if data else None,
        headers={"Content-Type": "application/json"},
        method=method,
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def login(email, password):
    data = call("POST", "/v1/auth/login", data={"email": email, "password": password})
    return data["accessToken"], {
        "id": data["userId"],
        "name": data["name"],
        "email": data["email"],
        "role": data["role"],
    }


def main():
    state = {}
    for role, creds in USERS.items():
        token, user = login(creds["email"], creds["password"])
        conversations = call("GET", "/v1/messages/conversations", token=token)
        messages_by_partner = {}
        for conv in conversations:
            partner_id = conv["partnerId"]
            msgs = call(
                "GET",
                f"/v1/messages/conversation?userId={partner_id}&page=0&size=50&sort=DESC",
                token=token,
            )
            messages_by_partner[str(partner_id)] = msgs
        unread = call("GET", "/v1/messages/unread-count", token=token)
        state[role] = {"user": user, "conversations": conversations, "messages": messages_by_partner, "unreadCount": unread}
    with open("test_results/messaging_runtime_state.json", "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)
    print("Saved test_results/messaging_runtime_state.json")


if __name__ == "__main__":
    main()
