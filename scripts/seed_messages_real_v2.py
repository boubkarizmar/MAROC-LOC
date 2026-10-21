#!/usr/bin/env python3
"""Seed real messaging data (v2) using known existing test accounts."""
import json
import requests

BASE = "http://localhost:8081/api"

ACCOUNTS = {
    "admin": {"email": "admin@gmail.com", "password": "Admin@123"},
    "proprio": {"email": "proprio_e2e_20260714@test.local", "password": "TestPass123!"},
    "locataire": {"email": "locataire_e2e_v2_20260714@test.local", "password": "TestPass123!"},
}
PROPERTY_ID = 68


def login(email, password):
    r = requests.post(f"{BASE}/v1/auth/login", json={"email": email, "password": password}, timeout=15)
    r.raise_for_status()
    d = r.json()
    return d["accessToken"], {
        "id": d["userId"],
        "name": d["name"],
        "email": d["email"],
        "role": d["role"],
    }


def send(token, receiver_id, content, property_id=None):
    payload = {"receiverId": receiver_id, "content": content}
    if property_id:
        payload["propertyId"] = property_id
    r = requests.post(
        f"{BASE}/v1/messages",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def conversations(token):
    r = requests.get(f"{BASE}/v1/messages/conversations", headers={"Authorization": f"Bearer {token}"}, timeout=15)
    r.raise_for_status()
    return r.json()


def conversation(token, partner_id, sort="ASC", size=100):
    r = requests.get(
        f"{BASE}/v1/messages/conversation",
        params={"userId": partner_id, "sort": sort, "size": size},
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def main():
    sessions = {}
    for role, creds in ACCOUNTS.items():
        token, user = login(creds["email"], creds["password"])
        sessions[role] = {"token": token, "user": user}
        print(f"{role}: id={user['id']} name={user['name']}")

    a_tok = sessions["admin"]["token"]
    p_tok = sessions["proprio"]["token"]
    l_tok = sessions["locataire"]["token"]
    a_id = sessions["admin"]["user"]["id"]
    p_id = sessions["proprio"]["user"]["id"]
    l_id = sessions["locataire"]["user"]["id"]

    # Admin <-> Propriétaire (with property context)
    send(a_tok, p_id, "Bonjour propriétaire, j'ai une question sur le bien.", PROPERTY_ID)
    send(p_tok, a_id, "Bonjour admin, je vous écoute.", PROPERTY_ID)
    send(a_tok, p_id, "Est-il toujours disponible ?", PROPERTY_ID)
    send(p_tok, a_id, "Oui, toujours disponible.", PROPERTY_ID)

    # Admin <-> Locataire
    send(a_tok, l_id, "Bonjour locataire, votre dossier est en cours.")
    send(l_tok, a_id, "Merci admin, je transmets les documents.")
    send(a_tok, l_id, "Parfait, je reviens vers vous rapidement.")

    # Propriétaire <-> Locataire
    send(p_tok, l_id, "Bonjour, le studio vous intéresse toujours ?", PROPERTY_ID)
    send(l_tok, p_id, "Oui, puis-je visiter demain ?", PROPERTY_ID)
    send(p_tok, l_id, "Demain à 14h convient ?", PROPERTY_ID)
    send(l_tok, p_id, "C'est parfait, merci.", PROPERTY_ID)

    state = {}
    for role, sess in sessions.items():
        convs = conversations(sess["token"])
        state[role] = {"user": sess["user"], "conversations": convs}
        for c in convs:
            partner_id = c["partnerId"]
            state[role][f"messages_with_{partner_id}"] = conversation(sess["token"], partner_id)

    path = "test_results/messaging_seed_state.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)
    print(f"\nSeed complete. State saved to {path}")


if __name__ == "__main__":
    main()
