#!/usr/bin/env python3
"""Audit CMI payment flow end-to-end (backend)."""
import json
import urllib.request
import urllib.parse
import urllib.error
import sys

BASE = "http://localhost:8080/api"
EMAIL = "testowner@example.com"
PASSWORD = "Password123!"


def request(method, path, data=None, token=None, query=None):
    url = BASE + path
    if query:
        url += "?" + urllib.parse.urlencode(query)
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body}


def login():
    code, resp = request("POST", "/v1/auth/login", {"email": EMAIL, "password": PASSWORD})
    if code != 200:
        print("LOGIN FAILED", code, resp)
        sys.exit(1)
    return resp["accessToken"]


def create_property(token):
    payload = {
        "title": "Appartement test audit CMI " + str(hash(token) % 10000),
        "description": "Ceci est une description de test pour l'audit CMI. Elle fait plus de cinquante caractères pour satisfaire la validation.",
        "price": 1500,
        "city": "Rabat",
        "address": "Avenue Hassan II",
        "type": "RENT",
        "category": "APARTMENT",
        "surface": 80,
        "rooms": 3,
        "bedrooms": 2,
        "bathrooms": 1,
        "floorNumber": 2,
        "totalFloors": 5,
        "buildingAge": 5,
        "latitude": 34.020882,
        "longitude": -6.841650,
    }
    code, resp = request("POST", "/v2/properties/json", payload, token)
    if code not in (200, 201):
        print("CREATE PROPERTY FAILED", code, resp)
        sys.exit(1)
    return resp["id"]


def create_ad_request(token, property_id):
    payload = {
        "title": "Annonce test audit CMI " + str(property_id),
        "description": "Annonce publicitaire de test pour valider le paiement CMI.",
        "type": "FEATURED_PROPERTY",
        "plan": "BOOST_BASIC",
        "propertyIds": [property_id],
        "propertyId": property_id,
        "budget": 500,
        "startDate": "2026-07-01",
        "endDate": "2026-07-31",
        "currency": "MAD",
    }
    code, resp = request("POST", "/v1/ads/requests", payload, token)
    if code not in (200, 201):
        print("CREATE AD FAILED", code, resp)
        sys.exit(1)
    return resp["id"]


def initiate_cmi(token, order_id, advertisement_id):
    payload = {
        "orderId": order_id,
        "amount": 500.0,
        "currency": "504",
        "lang": "fr",
        "email": EMAIL,
        "advertisementId": advertisement_id,
    }
    code, resp = request("POST", "/v1/payments/cmi/initiate", payload, token)
    if code != 200:
        print("INITIATE FAILED", code, resp)
        return None
    return resp.get("data", resp)


def callback(path, params):
    # The backend callback is POST with all params as query/form.
    code, resp = request("POST", path, query=params)
    return code, resp


def get_payment_status(token, order_id):
    code, resp = request("GET", "/v1/payments/status", token=token, query={"orderId": order_id})
    return code, resp


def get_ad(token, ad_id):
    code, resp = request("GET", f"/v1/ads/{ad_id}", token=token)
    return code, resp


def run_scenario(token, name, ad_id, order_id, callback_path, extra_params=None):
    print(f"\n=== SCENARIO: {name} ===")
    params = initiate_cmi(token, order_id, ad_id)
    if params is None:
        return False
    print("Initiate OK -> hash present:", bool(params.get("hash")))

    callback_params = dict(params)
    if extra_params:
        callback_params.update(extra_params)
    code, resp = callback(callback_path, callback_params)
    print("Callback HTTP:", code, "->", resp.get("status") if isinstance(resp, dict) else resp)

    code, status_resp = get_payment_status(token, order_id)
    data = status_resp.get("data", status_resp) if isinstance(status_resp, dict) else status_resp
    print("Payment status:", data.get("status"))

    code, ad_resp = get_ad(token, ad_id)
    ad_data = ad_resp.get("data", ad_resp) if isinstance(ad_resp, dict) else ad_resp
    print("Ad status:", ad_data.get("status"), "| paymentStatus:", ad_data.get("paymentStatus"))

    return True


def main():
    token = login()
    print("Logged in as", EMAIL)

    # SUCCESS
    prop1 = create_property(token)
    ad1 = create_ad_request(token, prop1)
    run_scenario(token, "SUCCESS", ad1, "CMI-SUCCESS-001", "/v1/payments/cmi/callback/success")

    # FAILURE
    prop2 = create_property(token)
    ad2 = create_ad_request(token, prop2)
    run_scenario(
        token,
        "FAILURE",
        ad2,
        "CMI-FAILURE-001",
        "/v1/payments/cmi/callback/fail",
        {"ErrorCode": "99", "ErrorMessage": "User declined payment"},
    )

    # CANCEL (mapped to FAILED by backend)
    prop3 = create_property(token)
    ad3 = create_ad_request(token, prop3)
    run_scenario(
        token,
        "CANCEL",
        ad3,
        "CMI-CANCEL-001",
        "/v1/payments/cmi/callback/fail",
        {"ErrorCode": "77", "ErrorMessage": "User cancelled payment"},
    )


if __name__ == "__main__":
    main()
