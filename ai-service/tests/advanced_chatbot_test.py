#!/usr/bin/env python3
"""
Tests avancés du chatbot MAROC-LOC — Partie A + Partie B
Phrases naturelles, ambiguïtés, fautes, mélanges de langues
"""

import json, requests, sys, io, time
from datetime import datetime
from dataclasses import dataclass
from typing import List, Optional

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

API_URL = "http://localhost:8000/smart/chat"

@dataclass
class TestCase:
    message: str
    expected_intent: str
    expected_city: Optional[str] = None
    expected_lang: Optional[str] = None
    category: str = ""
    id: str = ""
    notes: str = ""  # Pour les cas pièges / ambiguïtés

# ═══════════════════════════════════════════════════════════════════════════════
# PARTIE A — 60 TESTS AVANCÉS
# ═══════════════════════════════════════════════════════════════════════════════

# ── 10 DARIJA ──
DARIJA_ADVANCED = [
    TestCase("بغيت شي حاجة قريبة للكلية ديال الطب ففاس", "SEARCH", "Fes", "arabic", "darija_adv", "DA01", "Darija: proximité + institution"),
    TestCase("عندي 2500 درهم شنو نكري فالرباط؟", "SEARCH", "Rabat", "arabic", "darija_adv", "DA02", "Darija: budget explicite"),
    TestCase("واش كاين شي ستوديو ماشي بعيد على الترام؟", "SEARCH", None, "arabic", "darija_adv", "DA03", "Darija: critère de proximité"),
    TestCase("بغيت نبيع الدار ديالي كيفاش ندير؟", "CREATE_LISTING", None, "arabic", "darija_adv", "DA04", "Darija: propriétaire vendeur"),
    TestCase("شحال خاصني نخلص فالشهر إلى سلفت 300 ألف درهم؟", "MORTGAGE", None, "arabic", "darija_adv", "DA05", "Darija: prêt 300K"),
    TestCase("شحال كرهن الڤيلا فطنجة هاد العام؟", "PRICE_CHECK", "Tanger", "arabic", "darija_adv", "DA06", "Darija: loyer villa Tanger"),
    TestCase("شنو أحسن حي باش نسكن مع العائلة فالدار البيضاء؟", "NEIGHBORHOOD_INFO", "Casablanca", "arabic", "darija_adv", "DA07", "Darija: famille + Casablanca"),
    TestCase("كيفاش نحفظ هاد الإعلان باش نرجعلو بعدين؟", "FAVORITES", None, "arabic", "darija_adv", "DA08", "Darija: sauvegarder pour plus tard"),
    TestCase("واش نقدر نتواصل مع صاحب الدار قبل ما نزورو؟", "SUPPORT", None, "arabic", "darija_adv", "DA09", "Darija: contact avant visite"),
    TestCase("شنو الجو فمراكش هاد النهار؟", "OUT_OF_SCOPE", None, "arabic", "darija_adv", "DA10", "Darija: hors sujet météo"),
]

# ── 10 ARABE CLASSIQUE ──
ARABIC_ADVANCED = [
    TestCase("أبحث عن شقة مناسبة لعائلة مكونة من خمسة أفراد في طنجة", "SEARCH", "Tanger", "arabic", "arabic_adv", "AA01", "Arabe: famille 5 personnes"),
    TestCase("ما هي أفضل الأحياء للسكن بالقرب من الجامعة؟", "NEIGHBORHOOD_INFO", None, "arabic", "arabic_adv", "AA02", "Arabe: proximité université"),
    TestCase("أريد نشر إعلان بيع منزل", "CREATE_LISTING", None, "arabic", "arabic_adv", "AA03", "Arabe: vendre maison"),
    TestCase("كيف يمكنني التواصل مع صاحب العقار؟", "SUPPORT", None, "arabic", "arabic_adv", "AA04", "Arabe: contacter propriétaire"),
    TestCase("ما هي الوثائق المطلوبة لشراء شقة؟", "SUPPORT", None, "arabic", "arabic_adv", "AA05", "Arabe: documents achat"),
    TestCase("كم سعر الشقق في الرباط حالياً؟", "PRICE_CHECK", "Rabat", "arabic", "arabic_adv", "AA06", "Arabe: prix actuel Rabat"),
    TestCase("هل يمكنني تعديل إعلاني بعد نشره؟", "SUPPORT", None, "arabic", "arabic_adv", "AA07", "Arabe: modifier après publication"),
    TestCase("أبحث عن استوديو قريب من المحطة", "SEARCH", None, "arabic", "arabic_adv", "AA08", "Arabe: studio près gare"),
    TestCase("ما هي نسبة الفائدة على القروض العقارية؟", "MORTGAGE", None, "arabic", "arabic_adv", "AA09", "Arabe: taux d'intérêt"),
    TestCase("من هو أفضل لاعب في تاريخ كرة القدم؟", "OUT_OF_SCOPE", None, "arabic", "arabic_adv", "AA10", "Arabe: hors sujet football"),
]

# ── 10 FRANÇAIS ──
FRENCH_ADVANCED = [
    TestCase("Je cherche un appartement proche d'une gare", "SEARCH", None, "french", "french_adv", "FA01", "Français: proximité gare"),
    TestCase("Quel budget faut-il prévoir pour louer à Rabat ?", "PRICE_CHECK", "Rabat", "french", "french_adv", "FA02", "Français: budget Rabat"),
    TestCase("Comment publier une annonce avec plusieurs photos ?", "CREATE_LISTING", None, "french", "french_adv", "FA03", "Français: annonce avec photos"),
    TestCase("Je souhaite modifier mon annonce existante", "SUPPORT", None, "french", "french_adv", "FA04", "Français: modifier existante"),
    TestCase("Quels sont les quartiers les plus calmes de Casablanca ?", "NEIGHBORHOOD_INFO", "Casablanca", "french", "french_adv", "FA05", "Français: quartiers calmes Casa"),
    TestCase("Est-ce que je peux sauvegarder une annonce dans mes favoris ?", "FAVORITES", None, "french", "french_adv", "FA06", "Français: favoris"),
    TestCase("Comment calculer les mensualités d'un prêt de 1 million ?", "MORTGAGE", None, "french", "french_adv", "FA07", "Français: mensualité 1M"),
    TestCase("Je cherche une maison avec jardin à Marrakech", "SEARCH", "Marrakech", "french", "french_adv", "FA08", "Français: maison jardin Marrakech"),
    TestCase("Comment contacter le propriétaire d'un bien ?", "SUPPORT", None, "french", "french_adv", "FA09", "Français: contacter proprio"),
    TestCase("Quelle est la recette du couscous marocain ?", "OUT_OF_SCOPE", None, "french", "french_adv", "FA10", "Français: hors sujet cuisine"),
]

# ── 10 ENGLISH ──
ENGLISH_ADVANCED = [
    TestCase("I'm looking for a family-friendly apartment in Tangier", "SEARCH", "Tanger", "english", "english_adv", "EA01", "English: family Tangier"),
    TestCase("How much would a mortgage cost for a 600,000 MAD property?", "MORTGAGE", None, "english", "english_adv", "EA02", "English: mortgage 600K"),
    TestCase("Can I edit my listing after publishing it?", "SUPPORT", None, "english", "english_adv", "EA03", "English: edit after publish"),
    TestCase("Show me properties near universities", "SEARCH", None, "english", "english_adv", "EA04", "English: near universities"),
    TestCase("How do I contact the property owner?", "SUPPORT", None, "english", "english_adv", "EA05", "English: contact owner"),
    TestCase("What are the best neighborhoods for students in Rabat?", "NEIGHBORHOOD_INFO", "Rabat", "english", "english_adv", "EA06", "English: students Rabat"),
    TestCase("I'd like to save this apartment to my favorites", "FAVORITES", None, "english", "english_adv", "EA07", "English: save to favorites"),
    TestCase("How much is the average rent for a studio in Agadir?", "PRICE_CHECK", "Agadir", "english", "english_adv", "EA08", "English: avg rent Agadir"),
    TestCase("I want to list my villa for sale", "CREATE_LISTING", None, "english", "english_adv", "EA09", "English: list villa sale"),
    TestCase("Tell me about the history of Morocco", "OUT_OF_SCOPE", None, "english", "english_adv", "EA10", "English: out of scope history"),
]

# ── 10 SUPPORT ──
SUPPORT_ADVANCED = [
    TestCase("j'ai oublié mon mot de passe comment faire", "SUPPORT", None, "french", "support_adv", "SA01", "Support: mdp oublié"),
    TestCase("comment supprimer une annonce que j'ai publiée", "SUPPORT", None, "french", "support_adv", "SA02", "Support: supprimer annonce"),
    TestCase("how do I change my email address on my account", "SUPPORT", None, "english", "support_adv", "SA03", "Support: changer email"),
    TestCase("كيفاش نبدل الرقم ديال التليفون فالكونط", "SUPPORT", None, "arabic", "support_adv", "SA04", "Support: changer téléphone"),
    TestCase("what payment methods do you accept", "SUPPORT", None, "english", "support_adv", "SA05", "Support: modes paiement"),
    TestCase("puis-je reporter une visite prévue", "SUPPORT", None, "french", "support_adv", "SA06", "Support: reporter visite"),
    TestCase("شنو خاصني ندير إلا بغيت نحيد الإعلان ديالي", "SUPPORT", None, "arabic", "support_adv", "SA07", "Support: retirer annonce"),
    TestCase("my account was hacked what should i do", "SUPPORT", None, "english", "support_adv", "SA08", "Support: compte piraté"),
    TestCase("comment fonctionne le système de parrainage", "SUPPORT", None, "french", "support_adv", "SA09", "Support: parrainage"),
    TestCase("واش كاين شي تخفيض على العمولة؟", "SUPPORT", None, "arabic", "support_adv", "SA10", "Support: réduction commission"),
]

# ── 10 CAS PIÈGES ──
TRICKY_CASES = [
    TestCase("Je veux acheter et non publier une annonce", "SEARCH", None, "french", "tricky", "TP01", "Piège: négation + ambiguïté"),
    TestCase("بغيت نشري دار ماشي ننشر إعلان", "SEARCH", None, "arabic", "tricky", "TP02", "Piège: négation Darija"),
    TestCase("Weather in Casablanca today", "OUT_OF_SCOPE", "Casablanca", "english", "tricky", "TP03", "Piège: hors sujet anglais + ville"),
    TestCase("Tell me a joke", "OUT_OF_SCOPE", None, "english", "tricky", "TP04", "Piège: hors sujet simple"),
    TestCase("شحال الثمن ديال الطماطم اليوم؟", "OUT_OF_SCOPE", None, "arabic", "tricky", "TP05", "Piège: hors sujet Darija prix"),
    TestCase("Je cherche un appartement cher à Marrakech", "SEARCH", "Marrakech", "french", "tricky", "TP06", "Piège: adjectif contradictoire"),
    TestCase("I want a cheap luxury villa in Agadir", "SEARCH", "Agadir", "english", "tricky", "TP07", "Piège: oxymoron luxe/pas cher"),
    TestCase("شقق فالرباط ولا الدار البيضاء شحال ثمنهم", "PRICE_CHECK", None, "arabic", "tricky", "TP08", "Piège: deux villes + Darija"),
    TestCase("comment louer et acheter en même temps", "SEARCH", None, "french", "tricky", "TP09", "Question légitime sur l'immobilier"),
    TestCase("looking for apartment or maybe just prices", "SEARCH", None, "english", "tricky", "TP10", "Piège: indécision SEARCH/PRICE"),
]

PARTIE_A_TESTS = DARIJA_ADVANCED + ARABIC_ADVANCED + FRENCH_ADVANCED + ENGLISH_ADVANCED + SUPPORT_ADVANCED + TRICKY_CASES


# ═══════════════════════════════════════════════════════════════════════════════
# PARTIE B — 25 TESTS SPÉCIFIQUES (fournis par l'utilisateur)
# ═══════════════════════════════════════════════════════════════════════════════

PARTIE_B_TESTS = [
    # Darija
    TestCase("بغيت شي حاجة قريبة للكلية ديال الطب ففاس", "SEARCH", "Fes", "arabic", "darija_user", "DB01"),
    TestCase("عندي 2500 درهم شنو نكري فالرباط؟", "SEARCH", "Rabat", "arabic", "darija_user", "DB02"),
    TestCase("واش كاين شي ستوديو ماشي بعيد على الترام؟", "SEARCH", None, "arabic", "darija_user", "DB03"),
    TestCase("بغيت نبيع الدار ديالي كيفاش ندير؟", "CREATE_LISTING", None, "arabic", "darija_user", "DB04"),
    TestCase("شحال خاصني نخلص فالشهر إلى سلفت 300 ألف درهم؟", "MORTGAGE", None, "arabic", "darija_user", "DB05"),
    # Arabe
    TestCase("أبحث عن شقة مناسبة لعائلة مكونة من خمسة أفراد في طنجة", "SEARCH", "Tanger", "arabic", "arabic_user", "AB01"),
    TestCase("ما هي أفضل الأحياء للسكن بالقرب من الجامعة؟", "NEIGHBORHOOD_INFO", None, "arabic", "arabic_user", "AB02"),
    TestCase("أريد نشر إعلان بيع منزل", "CREATE_LISTING", None, "arabic", "arabic_user", "AB03"),
    TestCase("كيف يمكنني التواصل مع صاحب العقار؟", "SUPPORT", None, "arabic", "arabic_user", "AB04"),
    TestCase("ما هي الوثائق المطلوبة لشراء شقة؟", "SUPPORT", None, "arabic", "arabic_user", "AB05"),
    # Français
    TestCase("Je cherche un appartement proche d'une gare", "SEARCH", None, "french", "french_user", "FB01"),
    TestCase("Quel budget faut-il prévoir pour louer à Rabat ?", "PRICE_CHECK", "Rabat", "french", "french_user", "FB02"),
    TestCase("Comment publier une annonce avec plusieurs photos ?", "CREATE_LISTING", None, "french", "french_user", "FB03"),
    TestCase("Je souhaite modifier mon annonce existante", "SUPPORT", None, "french", "french_user", "FB04"),
    TestCase("Quels sont les quartiers les plus calmes de Casablanca ?", "NEIGHBORHOOD_INFO", "Casablanca", "french", "french_user", "FB05"),
    # English
    TestCase("I'm looking for a family-friendly apartment in Tangier", "SEARCH", "Tanger", "english", "english_user", "EB01"),
    TestCase("How much would a mortgage cost for a 600,000 MAD property?", "MORTGAGE", None, "english", "english_user", "EB02"),
    TestCase("Can I edit my listing after publishing it?", "SUPPORT", None, "english", "english_user", "EB03"),
    TestCase("Show me properties near universities", "SEARCH", None, "english", "english_user", "EB04"),
    TestCase("How do I contact the property owner?", "SUPPORT", None, "english", "english_user", "EB05"),
    # Cas pièges
    TestCase("Je veux acheter et non publier une annonce", "SEARCH", None, "french", "tricky_user", "TB01"),
    TestCase("بغيت نشري دار ماشي ننشر إعلان", "SEARCH", None, "arabic", "tricky_user", "TB02"),
    TestCase("Weather in Casablanca today", "OUT_OF_SCOPE", "Casablanca", "english", "tricky_user", "TB03"),
    TestCase("Tell me a joke", "OUT_OF_SCOPE", None, "english", "tricky_user", "TB04"),
    TestCase("شحال الثمن ديال الطماطم اليوم؟", "OUT_OF_SCOPE", None, "arabic", "tricky_user", "TB05"),
]


def send_request(test: TestCase, session_counter: int) -> dict:
    payload = {
        "message": test.message,
        "sessionId": f"adv-{session_counter}",
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


def evaluate(test: TestCase, response: dict) -> dict:
    actual_intent = response.get("intent", "ERROR")
    actual_city = response.get("entities", {}).get("city")
    actual_lang = response.get("language", "unknown")

    intent_match = actual_intent == test.expected_intent

    if test.expected_city is None:
        city_match = True
    else:
        if actual_city:
            city_match = test.expected_city.lower().replace(" ", "") == actual_city.lower().replace(" ", "")
        else:
            city_match = False

    # Language tolerance
    if actual_lang == test.expected_lang:
        lang_match = True
    elif test.expected_lang == "arabic" and actual_lang in ("arabic", "mixed"):
        lang_match = True
    elif test.expected_lang == "french" and actual_lang in ("french", "mixed"):
        lang_match = True
    else:
        lang_match = False

    error = response.get("_error", "")
    overall = intent_match and not error

    return {
        "id": test.id,
        "message": test.message,
        "category": test.category,
        "notes": test.notes,
        "expected_intent": test.expected_intent,
        "actual_intent": actual_intent,
        "expected_city": test.expected_city,
        "actual_city": actual_city,
        "expected_lang": test.expected_lang,
        "actual_lang": actual_lang,
        "intent_match": intent_match,
        "city_match": city_match,
        "lang_match": lang_match,
        "overall_pass": overall,
        "error": error,
        "response_text": response.get("response", "")[:80],
    }


def run_tests(tests: List[TestCase], label: str) -> List[dict]:
    print(f"\n{'='*70}")
    print(f"PARTIE {label} — {len(tests)} tests")
    print(f"{'='*70}")
    results = []
    for i, test in enumerate(tests):
        note = f" ({test.notes})" if test.notes else ""
        print(f"  [{i+1:02d}/{len(tests)}] {test.id}: {test.message[:45]}...", end=" ", flush=True)
        resp = send_request(test, i)
        res = evaluate(test, resp)
        results.append(res)
        status = "✅" if res["overall_pass"] else "❌"
        print(f"{status} intent={res['actual_intent'][:12]:12s} city={str(res['actual_city'])[:10]:10s} lang={res['actual_lang']}")
        time.sleep(2.5)
    return results


def print_report(results: List[dict], label: str):
    total = len(results)
    passed = sum(1 for r in results if r["overall_pass"])
    failed = total - passed
    accuracy = (passed / total) * 100 if total else 0

    by_cat = {}
    by_intent = {}
    for r in results:
        cat = r["category"]
        by_cat.setdefault(cat, {"total": 0, "passed": 0})
        by_cat[cat]["total"] += 1
        if r["overall_pass"]: by_cat[cat]["passed"] += 1

        intent = r["expected_intent"]
        by_intent.setdefault(intent, {"total": 0, "passed": 0})
        by_intent[intent]["total"] += 1
        if r["overall_pass"]: by_intent[intent]["passed"] += 1

    print(f"\n{'='*70}")
    print(f"RAPPORT PARTIE {label}")
    print(f"{'='*70}")
    print(f"Tests: {total} | Succès: {passed} | Échecs: {failed} | Accuracy: {accuracy:.1f}%")
    print(f"Objectif: ≥85% | Statut: {'✅ ATTEINT' if accuracy >= 85 else '❌ NON ATTEINT'}")

    print(f"\n--- Par catégorie ---")
    for cat, s in sorted(by_cat.items()):
        acc = (s["passed"]/s["total"])*100
        print(f"  {cat:20s}: {s['passed']:2d}/{s['total']:2d} = {acc:5.1f}%")

    print(f"\n--- Par intention ---")
    for intent, s in sorted(by_intent.items()):
        acc = (s["passed"]/s["total"])*100
        print(f"  {intent:20s}: {s['passed']:2d}/{s['total']:2d} = {acc:5.1f}%")

    errors = [r for r in results if not r["overall_pass"]]
    if errors:
        print(f"\n--- Erreurs ({len(errors)}) ---")
        for r in errors:
            print(f"  ❌ {r['id']} [{r['category']}] {r['message'][:50]}")
            print(f"     Expected: {r['expected_intent']} | Actual: {r['actual_intent']} | City: {r['actual_city']} | Lang: {r['actual_lang']}")
            if r['error']: print(f"     Error: {r['error']}")
    else:
        print(f"\n--- Aucune erreur ! ---")

    # Confusion matrix
    confusion = {}
    for r in results:
        k = (r["expected_intent"], r["actual_intent"])
        confusion[k] = confusion.get(k, 0) + 1
    print(f"\n--- Matrice de confusion ---")
    for (exp, act), cnt in sorted(confusion.items()):
        mark = "✅" if exp == act else "❌"
        print(f"  {mark} {exp:20s} → {act:20s} : {cnt}")

    print(f"{'='*70}\n")
    return {"total": total, "passed": passed, "failed": failed, "accuracy": accuracy, "errors": errors}


def main():
    print(f"{'='*70}")
    print("TEST AVANCÉ DU CHATBOT MAROC-LOC — PARTIE A + PARTIE B")
    print(f"{'='*70}")

    # Partie A
    results_a = run_tests(PARTIE_A_TESTS, "A")
    report_a = print_report(results_a, "A (60 tests avancés)")

    # Partie B
    results_b = run_tests(PARTIE_B_TESTS, "B")
    report_b = print_report(results_b, "B (25 tests utilisateur)")

    # Global
    all_results = results_a + results_b
    total = len(all_results)
    passed = sum(1 for r in all_results if r["overall_pass"])
    accuracy = (passed / total) * 100
    print(f"{'='*70}")
    print("RÉSULTAT GLOBAL PARTIE A + PARTIE B")
    print(f"{'='*70}")
    print(f"Total: {total} | Succès: {passed} | Échecs: {total-passed} | Accuracy: {accuracy:.1f}%")
    print(f"Objectif: ≥85% | Statut: {'✅ ATTEINT' if accuracy >= 85 else '❌ NON ATTEINT'}")
    print(f"{'='*70}")

    return report_a, report_b


if __name__ == "__main__":
    main()
