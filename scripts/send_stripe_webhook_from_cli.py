#!/usr/bin/env python3
import os
"""Resend a real Stripe checkout.session.completed event to the local backend,
substituting the metadata so the saga/advertisement created during E2E is advanced."""
import json
import hmac
import hashlib
import time
import requests

WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
BACKEND_WEBHOOK_URL = "http://localhost:8080/api/v1/ads/stripe/webhook"
EVENT_FILE = r"C:\Users\HP\AppData\Local\Temp\stripe_event.json"
CORRELATION_ID = "STRIPE-920cbb70-6a19-4dc5-8a97-a89e94942f6c"
ADVERTISEMENT_ID = "39"


def sign_payload(payload: str, secret: str, timestamp: int) -> str:
    signed_payload = f"{timestamp}.{payload}"
    mac = hmac.new(secret.encode("utf-8"), signed_payload.encode("utf-8"), hashlib.sha256)
    return mac.hexdigest()


def main():
    if not WEBHOOK_SECRET:
        raise SystemExit(
            "Missing STRIPE_WEBHOOK_SECRET environment variable."
        )
    with open(EVENT_FILE, "r", encoding="utf-8") as f:
        event = json.load(f)

    # Ensure the event type is a completed checkout session
    event["type"] = "checkout.session.completed"
    session = event["data"]["object"]
    session["metadata"] = {
        "advertisementId": ADVERTISEMENT_ID,
        "correlationId": CORRELATION_ID,
        "plan": "BOOST_BASIC",
    }

    payload = json.dumps(event, separators=(",", ":"))
    timestamp = int(time.time())
    signature = sign_payload(payload, WEBHOOK_SECRET, timestamp)
    sig_header = f"t={timestamp},v1={signature}"

    print(f"POST {BACKEND_WEBHOOK_URL}")
    response = requests.post(
        BACKEND_WEBHOOK_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Stripe-Signature": sig_header,
        },
    )
    print(f"Status: {response.status_code}")
    print(response.text)


if __name__ == "__main__":
    main()
