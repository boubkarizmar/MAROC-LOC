import os
#!/usr/bin/env python3
"""Simulate a Stripe checkout.session.completed webhook for local E2E testing."""
import json
import hmac
import hashlib
import time
import requests
import stripe
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
BACKEND_WEBHOOK_URL = "http://localhost:8080/api/v1/ads/stripe/webhook"
SESSION_ID = "cs_test_a1QwvV3of89sVU6SXrLwDcE55tKBCymdUOs7gYfj0qBVAgmMZyXXa5BCML"


def sign_payload(payload: str, secret: str, timestamp: int) -> str:
    signed_payload = f"{timestamp}.{payload}"
    mac = hmac.new(secret.encode("utf-8"), signed_payload.encode("utf-8"), hashlib.sha256)
    return mac.hexdigest()


def main():
    if not STRIPE_SECRET_KEY or not WEBHOOK_SECRET:
        raise SystemExit(
            "Missing STRIPE_SECRET_KEY or WEBHOOK_SECRET environment variable."
        )
    stripe.api_key = STRIPE_SECRET_KEY
    session = stripe.checkout.Session.retrieve(SESSION_ID)
    session_dict = session._to_dict_recursive()

    event = {
        "id": "evt_test_simulated_e2e",
        "object": "event",
        "api_version": "2024-06-20",
        "created": int(time.time()),
        "livemode": False,
        "pending_webhooks": 1,
        "request": {"id": None, "idempotency_key": None},
        "type": "checkout.session.completed",
        "data": {"object": session_dict},
    }
    payload = json.dumps(event, separators=(",", ":"))
    timestamp = int(time.time())
    signature = sign_payload(payload, WEBHOOK_SECRET, timestamp)
    sig_header = f"t={timestamp},v1={signature}"

    print(f"POST {BACKEND_WEBHOOK_URL}")
    print(f"Stripe-Signature: {sig_header}")
    response = requests.post(
        BACKEND_WEBHOOK_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Stripe-Signature": sig_header,
        },
    )
    print(f"Response status: {response.status_code}")
    print(response.text)


if __name__ == "__main__":
    main()
