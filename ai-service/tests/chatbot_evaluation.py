#!/usr/bin/env python3
"""
Évaluation complète de précision du chatbot MAROC-LOC
Test → Correction → Retest jusqu'à ≥85% accuracy
"""

import json
import requests
import sys
import io
import time
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

API_URL = "http://localhost:8000/smart/chat"


@dataclass
class TestCase:
    message: str
    expected_intent: str
    expected_city: Optional[str] = None
    expected_property_type: Optional[str] = None
    expected_transaction: Optional[str] = None  # RENT or BUY
    expected_lang: Optional[str] = None
    category: str = ""  # darija, arabic, french, english, support
    id: str = ""


# =============================================================================
# 20 QUESTIONS EN DARIJA MAROCAINE
# =============================================================================
DARIJA_TESTS = [
    TestCase("بغيت نكري شقة فكازا", "SEARCH", "Casablanca", "APARTMENT", "RENT", "arabic", "darija", "D01"),
    TestCase("شحال ثمن الدار فمراكش", "PRICE_CHECK", "Marrakech", "HOUSE", "BUY", "arabic", "darija", "D02"),
    TestCase("بشحال كرهن الدار بمراكش", "PRICE_CHECK", "Marrakech", "HOUSE", "RENT", "arabic", "darija", "D03"),
    TestCase("شنو أحسن حي فالرباط", "NEIGHBORHOOD_INFO", "Rabat", None, None, "arabic", "darija", "D04"),
    TestCase("بغيت نشري ڤيلا فطنجة", "SEARCH", "Tanger", "HOUSE", "BUY", "arabic", "darija", "D05"),
    TestCase("كيفاش نحسب الكرادي", "MORTGAGE", None, None, None, "arabic", "darija", "D06"),
    TestCase("كيفاش نتواصل مع صاحب الدار", "SUPPORT", None, None, None, "arabic", "darija", "D07"),
    TestCase("شحال ثمن البروطو فأكادير", "PRICE_CHECK", "Agadir", "STUDIO", "BUY", "arabic", "darija", "D08"),
    TestCase("بغيت نكري بروطو رخيص فالدار البيضاء", "SEARCH", "Casablanca", "STUDIO", "RENT", "arabic", "darija", "D09"),
    TestCase("شنو الأحياء اللي زوينين فمراكش", "NEIGHBORHOOD_INFO", "Marrakech", None, None, "arabic", "darija", "D10"),
    TestCase("كيفاش ندير إعلان ديال بيع", "CREATE_LISTING", None, None, "BUY", "arabic", "darija", "D11"),
    TestCase("شحال خاصني نخلص شهريا على دار ب 2 مليون", "MORTGAGE", None, None, "BUY", "arabic", "darija", "D12"),
    TestCase("بغيت نحط دار للبيع ففاس", "CREATE_LISTING", "Fes", "HOUSE", "BUY", "arabic", "darija", "D13"),
    TestCase("كنقلب على شقة مفروشة فطنجة", "SEARCH", "Tanger", "APARTMENT", "RENT", "arabic", "darija", "D14"),
    TestCase("شحال كرهن الشقق فمكناس", "PRICE_CHECK", "Meknes", "APARTMENT", "RENT", "arabic", "darija", "D15"),
    TestCase("كيفاش نحفظ إعلان فالمفضلين", "FAVORITES", None, None, None, "arabic", "darija", "D16"),
    TestCase("شحال ثمن الأرض فأكادير", "PRICE_CHECK", "Agadir", "LAND", "BUY", "arabic", "darija", "D17"),
    TestCase("بغيت نعرف على الثمن ديال المحلات فالرباط", "PRICE_CHECK", "Rabat", "SHOP", "BUY", "arabic", "darija", "D18"),
    TestCase("كيفاش نزور الدار", "SUPPORT", None, None, None, "arabic", "darija", "D19"),
    TestCase("شنو الجو فالدار البيضاء اليوم", "OUT_OF_SCOPE", None, None, None, "arabic", "darija", "D20"),
]

# =============================================================================
# 20 QUESTIONS EN ARABE CLASSIQUE
# =============================================================================
ARABIC_TESTS = [
    TestCase("أبحث عن شقة للإيجار في الدار البيضاء", "SEARCH", "Casablanca", "APARTMENT", "RENT", "arabic", "arabic", "A01"),
    TestCase("ما هو سعر المنزل في مراكش", "PRICE_CHECK", "Marrakech", "HOUSE", "BUY", "arabic", "arabic", "A02"),
    TestCase("كم سعر شقة في الرباط", "PRICE_CHECK", "Rabat", "APARTMENT", "BUY", "arabic", "arabic", "A03"),
    TestCase("ما هي أفضل الأحياء في طنجة", "NEIGHBORHOOD_INFO", "Tanger", None, None, "arabic", "arabic", "A04"),
    TestCase("أريد شراء فيلا في أكادير", "SEARCH", "Agadir", "HOUSE", "BUY", "arabic", "arabic", "A05"),
    TestCase("كيف أحسب القرض العقاري", "MORTGAGE", None, None, None, "arabic", "arabic", "A06"),
    TestCase("كيف أتواصل مع المالك", "SUPPORT", None, None, None, "arabic", "arabic", "A07"),
    TestCase("ما هو ثمن الاستوديو في فاس", "PRICE_CHECK", "Fes", "STUDIO", "BUY", "arabic", "arabic", "A08"),
    TestCase("أبحث عن استوديو رخيص في الدار البيضاء", "SEARCH", "Casablanca", "STUDIO", "RENT", "arabic", "arabic", "A09"),
    TestCase("ما هي الأحياء الجيدة في مراكش", "NEIGHBORHOOD_INFO", "Marrakech", None, None, "arabic", "arabic", "A10"),
    TestCase("كيف أنشر إعلان للبيع", "CREATE_LISTING", None, None, "BUY", "arabic", "arabic", "A11"),
    TestCase("كم يجب أن أدفع شهرياً لمنزل بمليوني درهم", "MORTGAGE", None, None, "BUY", "arabic", "arabic", "A12"),
    TestCase("أريد وضع منزل للبيع في الرباط", "CREATE_LISTING", "Rabat", "HOUSE", "BUY", "arabic", "arabic", "A13"),
    TestCase("أبحث عن شقة مفروشة في طنجة", "SEARCH", "Tanger", "APARTMENT", "RENT", "arabic", "arabic", "A14"),
    TestCase("كم إيجار الشقق في مكناس", "PRICE_CHECK", "Meknes", "APARTMENT", "RENT", "arabic", "arabic", "A15"),
    TestCase("كيف أحفظ إعلان في المفضلة", "FAVORITES", None, None, None, "arabic", "arabic", "A16"),
    TestCase("ما هو ثمن الأرض في أكادير", "PRICE_CHECK", "Agadir", "LAND", "BUY", "arabic", "arabic", "A17"),
    TestCase("أريد معرفة سعر المحلات في الرباط", "PRICE_CHECK", "Rabat", "SHOP", "BUY", "arabic", "arabic", "A18"),
    TestCase("كيف أزور المنزل", "SUPPORT", None, None, None, "arabic", "arabic", "A19"),
    TestCase("من فاز في مباراة الأمس", "OUT_OF_SCOPE", None, None, None, "arabic", "arabic", "A20"),
]

# =============================================================================
# 20 QUESTIONS EN FRANÇAIS
# =============================================================================
FRENCH_TESTS = [
    TestCase("je cherche un appartement à louer à Casablanca", "SEARCH", "Casablanca", "APARTMENT", "RENT", "french", "french", "F01"),
    TestCase("prix d'une maison à Marrakech", "PRICE_CHECK", "Marrakech", "HOUSE", "BUY", "french", "french", "F02"),
    TestCase("combien coûte un appartement à Rabat", "PRICE_CHECK", "Rabat", "APARTMENT", "BUY", "french", "french", "F03"),
    TestCase("quels sont les meilleurs quartiers de Tanger", "NEIGHBORHOOD_INFO", "Tanger", None, None, "french", "french", "F04"),
    TestCase("je veux acheter une villa à Agadir", "SEARCH", "Agadir", "HOUSE", "BUY", "french", "french", "F05"),
    TestCase("simuler un crédit immobilier", "MORTGAGE", None, None, None, "french", "french", "F06"),
    TestCase("comment contacter un propriétaire", "SUPPORT", None, None, None, "french", "french", "F07"),
    TestCase("prix d'un studio à Fès", "PRICE_CHECK", "Fes", "STUDIO", "BUY", "french", "french", "F08"),
    TestCase("cherche studio pas cher à Casablanca", "SEARCH", "Casablanca", "STUDIO", "RENT", "french", "french", "F09"),
    TestCase("meilleurs quartiers de Marrakech", "NEIGHBORHOOD_INFO", "Marrakech", None, None, "french", "french", "F10"),
    TestCase("comment créer une annonce de vente", "CREATE_LISTING", None, None, "BUY", "french", "french", "F11"),
    TestCase("mensualité pour une maison à 2 millions", "MORTGAGE", None, None, "BUY", "french", "french", "F12"),
    TestCase("je veux mettre ma maison en vente à Rabat", "CREATE_LISTING", "Rabat", "HOUSE", "BUY", "french", "french", "F13"),
    TestCase("cherche appartement meublé à Tanger", "SEARCH", "Tanger", "APARTMENT", "RENT", "french", "french", "F14"),
    TestCase("loyer des appartements à Meknès", "PRICE_CHECK", "Meknes", "APARTMENT", "RENT", "french", "french", "F15"),
    TestCase("comment sauvegarder une annonce", "FAVORITES", None, None, None, "french", "french", "F16"),
    TestCase("prix d'un terrain à Agadir", "PRICE_CHECK", "Agadir", "LAND", "BUY", "french", "french", "F17"),
    TestCase("prix des commerces à Rabat", "PRICE_CHECK", "Rabat", "SHOP", "BUY", "french", "french", "F18"),
    TestCase("comment visiter un bien", "SUPPORT", None, None, None, "french", "french", "F19"),
    TestCase("quelle est la recette du tajine", "OUT_OF_SCOPE", None, None, None, "french", "french", "F20"),
]

# =============================================================================
# 20 QUESTIONS EN ANGLAIS
# =============================================================================
ENGLISH_TESTS = [
    TestCase("looking for an apartment to rent in Casablanca", "SEARCH", "Casablanca", "APARTMENT", "RENT", "english", "english", "E01"),
    TestCase("price of a house in Marrakech", "PRICE_CHECK", "Marrakech", "HOUSE", "BUY", "english", "english", "E02"),
    TestCase("how much is an apartment in Rabat", "PRICE_CHECK", "Rabat", "APARTMENT", "BUY", "english", "english", "E03"),
    TestCase("best neighborhoods in Tangier", "NEIGHBORHOOD_INFO", "Tanger", None, None, "english", "english", "E04"),
    TestCase("I want to buy a villa in Agadir", "SEARCH", "Agadir", "HOUSE", "BUY", "english", "english", "E05"),
    TestCase("mortgage simulation", "MORTGAGE", None, None, None, "english", "english", "E06"),
    TestCase("how to contact an owner", "SUPPORT", None, None, None, "english", "english", "E07"),
    TestCase("studio price in Fes", "PRICE_CHECK", "Fes", "STUDIO", "BUY", "english", "english", "E08"),
    TestCase("cheap studio in Casablanca", "SEARCH", "Casablanca", "STUDIO", "RENT", "english", "english", "E09"),
    TestCase("good neighborhoods in Marrakech", "NEIGHBORHOOD_INFO", "Marrakech", None, None, "english", "english", "E10"),
    TestCase("how to create a listing for sale", "CREATE_LISTING", None, None, "BUY", "english", "english", "E11"),
    TestCase("monthly payment for a 2 million house", "MORTGAGE", None, None, "BUY", "english", "english", "E12"),
    TestCase("I want to sell my house in Rabat", "CREATE_LISTING", "Rabat", "HOUSE", "BUY", "english", "english", "E13"),
    TestCase("looking for furnished apartment in Tangier", "SEARCH", "Tanger", "APARTMENT", "RENT", "english", "english", "E14"),
    TestCase("apartment rent in Meknes", "SEARCH", "Meknes", "APARTMENT", "RENT", "english", "english", "E15"),
    TestCase("how to save a listing to favorites", "FAVORITES", None, None, None, "english", "english", "E16"),
    TestCase("land price in Agadir", "PRICE_CHECK", "Agadir", "LAND", "BUY", "english", "english", "E17"),
    TestCase("shop prices in Rabat", "PRICE_CHECK", "Rabat", "SHOP", "BUY", "english", "english", "E18"),
    TestCase("how to schedule a visit", "SUPPORT", None, None, None, "english", "english", "E19"),
    TestCase("who won the football match yesterday", "OUT_OF_SCOPE", None, None, None, "english", "english", "E20"),
]

# =============================================================================
# 20 QUESTIONS SUPPORT / ASSISTANCE
# =============================================================================
SUPPORT_TESTS = [
    TestCase("comment créer un compte", "SUPPORT", None, None, None, "french", "support", "S01"),
    TestCase("j'ai oublié mon mot de passe", "SUPPORT", None, None, None, "french", "support", "S02"),
    TestCase("comment modifier mon annonce", "SUPPORT", None, None, None, "french", "support", "S03"),
    TestCase("comment supprimer mon compte", "SUPPORT", None, None, None, "french", "support", "S04"),
    TestCase("je n'arrive pas à me connecter", "SUPPORT", None, None, None, "french", "support", "S05"),
    TestCase("comment télécharger des photos", "SUPPORT", None, None, None, "french", "support", "S06"),
    TestCase("quelles sont les pièces requises pour louer", "SUPPORT", None, None, None, "french", "support", "S07"),
    TestCase("comment signaler une arnaque", "SUPPORT", None, None, None, "french", "support", "S08"),
    TestCase("comment fonctionne la caution", "SUPPORT", None, None, None, "french", "support", "S09"),
    TestCase("puis-je payer en plusieurs fois", "SUPPORT", None, None, None, "french", "support", "S10"),
    TestCase("how do I reset my password", "SUPPORT", None, None, None, "english", "support", "S11"),
    TestCase("how to upload photos to my listing", "SUPPORT", None, None, None, "english", "support", "S12"),
    TestCase("what documents do I need to buy a house", "SUPPORT", None, None, None, "english", "support", "S13"),
    TestCase("how does the referral program work", "SUPPORT", None, None, None, "english", "support", "S14"),
    TestCase("كيفاش ندير كونط", "SUPPORT", None, None, None, "arabic", "support", "S15"),
    TestCase("نسيت الباسورد ديالي", "SUPPORT", None, None, None, "arabic", "support", "S16"),
    TestCase("كيفاش نبدل الإعلان ديالي", "SUPPORT", None, None, None, "arabic", "support", "S17"),
    TestCase("شنو الوثائق اللي خاصني باش نكري", "SUPPORT", None, None, None, "arabic", "support", "S18"),
    TestCase("كيفاش نبلغ على نصاب", "SUPPORT", None, None, None, "arabic", "support", "S19"),
    TestCase("كيفاش كتخدم الضمانة", "SUPPORT", None, None, None, "arabic", "support", "S20"),
]

ALL_TESTS = DARIJA_TESTS + ARABIC_TESTS + FRENCH_TESTS + ENGLISH_TESTS + SUPPORT_TESTS


# Intents that don't require city/property extraction
NO_CITY_INTENTS = {"MORTGAGE", "SUPPORT", "FAVORITES", "OUT_OF_SCOPE"}
NO_PROPERTY_INTENTS = {"MORTGAGE", "SUPPORT", "FAVORITES", "OUT_OF_SCOPE", "NEIGHBORHOOD_INFO", "CREATE_LISTING"}


def send_request(test: TestCase, session_counter: int) -> dict:
    """Send a single request to the chatbot API."""
    payload = {
        "message": test.message,
        "sessionId": f"eval-{session_counter}",
        "userRole": "guest",
        "language": "auto"
    }
    try:
        resp = requests.post(API_URL, json=payload, headers={"Content-Type": "application/json; charset=utf-8"}, timeout=15)
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"_error": f"HTTP {resp.status_code}: {resp.text}"}
    except Exception as e:
        return {"_error": str(e)}


def evaluate_result(test: TestCase, response: dict) -> dict:
    """Compare expected vs actual result."""
    result = {
        "id": test.id,
        "message": test.message,
        "category": test.category,
        "expected_intent": test.expected_intent,
        "actual_intent": response.get("intent", "ERROR"),
        "expected_city": test.expected_city,
        "actual_city": response.get("entities", {}).get("city"),
        "expected_lang": test.expected_lang,
        "actual_lang": response.get("language", "unknown"),
        "response_text": response.get("response", "")[:100],
        "intent_match": False,
        "city_match": False,
        "lang_match": False,
        "overall_pass": False,
        "error": response.get("_error", ""),
    }

    # Intent match
    result["intent_match"] = result["actual_intent"] == test.expected_intent

    # City match (only if expected)
    if test.expected_city is None:
        result["city_match"] = True  # No city expected = always pass
    else:
        expected_normalized = test.expected_city.lower().replace(" ", "")
        actual = result["actual_city"]
        if actual:
            actual_normalized = actual.lower().replace(" ", "")
            result["city_match"] = expected_normalized == actual_normalized
        else:
            result["city_match"] = False

    # Language match (with tolerance for "mixed" → "arabic" for Darija)
    actual_lang = result["actual_lang"]
    expected_lang = test.expected_lang
    if actual_lang == expected_lang:
        result["lang_match"] = True
    elif expected_lang == "arabic" and actual_lang in ("arabic", "mixed", "french"):
        # Darija/Arabic often detected as mixed or arabic - acceptable
        result["lang_match"] = True
    elif expected_lang == "french" and actual_lang in ("french", "mixed"):
        result["lang_match"] = True
    else:
        result["lang_match"] = False

    # Overall: intent is primary, city and lang are secondary
    if result["error"]:
        result["overall_pass"] = False
    elif result["intent_match"]:
        result["overall_pass"] = True
    else:
        # Allow partial credit: if city and lang match but intent is close
        result["overall_pass"] = False

    return result


def run_evaluation(tests: List[TestCase]) -> List[dict]:
    """Run all tests and return results."""
    results = []
    total = len(tests)
    for i, test in enumerate(tests):
        print(f"  [{i+1}/{total}] {test.id} : {test.message[:50]}...", end=" ", flush=True)
        response = send_request(test, i)
        result = evaluate_result(test, response)
        results.append(result)
        status = "✅" if result["overall_pass"] else "❌"
        print(f"{status} intent={result['actual_intent']} city={result['actual_city']} lang={result['actual_lang']}")
        time.sleep(2.5)  # Avoid rate limiting (30 req/min = 1 per 2s)
    return results


def print_report(results: List[dict]):
    """Generate and print comprehensive report."""
    total = len(results)
    passed = sum(1 for r in results if r["overall_pass"])
    failed = total - passed
    accuracy = (passed / total) * 100 if total > 0 else 0

    # By category
    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"total": 0, "passed": 0}
        categories[cat]["total"] += 1
        if r["overall_pass"]:
            categories[cat]["passed"] += 1

    # By intent
    intents = {}
    for r in results:
        exp = r["expected_intent"]
        if exp not in intents:
            intents[exp] = {"total": 0, "passed": 0}
        intents[exp]["total"] += 1
        if r["overall_pass"]:
            intents[exp]["passed"] += 1

    print("\n" + "="*70)
    print("RAPPORT D'ÉVALUATION DU CHATBOT MAROC-LOC")
    print("="*70)
    print(f"Date: {datetime.now().isoformat()}")
    print(f"Total tests: {total}")
    print(f"Succès: {passed}")
    print(f"Échecs: {failed}")
    print(f"Accuracy globale: {accuracy:.1f}%")
    print(f"Objectif: ≥85%")
    print(f"Statut: {'✅ ATTEINT' if accuracy >= 85 else '❌ NON ATTEINT'}")

    print("\n--- Accuracy par langue/catégorie ---")
    for cat, stats in sorted(categories.items()):
        cat_acc = (stats["passed"] / stats["total"]) * 100
        print(f"  {cat:12s}: {stats['passed']:2d}/{stats['total']:2d} = {cat_acc:.1f}%")

    print("\n--- Accuracy par intention ---")
    for intent, stats in sorted(intents.items()):
        int_acc = (stats["passed"] / stats["total"]) * 100
        print(f"  {intent:20s}: {stats['passed']:2d}/{stats['total']:2d} = {int_acc:.1f}%")

    print("\n--- Erreurs détaillées ---")
    errors = [r for r in results if not r["overall_pass"]]
    if errors:
        for r in errors:
            print(f"  {r['id']}: [{r['category']}] '{r['message'][:50]}'")
            print(f"       Expected: intent={r['expected_intent']} city={r['expected_city']} lang={r['expected_lang']}")
            print(f"       Actual:   intent={r['actual_intent']} city={r['actual_city']} lang={r['actual_lang']}")
            if r["error"]:
                print(f"       Error:    {r['error']}")
    else:
        print("  Aucune erreur !")

    # Confusion matrix
    print("\n--- Matrice de confusion (Expected → Actual) ---")
    confusion = {}
    for r in results:
        key = (r["expected_intent"], r["actual_intent"])
        confusion[key] = confusion.get(key, 0) + 1
    for (exp, act), count in sorted(confusion.items()):
        marker = "✅" if exp == act else "❌"
        print(f"  {marker} {exp:20s} → {act:20s} : {count}")

    print("\n" + "="*70)

    return {
        "total": total,
        "passed": passed,
        "failed": failed,
        "accuracy": accuracy,
        "categories": {k: {"total": v["total"], "passed": v["passed"], "accuracy": (v["passed"]/v["total"])*100}
                       for k, v in categories.items()},
        "intents": {k: {"total": v["total"], "passed": v["passed"], "accuracy": (v["passed"]/v["total"])*100}
                    for k, v in intents.items()},
        "errors": errors,
        "confusion": {f"{k[0]}→{k[1]}": v for k, v in confusion.items()},
    }


def main():
    print("="*70)
    print("CHATBOT EVALUATION - ROUND 1")
    print("="*70)
    print(f"Running {len(ALL_TESTS)} tests against {API_URL}...")
    results = run_evaluation(ALL_TESTS)
    report = print_report(results)
    return report


if __name__ == "__main__":
    main()
