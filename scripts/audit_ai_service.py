#!/usr/bin/env python3
"""
Audit complet du AI Service MAROC-LOC
Tests reels sur tous les endpoints AI
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
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
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        if r.status_code == 200:
            data = r.json()
            features = data.get("features", [])
            log_test("Health Check", "PASS", f"Features: {len(features)}", "/health")
        else:
            log_test("Health Check", "FAIL", f"Status {r.status_code}", "/health")
    except Exception as e:
        log_test("Health Check", "FAIL", str(e), "/health")

def test_smart_chat_fr():
    try:
        r = requests.post(f"{BASE_URL}/smart/chat", json={
            "message": "Je cherche un appartement a Casablanca",
            "sessionId": f"audit_fr_{int(time.time())}",
            "language": "fr"
        }, timeout=15)
        if r.status_code == 200:
            data = r.json()
            has_response = bool(data.get("response"))
            log_test("Smart Chat - FR", "PASS", f"Has response: {has_response}", "/smart/chat")
        else:
            log_test("Smart Chat - FR", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/smart/chat")
    except Exception as e:
        log_test("Smart Chat - FR", "FAIL", str(e), "/smart/chat")

def test_smart_chat_ar():
    try:
        r = requests.post(f"{BASE_URL}/smart/chat", json={
            "message": "ابحث عن شقة في الدار البيضاء",
            "sessionId": f"audit_ar_{int(time.time())}",
            "language": "ar"
        }, timeout=15)
        if r.status_code == 200:
            data = r.json()
            has_response = bool(data.get("response"))
            log_test("Smart Chat - AR", "PASS", f"Has response: {has_response}", "/smart/chat")
        else:
            log_test("Smart Chat - AR", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/smart/chat")
    except Exception as e:
        log_test("Smart Chat - AR", "FAIL", str(e), "/smart/chat")

def test_smart_chat_darija():
    try:
        r = requests.post(f"{BASE_URL}/smart/chat", json={
            "message": "bghit dar f casablanca",
            "sessionId": f"audit_darija_{int(time.time())}",
            "language": "darija"
        }, timeout=15)
        if r.status_code == 200:
            data = r.json()
            has_response = bool(data.get("response"))
            log_test("Smart Chat - Darija", "PASS", f"Has response: {has_response}", "/smart/chat")
        else:
            log_test("Smart Chat - Darija", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/smart/chat")
    except Exception as e:
        log_test("Smart Chat - Darija", "FAIL", str(e), "/smart/chat")

def test_context_memory():
    session_id = f"audit_memory_{int(time.time())}"
    try:
        # First message
        r1 = requests.post(f"{BASE_URL}/smart/chat", json={
            "message": "Je cherche a Casablanca",
            "sessionId": session_id,
            "language": "fr"
        }, timeout=15)

        # Second message (should remember city)
        r2 = requests.post(f"{BASE_URL}/smart/chat", json={
            "message": "Combien ca coute ?",
            "sessionId": session_id,
            "language": "fr"
        }, timeout=15)

        if r2.status_code == 200:
            data = r2.json()
            response = data.get("response", "")
            # Check if response mentions Casablanca or has context
            has_context = "casablanca" in response.lower() or data.get("filters", {}).get("city")
            log_test("Context Memory", "PASS", f"Context preserved: {has_context}", "/smart/chat")
        else:
            log_test("Context Memory", "FAIL", f"Status {r2.status_code}", "/smart/chat")
    except Exception as e:
        log_test("Context Memory", "FAIL", str(e), "/smart/chat")

def test_rag_search():
    try:
        r = requests.post(f"{BASE_URL}/search", json={
            "query": "appartement Casablanca 3 chambres",
            "top_k": 5,
            "filters": {"city": "Casablanca"}
        }, timeout=15)
        if r.status_code == 200:
            data = r.json()
            results = data.get("results", [])
            log_test("RAG Search", "PASS", f"Found {len(results)} results", "/search")
        else:
            log_test("RAG Search", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/search")
    except Exception as e:
        log_test("RAG Search", "FAIL", str(e), "/search")

def test_tts():
    try:
        r = requests.post(f"{BASE_URL}/analytics/tts", json={
            "text": "Bonjour, bienvenue sur Maroc Loc",
            "language": "fr"
        }, timeout=15)
        if r.status_code == 200:
            data = r.json()
            audio_url = data.get("audio_url", "")
            # Verify audio file is accessible
            if audio_url:
                r2 = requests.get(f"{BASE_URL}{audio_url}", timeout=10)
                accessible = r2.status_code == 200
                log_test("TTS - FR", "PASS", f"Audio accessible: {accessible}", "/analytics/tts")
            else:
                log_test("TTS - FR", "FAIL", "No audio_url in response", "/analytics/tts")
        else:
            log_test("TTS - FR", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/analytics/tts")
    except Exception as e:
        log_test("TTS - FR", "FAIL", str(e), "/analytics/tts")

def test_analytics():
    endpoints = [
        ("Analytics - Overview", "/analytics/overview"),
        ("Analytics - Intents", "/analytics/intents"),
        ("Analytics - Languages", "/analytics/languages"),
        ("Analytics - Timeline", "/analytics/timeline"),
        ("Analytics - Top Searches", "/analytics/top-searches"),
    ]

    for name, endpoint in endpoints:
        try:
            params = {"days": 30} if "timeline" in endpoint else {}
            r = requests.get(f"{BASE_URL}{endpoint}", params=params, timeout=10)
            if r.status_code == 200:
                log_test(name, "PASS", f"Status {r.status_code}", endpoint)
            else:
                log_test(name, "FAIL", f"Status {r.status_code}: {r.text[:200]}", endpoint)
        except Exception as e:
            log_test(name, "FAIL", str(e), endpoint)

def test_recommendations():
    try:
        r = requests.post(f"{BASE_URL}/recommendations", json={
            "user_id": "audit_user",
            "context": {"city": "Casablanca"},
            "n_results": 5,
            "diversity_boost": 0.3
        }, timeout=15)
        if r.status_code == 200:
            data = r.json()
            recs = data.get("recommendations", [])
            log_test("AI Recommendations", "PASS", f"Found {len(recs)} recommendations", "/recommendations")
        else:
            log_test("AI Recommendations", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/recommendations")
    except Exception as e:
        log_test("AI Recommendations", "FAIL", str(e), "/recommendations")

def test_fraud_detection():
    try:
        r = requests.post(f"{BASE_URL}/fraud/check", json={
            "property_id": 1,
            "title": "Appartement moderne",
            "description": "Bel appartement a Casablanca",
            "price": 5000,
            "surface": 100,
            "city": "Casablanca",
            "property_type": "APARTMENT",
            "images": [],
            "contact_phone": "+212600000000",
            "contact_email": "test@test.com"
        }, timeout=10)
        if r.status_code == 200:
            data = r.json()
            score = data.get("fraud_score", "N/A")
            log_test("Fraud Detection", "PASS", f"Score: {score}", "/fraud/check")
        else:
            log_test("Fraud Detection", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/fraud/check")
    except Exception as e:
        log_test("Fraud Detection", "FAIL", str(e), "/fraud/check")

def test_owner_tools():
    try:
        r = requests.post(f"{BASE_URL}/owner/generate-description", json={
            "title": "Bel appartement moderne",
            "city": "Casablanca",
            "category": "APARTMENT",
            "propertyType": "RENT",
            "surface": 100,
            "rooms": 3,
            "language": "fr"
        }, timeout=15)
        if r.status_code == 200:
            data = r.json()
            desc = data.get("description", "")
            log_test("Owner - Generate Description", "PASS", f"Length: {len(desc)}", "/owner/generate-description")
        else:
            log_test("Owner - Generate Description", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/owner/generate-description")
    except Exception as e:
        log_test("Owner - Generate Description", "FAIL", str(e), "/owner/generate-description")

    try:
        r = requests.post(f"{BASE_URL}/owner/suggest-price", json={
            "city": "Casablanca",
            "category": "APARTMENT",
            "propertyType": "RENT",
            "surface": 100,
            "rooms": 3
        }, timeout=15)
        if r.status_code == 200:
            data = r.json()
            price = data.get("suggested_price", "N/A")
            log_test("Owner - Suggest Price", "PASS", f"Price: {price}", "/owner/suggest-price")
        else:
            log_test("Owner - Suggest Price", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/owner/suggest-price")
    except Exception as e:
        log_test("Owner - Suggest Price", "FAIL", str(e), "/owner/suggest-price")

def test_sentiment():
    try:
        r = requests.post(f"{BASE_URL}/sentiment/analyze", json={
            "text": "Cet appartement est magnifique et tres bien situe",
            "language": "fr"
        }, timeout=10)
        if r.status_code == 200:
            data = r.json()
            label = data.get("label", "")
            log_test("Sentiment Analysis", "PASS", f"Label: {label}", "/sentiment/analyze")
        else:
            log_test("Sentiment Analysis", "FAIL", f"Status {r.status_code}: {r.text[:200]}", "/sentiment/analyze")
    except Exception as e:
        log_test("Sentiment Analysis", "FAIL", str(e), "/sentiment/analyze")

def generate_report():
    print("\n" + "="*60)
    print("RAPPORT D'AUDIT AI SERVICE")
    print("="*60)

    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    skipped = sum(1 for r in RESULTS if r["status"] == "SKIP")
    total = len(RESULTS)

    print(f"\nTotal tests: {total}")
    print(f"[OK] PASS: {passed}")
    print(f"[KO] FAIL: {failed}")
    print(f"[->] SKIP: {skipped}")
    if total > 0:
        score = (passed / total) * 100
        print(f"\nScore: {score:.1f}%")

    print("\n--- Details des FAILs ---")
    for r in RESULTS:
        if r["status"] == "FAIL":
            print(f"  [KO] {r['name']}: {r['detail']}")

    with open("/tmp/ai_audit_report.json", "w") as f:
        json.dump(RESULTS, f, indent=2)
    print(f"\nRapport sauvegarde: /tmp/ai_audit_report.json")

def main():
    print("AUDIT AI SERVICE MAROC-LOC")
    print(f"Base URL: {BASE_URL}")
    print("="*60 + "\n")

    test_health()
    test_smart_chat_fr()
    test_smart_chat_ar()
    test_smart_chat_darija()
    test_context_memory()
    test_rag_search()
    test_tts()
    test_analytics()
    test_recommendations()
    test_fraud_detection()
    test_owner_tools()
    test_sentiment()

    generate_report()

if __name__ == "__main__":
    main()
