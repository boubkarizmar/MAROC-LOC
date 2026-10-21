"""
Evaluate the MAROC-LOC RAG pipeline.

Usage (inside marocloc-ai container):
    python scripts/evaluate_rag.py

Outputs:
    /app/rag_evaluation_results.json
    /app/rag_evaluation_summary.txt
"""

import sys
import os
import json
import random
from typing import List, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.postgres_store import postgres_store
from services.rag_service import get_rag_pipeline


# ---------------------------------------------------------------------------
# Query generation
# ---------------------------------------------------------------------------


def make_property_queries(properties: List[Dict[str, Any]], n_per_lang: int = 20) -> List[Dict[str, Any]]:
    """Generate multilingual property search queries from real listings."""
    samples = random.sample(properties, min(n_per_lang, len(properties)))
    queries = []
    templates = {
        "fr": [
            "{category} à {city}",
            "{type} {category} à {city} moins de {max_price} DH",
            "{category} {city} {bedrooms} chambres",
            "cherche {category} à {city}",
            "{category} meublé à {city}",
        ],
        "en": [
            "{category} in {city}",
            "{type} {category} in {city} under {max_price} MAD",
            "{category} {city} {bedrooms} bedrooms",
            "looking for {category} in {city}",
            "furnished {category} in {city}",
        ],
        "ar": [
            "{category} في {city}",
            "{type} {category} في {city} أقل من {max_price} درهم",
            "{category} {city} {bedrooms} غرف",
            "أبحث عن {category} في {city}",
            "{category} مفروش في {city}",
        ],
        "dar": [
            "{category} ف{city}",
            "{type} {category} ف{city} تحت {max_price} درهم",
            "{category} {city} {bedrooms} بيوت نعاس",
            "كنقلب على {category} ف{city}",
            "{category} مفروش ف{city}",
        ],
    }

    for prop in samples:
        for lang, tlist in templates.items():
            t = random.choice(tlist)
            max_price = int(float(prop.get("price") or 0) * 1.2) + 1
            q = t.format(
                category=(prop.get("category") or "bien").lower(),
                type=(prop.get("type") or "").lower(),
                city=prop.get("city", ""),
                max_price=max_price,
                bedrooms=prop.get("bedrooms") or 1,
            )
            queries.append({
                "query": q,
                "lang": lang,
                "expected_doc_id": f"property_{prop['id']}",
                "expected_meta": {
                    "city": prop.get("city", ""),
                    "category": prop.get("category", ""),
                    "type": prop.get("type", ""),
                    "price": float(prop.get("price") or 0),
                },
                "type": "property",
            })
    return queries


def make_faq_queries(n_per_lang: int = 5) -> List[Dict[str, Any]]:
    """Generate FAQ queries in 4 languages."""
    queries = []
    faq_items = [
        {
            "id": "faq_visite",
            "fr": "comment visiter un appartement",
            "en": "how to schedule a visit",
            "ar": "كيف أزور العقار",
            "dar": "كيفاش ندير زيارة",
        },
        {
            "id": "faq_contact_owner",
            "fr": "comment contacter le propriétaire",
            "en": "how to contact owner",
            "ar": "كيف أتواصل مع المالك",
            "dar": "كيفاش نواصل صاحب الدار",
        },
        {
            "id": "faq_paiement",
            "fr": "comment payer sur MAROC-LOC",
            "en": "how to pay on MAROC-LOC",
            "ar": "كيف أدفع على MAROC-LOC",
            "dar": "كيفاش نخلص فMAROC-LOC",
        },
        {
            "id": "faq_documents",
            "fr": "documents pour louer",
            "en": "documents required to rent",
            "ar": "وثائق الإيجار",
            "dar": "وثايق الكراء",
        },
        {
            "id": "faq_publier",
            "fr": "comment publier une annonce",
            "en": "how to publish a listing",
            "ar": "كيف أنشر إعلان",
            "dar": "كيفاش نحط إعلان",
        },
    ]
    for item in faq_items:
        for lang in ["fr", "en", "ar", "dar"]:
            queries.append({
                "query": item[lang],
                "lang": lang,
                "expected_doc_id": item["id"],
                "type": "faq",
            })
    return queries


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------


def _matches_property_criteria(result_meta: Dict[str, Any], expected_meta: Dict[str, Any]) -> bool:
    """A retrieved property is relevant if it matches the expected city/category/type and similar price."""
    if result_meta.get("source") != "property":
        return False
    price = float(result_meta.get("price") or 0)
    expected_price = expected_meta.get("price", 0)
    price_ok = abs(price - expected_price) <= 0.20 * max(expected_price, 1)
    return (
        result_meta.get("city") == expected_meta.get("city")
        and result_meta.get("category") == expected_meta.get("category")
        and result_meta.get("type") == expected_meta.get("type")
        and price_ok
    )


def evaluate_query(pipeline, q: Dict[str, Any], use_mmr: bool, top_ks=(1, 3, 5)) -> Dict[str, Any]:
    filters = None
    if q["type"] == "property" and q.get("expected_meta"):
        meta = q["expected_meta"]
        filters = {}
        if meta.get("city"):
            filters["city"] = meta["city"]
        if meta.get("category"):
            filters["category"] = meta["category"]
        if meta.get("type"):
            filters["type"] = meta["type"]
        if meta.get("price"):
            filters["price_min"] = float(meta["price"]) * 0.5
            filters["price_max"] = float(meta["price"]) * 1.5

    results = pipeline.search(
        query=q["query"],
        top_k=max(top_ks),
        filters=filters,
        use_mmr=use_mmr,
        fetch_k=50,
    )
    retrieved = results
    expected_prefix = q["expected_doc_id"] + "_chunk_"
    expected_meta = q.get("expected_meta")

    def is_relevant(r: Dict[str, Any]) -> bool:
        if r["id"].startswith(expected_prefix):
            return True
        if q["type"] == "property" and expected_meta:
            return _matches_property_criteria(r.get("metadata", {}), expected_meta)
        return False

    first_rank = None
    for rank, r in enumerate(retrieved, start=1):
        if is_relevant(r):
            first_rank = rank
            break

    per_k = {}
    for k in top_ks:
        in_top = any(is_relevant(r) for r in retrieved[:k])
        per_k[f"top{k}"] = int(in_top)
        per_k[f"recall@{k}"] = 1.0 if in_top else 0.0

    return {
        "query": q["query"],
        "lang": q["lang"],
        "type": q["type"],
        "use_mmr": use_mmr,
        "first_rank": first_rank,
        **per_k,
        "mrr": 1.0 / first_rank if first_rank else 0.0,
    }


def aggregate(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    by_lang = {}
    for r in rows:
        lang = r["lang"]
        by_lang.setdefault(lang, []).append(r)

    summary = {}
    for lang, lrows in by_lang.items():
        n = len(lrows)
        summary[lang] = {
            "count": n,
            "top1": round(sum(r["top1"] for r in lrows) / n * 100, 1),
            "top3": round(sum(r["top3"] for r in lrows) / n * 100, 1),
            "recall@5": round(sum(r["recall@5"] for r in lrows) / n * 100, 1),
            "mrr": round(sum(r["mrr"] for r in lrows) / n, 3),
        }
    summary["overall"] = {
        "count": len(rows),
        "top1": round(sum(r["top1"] for r in rows) / len(rows) * 100, 1),
        "top3": round(sum(r["top3"] for r in rows) / len(rows) * 100, 1),
        "recall@5": round(sum(r["recall@5"] for r in rows) / len(rows) * 100, 1),
        "mrr": round(sum(r["mrr"] for r in rows) / len(rows), 3),
    }
    return summary


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    print("Initializing RAG pipeline...")
    pipeline = get_rag_pipeline()
    if not pipeline.initialize():
        print("ERROR: RAG pipeline failed to initialize.", file=sys.stderr)
        sys.exit(1)

    count = pipeline.count()
    print(f"Collection contains {count} chunks.")
    if count == 0:
        print("ERROR: Knowledge base is empty. Run build_rag_knowledge_base.py first.", file=sys.stderr)
        sys.exit(1)

    print("Loading properties for test query generation...")
    properties = postgres_store.load_properties(limit=10000)
    random.seed(42)

    queries = make_property_queries(properties, n_per_lang=20)
    queries.extend(make_faq_queries())
    random.shuffle(queries)
    print(f"Generated {len(queries)} evaluation queries.")

    print("Evaluating WITHOUT MMR...")
    rows_no_mmr = [evaluate_query(pipeline, q, use_mmr=False) for q in queries]

    print("Evaluating WITH MMR...")
    rows_mmr = [evaluate_query(pipeline, q, use_mmr=True) for q in queries]

    results = {
        "without_mmr": {
            "rows": rows_no_mmr,
            "summary": aggregate(rows_no_mmr),
        },
        "with_mmr": {
            "rows": rows_mmr,
            "summary": aggregate(rows_mmr),
        },
    }

    out_json = "/app/rag_evaluation_results.json"
    out_txt = "/app/rag_evaluation_summary.txt"

    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    lines = []
    lines.append("MAROC-LOC RAG Evaluation Report")
    lines.append("=" * 50)
    lines.append(f"Total queries: {len(queries)}")
    lines.append(f"Knowledge base chunks: {count}")
    lines.append("")
    for mode in ["without_mmr", "with_mmr"]:
        lines.append(f"--- {mode.upper().replace('_', ' ')} ---")
        summary = results[mode]["summary"]
        for key in ["overall", "fr", "en", "ar", "dar"]:
            if key in summary:
                s = summary[key]
                lines.append(
                    f"{key:>8}: Top-1={s['top1']:>5}%  Top-3={s['top3']:>5}%  "
                    f"Recall@5={s['recall@5']:>5}%  MRR={s['mrr']:>5}"
                )
        lines.append("")

    text = "\n".join(lines)
    with open(out_txt, "w", encoding="utf-8") as f:
        f.write(text)
    print(text)
    print(f"\nSaved: {out_json}, {out_txt}")


if __name__ == "__main__":
    main()
