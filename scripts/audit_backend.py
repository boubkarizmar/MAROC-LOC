#!/usr/bin/env python3
"""
Audit complet du backend MAROC-LOC
Tests reels sur tous les endpoints REST
"""
import requests
import json
import sys
import time
from datetime import datetime

BASE_URL = "http://localhost:8080/api"
ACTUATOR_URL = "http://localhost:8080/actuator"
RESULTS = []

def log_test(name, status, detail="", endpoint=""):
    RESULTS.append({
        "name": name,
        "status": status,
        "detail": detail,
        "endpoint": endpoint,
        "time": datetime.now().isoformat()
    })
    icon = "[OK]" if status == "PASS" else "[KO]" if status == "FAIL" else "[WARN]"
    print(f"{icon} {name}: {status}")
    if detail:
        print(f"    -> {detail}")

def test_health():
    # Use public cities endpoint as health indicator (actuator not installed)
    try:
        r = requests.get(f"{BASE_URL}/v2/properties/cities", timeout=5)
        if r.status_code == 200:
            log_test("Health Check", "PASS", f"Backend responding: {r.status_code}", "/v2/properties/cities")
        else:
            log_test("Health Check", "FAIL", f"Unexpected status: {r.status_code}", "/v2/properties/cities")
    except Exception as e:
        log_test("Health Check", "FAIL", str(e), "/v2/properties/cities")

def test_auth_flow():
    """Test register + login"""
    timestamp = int(time.time())
    email = f"audit_{timestamp}@test.com"
    password = "TestPassword123!"

    # Register
    try:
        r = requests.post(f"{BASE_URL}/v1/auth/register", json={
            "email": email,
            "password": password,
            "firstName": "Audit",
            "lastName": "Test",
            "fullName": "Audit Test",
            "phone": "+212600000000",
            "role": "LOCATAIRE",
            "city": "Casablanca"
        }, timeout=10)
        if r.status_code in [200, 201]:
            log_test("Auth - Register", "PASS", f"User created: {email}", "/v1/auth/register")
        else:
            log_test("Auth - Register", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/v1/auth/register")
            return None
    except Exception as e:
        log_test("Auth - Register", "FAIL", str(e), "/v1/auth/register")
        return None

    # Login
    try:
        r = requests.post(f"{BASE_URL}/v1/auth/login", json={
            "email": email,
            "password": password
        }, timeout=10)
        if r.status_code == 200:
            data = r.json()
            token = data.get("data", {}).get("accessToken") or data.get("accessToken")
            log_test("Auth - Login", "PASS", f"Token received: {bool(token)}", "/v1/auth/login")
            return token
        else:
            log_test("Auth - Login", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/v1/auth/login")
            return None
    except Exception as e:
        log_test("Auth - Login", "FAIL", str(e), "/v1/auth/login")
        return None

def test_properties_search(token):
    headers = {"Authorization": f"Bearer {token}"}

    tests = [
        ("Search - No filters", f"{BASE_URL}/v2/properties/search", {}),
        ("Search - By city", f"{BASE_URL}/v2/properties/search", {"city": "Casablanca"}),
        ("Search - By keyword", f"{BASE_URL}/v2/properties/search", {"keyword": "appartement"}),
        ("Search - By type", f"{BASE_URL}/v2/properties/search", {"type": "RENT"}),
        ("Search - By price range", f"{BASE_URL}/v2/properties/search", {"minPrice": 1000, "maxPrice": 5000}),
        ("Search - Combined filters", f"{BASE_URL}/v2/properties/search", {
            "city": "Casablanca", "type": "RENT", "minPrice": 1000, "keyword": "villa"
        }),
    ]

    for name, url, params in tests:
        try:
            r = requests.get(url, headers=headers, params=params, timeout=10)
            if r.status_code == 200:
                data = r.json()
                count = 0
                if isinstance(data.get("data"), dict):
                    count = len(data.get("data", {}).get("content", []))
                log_test(name, "PASS", f"Found {count} properties", url.replace(BASE_URL, ""))
            else:
                log_test(name, "FAIL", f"Status {r.status_code}: {r.text[:200]}", url.replace(BASE_URL, ""))
        except Exception as e:
            log_test(name, "FAIL", str(e), url.replace(BASE_URL, ""))

def test_property_crud(token):
    headers = {"Authorization": f"Bearer {token}"}

    # Read all properties (public)
    try:
        r = requests.get(f"{BASE_URL}/v2/properties", headers=headers, timeout=10)
        if r.status_code == 200:
            log_test("Property - List All", "PASS", f"Status {r.status_code}", "/v2/properties")
        else:
            log_test("Property - List All", "FAIL", f"Status {r.status_code}", "/v2/properties")
    except Exception as e:
        log_test("Property - List All", "FAIL", str(e), "/v2/properties")

def register_and_login(role):
    timestamp = int(time.time())
    email = f"audit_{role.lower()}_{timestamp}@test.com"
    password = "TestPassword123!"

    try:
        r = requests.post(f"{BASE_URL}/v1/auth/register", json={
            "email": email,
            "password": password,
            "firstName": "Audit",
            "lastName": "Test",
            "fullName": "Audit Test",
            "phone": "+212600000000",
            "role": role,
            "city": "Casablanca"
        }, timeout=10)
        if r.status_code not in [200, 201]:
            return None
    except Exception:
        return None

    try:
        r = requests.post(f"{BASE_URL}/v1/auth/login", json={
            "email": email,
            "password": password
        }, timeout=10)
        if r.status_code == 200:
            data = r.json()
            return data.get("data", {}).get("accessToken") or data.get("accessToken")
    except Exception:
        pass
    return None

def test_property_crud_owner(owner_token):
    headers = {"Authorization": f"Bearer {owner_token}"}
    property_id = None

    try:
        r = requests.post(f"{BASE_URL}/v2/properties/json", headers=headers, json={
            "title": "Audit Test Property",
            "description": "This is a beautiful apartment created by the audit script for testing purposes. It has all the required fields.",
            "price": 5000,
            "city": "Casablanca",
            "address": "123 Test Street",
            "type": "RENT",
            "category": "APARTMENT",
            "surface": 100,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1
        }, timeout=10)
        if r.status_code in [200, 201]:
            data = r.json()
            property_id = data.get("data", {}).get("id") or data.get("id")
            log_test("Property - Create (Owner)", "PASS", f"ID: {property_id}", "/v2/properties/json")
        else:
            log_test("Property - Create (Owner)", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/v2/properties/json")
    except Exception as e:
        log_test("Property - Create (Owner)", "FAIL", str(e), "/v2/properties/json")

    if property_id:
        try:
            r = requests.get(f"{BASE_URL}/v2/properties/{property_id}", headers=headers, timeout=10)
            if r.status_code == 200:
                log_test("Property - Get By ID", "PASS", f"ID: {property_id}", f"/v2/properties/{property_id}")
            else:
                log_test("Property - Get By ID", "FAIL", f"Status {r.status_code}", f"/v2/properties/{property_id}")
        except Exception as e:
            log_test("Property - Get By ID", "FAIL", str(e), f"/v2/properties/{property_id}")

        try:
            r = requests.put(f"{BASE_URL}/v2/properties/{property_id}", headers=headers, json={
                "title": "Updated Audit Property",
                "price": 6000
            }, timeout=10)
            if r.status_code == 200:
                log_test("Property - Update", "PASS", f"ID: {property_id}", f"/v2/properties/{property_id}")
            else:
                log_test("Property - Update", "FAIL", f"Status {r.status_code}: {r.text[:200]}", f"/v2/properties/{property_id}")
        except Exception as e:
            log_test("Property - Update", "FAIL", str(e), f"/v2/properties/{property_id}")

        try:
            r = requests.delete(f"{BASE_URL}/v2/properties/{property_id}", headers=headers, timeout=10)
            if r.status_code in [200, 204]:
                log_test("Property - Delete", "PASS", f"ID: {property_id}", f"/v2/properties/{property_id}")
            else:
                log_test("Property - Delete", "FAIL", f"Status {r.status_code}: {r.text[:200]}", f"/v2/properties/{property_id}")
        except Exception as e:
            log_test("Property - Delete", "FAIL", str(e), f"/v2/properties/{property_id}")
    else:
        log_test("Property - Get By ID", "SKIP", "No property created", "/v2/properties/{id}")
        log_test("Property - Update", "SKIP", "No property created", "/v2/properties/{id}")
        log_test("Property - Delete", "SKIP", "No property created", "/v2/properties/{id}")

def test_recommendations(token):
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        ("Recommendations - Personalized", "/v1/recommendations/personalized"),
        ("Recommendations - Trending", "/v1/recommendations/trending"),
        ("Recommendations - Discover", "/v1/recommendations/discover"),
    ]

    for name, endpoint in endpoints:
        try:
            r = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            if r.status_code == 200:
                log_test(name, "PASS", f"Status {r.status_code}", endpoint)
            else:
                log_test(name, "FAIL", f"Status {r.status_code}: {r.text[:200]}", endpoint)
        except Exception as e:
            log_test(name, "FAIL", str(e), endpoint)

    try:
        r = requests.get(f"{BASE_URL}/v1/recommendations/nearby", headers=headers,
                        params={"latitude": 33.57, "longitude": -7.59, "radiusKm": 5}, timeout=10)
        if r.status_code == 200:
            log_test("Recommendations - Nearby", "PASS", f"Status {r.status_code}", "/v1/recommendations/nearby")
        else:
            log_test("Recommendations - Nearby", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/v1/recommendations/nearby")
    except Exception as e:
        log_test("Recommendations - Nearby", "FAIL", str(e), "/v1/recommendations/nearby")

def test_favorites(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.get(f"{BASE_URL}/v1/favorites", headers=headers, timeout=10)
        if r.status_code == 200:
            log_test("Favorites - List", "PASS", f"Status {r.status_code}", "/v1/favorites")
        else:
            log_test("Favorites - List", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/v1/favorites")
    except Exception as e:
        log_test("Favorites - List", "FAIL", str(e), "/v1/favorites")

def test_platform_stats():
    try:
        r = requests.get(f"{BASE_URL}/v1/platform/stats", timeout=10)
        if r.status_code == 200:
            log_test("Platform Stats", "PASS", f"Status {r.status_code}", "/v1/platform/stats")
        else:
            log_test("Platform Stats", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/v1/platform/stats")
    except Exception as e:
        log_test("Platform Stats", "FAIL", str(e), "/v1/platform/stats")

def test_cities_categories(token):
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        ("Cities List", "/v2/properties/cities"),
        ("Categories List", "/v2/properties/categories"),
        ("Transaction Types", "/v2/properties/transaction-types"),
    ]

    for name, endpoint in endpoints:
        try:
            r = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            if r.status_code == 200:
                data = r.json()
                items = []
                if isinstance(data, list):
                    items = data
                elif isinstance(data, dict):
                    raw_data = data.get("data")
                    if isinstance(raw_data, list):
                        items = raw_data
                    elif isinstance(raw_data, dict):
                        items = raw_data.get("content", []) if "content" in raw_data else list(raw_data.values())
                log_test(name, "PASS", f"Found {len(items)} items", endpoint)
            else:
                log_test(name, "FAIL", f"Status {r.status_code}: {r.text[:200]}", endpoint)
        except Exception as e:
            log_test(name, "FAIL", str(e), endpoint)

def test_admin_endpoints(admin_token):
    if not admin_token:
        log_test("Admin - List Users", "SKIP", "No admin token available", "/v1/admin/users")
        log_test("Admin - List Properties", "SKIP", "No admin token available", "/v1/admin/properties")
        log_test("Admin - Stats", "SKIP", "No admin token available", "/v1/admin/stats")
        log_test("Admin - Events", "SKIP", "No admin token available", "/v1/admin/events")
        return

    headers = {"Authorization": f"Bearer {admin_token}"}

    endpoints = [
        ("Admin - List Users", "/v1/admin/users"),
        ("Admin - List Properties", "/v1/admin/properties"),
        ("Admin - Stats", "/v1/admin/stats"),
        ("Admin - Events", "/v1/admin/events"),
    ]

    for name, endpoint in endpoints:
        try:
            r = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            if r.status_code == 200:
                log_test(name, "PASS", f"Status {r.status_code}", endpoint)
            else:
                log_test(name, "FAIL", f"Status {r.status_code}: {r.text[:200]}", endpoint)
        except Exception as e:
            log_test(name, "FAIL", str(e), endpoint)

def test_analytics_owner(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.get(f"{BASE_URL}/v1/analytics/owner/dashboard", headers=headers, timeout=10)
        if r.status_code == 200:
            log_test("Analytics - Owner Dashboard", "PASS", f"Status {r.status_code}", "/v1/analytics/owner/dashboard")
        else:
            log_test("Analytics - Owner Dashboard", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/v1/analytics/owner/dashboard")
    except Exception as e:
        log_test("Analytics - Owner Dashboard", "FAIL", str(e), "/v1/analytics/owner/dashboard")

def test_messages(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.get(f"{BASE_URL}/v1/messages/conversation", headers=headers, params={"userId": 1}, timeout=10)
        if r.status_code == 200:
            log_test("Messages - Conversation", "PASS", f"Status {r.status_code}", "/v1/messages/conversation")
        else:
            log_test("Messages - Conversation", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/v1/messages/conversation")
    except Exception as e:
        log_test("Messages - Conversation", "FAIL", str(e), "/v1/messages/conversation")

def test_visits(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.get(f"{BASE_URL}/v1/visits/my-visits", headers=headers, timeout=10)
        if r.status_code == 200:
            log_test("Visits - My Visits", "PASS", f"Status {r.status_code}", "/v1/visits/my-visits")
        else:
            log_test("Visits - My Visits", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/v1/visits/my-visits")
    except Exception as e:
        log_test("Visits - My Visits", "FAIL", str(e), "/v1/visits/my-visits")

def test_reviews(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.get(f"{BASE_URL}/v1/reviews/my-reviews", headers=headers, timeout=10)
        if r.status_code == 200:
            log_test("Reviews - My Reviews", "PASS", f"Status {r.status_code}", "/v1/reviews/my-reviews")
        else:
            log_test("Reviews - My Reviews", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/v1/reviews/my-reviews")
    except Exception as e:
        log_test("Reviews - My Reviews", "FAIL", str(e), "/v1/reviews/my-reviews")

def generate_report():
    print("\n" + "="*60)
    print("RAPPORT D'AUDIT BACKEND")
    print("="*60)

    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    skipped = sum(1 for r in RESULTS if r["status"] == "SKIP")
    warned = sum(1 for r in RESULTS if r["status"] == "WARN")
    total = len(RESULTS)

    print(f"\nTotal tests: {total}")
    print(f"[OK] PASS: {passed}")
    print(f"[KO] FAIL: {failed}")
    print(f"[!]  WARN: {warned}")
    print(f"[->] SKIP: {skipped}")
    if total > 0:
        score = (passed / total) * 100
        print(f"\nScore: {score:.1f}%")

    print("\n--- Details des FAILs ---")
    for r in RESULTS:
        if r["status"] == "FAIL":
            print(f"  [KO] {r['name']}: {r['detail']}")

    with open("/tmp/backend_audit_report.json", "w") as f:
        json.dump(RESULTS, f, indent=2)
    print(f"\nRapport sauvegarde: /tmp/backend_audit_report.json")

def main():
    print("AUDIT BACKEND MAROC-LOC")
    print(f"Base URL: {BASE_URL}")
    print("="*60 + "\n")

    test_health()

    # Register 3 test users: LOCATAIRE, PROPRIETAIRE, ADMIN
    tenant_token = test_auth_flow()
    owner_token = register_and_login("PROPRIETAIRE")
    admin_token = register_and_login("ADMIN")

    if tenant_token:
        test_properties_search(tenant_token)
        test_property_crud(tenant_token)
        test_recommendations(tenant_token)
        test_favorites(tenant_token)
        test_cities_categories(tenant_token)
        test_messages(tenant_token)
        test_visits(tenant_token)
        test_reviews(tenant_token)
    else:
        print("\n[!] Tenant auth failed - skipping tenant tests")

    if owner_token:
        test_property_crud_owner(owner_token)
        test_analytics_owner(owner_token)
    else:
        print("\n[!] Owner auth failed - skipping owner tests")

    if admin_token:
        test_admin_endpoints(admin_token)
    else:
        print("\n[!] Admin auth failed - skipping admin tests")

    test_platform_stats()
    generate_report()

if __name__ == "__main__":
    main()
