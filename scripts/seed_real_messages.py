#!/usr/bin/env python3
"""Seed real messaging data against the running Spring Boot backend."""
import json
import requests

BASE = "http://localhost:8081/api"

ADMIN = {"email": "admin@gmail.com", "password": "Admin@123"}
PROPRIO = {
    "email": "proprio_e2e_20260714@test.local",
    "password": "TestPass123!",
    "firstName": "Karim",
    "lastName": "E2E",
    "fullName": "Karim Test Proprio",
    "city": "Casablanca",
    "phone": "+212612345678",
    "role": "PROPRIETAIRE",
}
LOCATAIRE = {
    "email": "locataire_e2e_v2_20260714@test.local",
    "password": "TestPass123!",
    "firstName": "Amina",
    "lastName": "E2E",
    "fullName": "Amina Test Locataire",
    "city": "Rabat",
    "phone": "+212612345679",
    "role": "LOCATAIRE",
}

PROPERTY_ID = 68  # context property


def login(email, password):
    r = requests.post(f"{BASE}/v1/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    data = r.json()
    return data["accessToken"], {
        "id": data["userId"],
        "name": data["name"],
        "email": data["email"],
        "role": data["role"],
    }


def register_or_login(profile):
    try:
        return login(profile["email"], profile["password"])
    except requests.HTTPError as e:
        if e.response.status_code == 401:
            # User may exist with a different password; attempt registration
            payload = {
                "firstName": profile["firstName"],
                "lastName": profile["lastName"],
                "fullName": profile["fullName"],
                "city": profile["city"],
                "phone": profile["phone"],
                "email": profile["email"],
                "password": profile["password"],
                "role": profile["role"],
            }
            r = requests.post(f"{BASE}/v1/auth/register", json=payload)
            r.raise_for_status()
            data = r.json()
            return data["accessToken"], {
                "id": data["userId"],
                "name": data["name"],
                "email": data["email"],
                "role": data["role"],
            }
        raise


def send(token, receiver_id, content, property_id=None):
    payload = {"receiverId": receiver_id, "content": content}
    if property_id:
        payload["propertyId"] = property_id
    r = requests.post(
        f"{BASE}/v1/messages",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    return r.json()


def conversations(token):
    r = requests.get(
        f"{BASE}/v1/messages/conversations",
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    return r.json()


def conversation(token, partner_id, sort="DESC", size=20):
    r = requests.get(
        f"{BASE}/v1/messages/conversation",
        params={"userId": partner_id, "sort": sort, "size": size},
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    return r.json()


def main():
    admin_token, admin_user = login(ADMIN["email"], ADMIN["password"])
    proprio_token, proprio_user = register_or_login(PROPRIO)
    loc_token, loc_user = register_or_login(LOCATAIRE)

    sessions = {
        "admin": {"token": admin_token, "user": admin_user},
        "proprio": {"token": proprio_token, "user": proprio_user},
        "locataire": {"token": loc_token, "user": loc_user},
    }
    for role, s in sessions.items():
        u = s["user"]
        print(f"{role}: id={u['id']} name={u['name']} email={u['email']} role={u['role']}")

    a = sessions["admin"]["token"]
    p = sessions["proprio"]["token"]
    l = sessions["locataire"]["token"]
    aid = sessions["admin"]["user"]["id"]
    pid = sessions["proprio"]["user"]["id"]
    lid = sessions["locataire"]["user"]["id"]

    # Admin <-> Proprietaire
    send(a, pid, "Bonjour propriétaire, j'ai une question sur le bien.", PROPERTY_ID)
    send(p, aid, "Bonjour admin, je vous écoute.", PROPERTY_ID)
    send(a, pid, "Est-il toujours disponible ?", PROPERTY_ID)
    send(p, aid, "Oui, toujours disponible.", PROPERTY_ID)

    # Admin <-> Locataire
    send(a, lid, "Bonjour locataire, votre dossier est en cours.")
    send(l, aid, "Merci admin, je transmets les documents.")
    send(a, lid, "Parfait, je reviens vers vous rapidement.")

    # Proprietaire <-> Locataire
    send(p, lid, "Bonjour, le studio vous intéresse toujours ?", PROPERTY_ID)
    send(l, pid, "Oui, puis-je visiter demain ?", PROPERTY_ID)
    send(p, lid, "Demain à 14h convient ?", PROPERTY_ID)
    send(l, pid, "C'est parfait, merci.", PROPERTY_ID)

    # Read back conversations for each role
    state = {}
    for role, sess in sessions.items():
        convs = conversations(sess["token"])
        state[role] = {
            "user": sess["user"],
            "conversations": convs,
        }
        for c in convs:
            partner_id = c["partnerId"]
            msgs = conversation(sess["token"], partner_id, sort="ASC", size=100)
            state[role][f"messages_with_{partner_id}"] = msgs

    with open("/tmp/messaging_seed_state.json", "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

    print("\nSeed complete. State written to /tmp/messaging_seed_state.json")


if __name__ == "__main__":
    main()
