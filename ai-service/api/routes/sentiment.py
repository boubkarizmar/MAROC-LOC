"""
Sentiment Analysis Router
Multilingual rule-based sentiment for French, Arabic, English, and Darija.
Optimized for real estate review comments.
"""

from fastapi import APIRouter, HTTPException, Request
from core.limiter import limiter
from schemas.sentiment_models import SentimentRequest, SentimentResponse
import re
import logging

router = APIRouter(prefix="/sentiment", tags=["sentiment"])
logger = logging.getLogger(__name__)

# Multilingual sentiment lexicons
POSITIVE_WORDS = {
    # French
    "excellent", "parfait", "superbe", "magnifique", "belle", "beau", "agréable",
    "confortable", "propre", "lumineux", "spacieux", "moderne", "calme", "sécurisé",
    "recommande", "recommandé", "génial", "fantastique", "merveilleux", "satisfait",
    "content", "heureux", "rapide", "efficace", "propriétaire sympa", "bon", "bonne",
    "très bien", " nickel", "top", "qualité", "propre", "charmant", "idéal",
    # English
    "excellent", "perfect", "great", "amazing", "beautiful", "clean", "comfortable",
    "spacious", "modern", "bright", "quiet", "safe", "secure", "recommended",
    "awesome", "fantastic", "wonderful", "satisfied", "happy", "fast", "efficient",
    "nice", "good", "lovely", "ideal", "charming", "stunning", "impressive",
    # Arabic / Darija (Latin transliteration)
    "mezyan", "mzyan", "bzaf", "bzzaf", "waaa", "wa3er", "wah", "zwin", "zwina",
    "nqi", "naqi", "nadi", "nadia", "mohim", "mohimm", "meh", "m3gool", "me3gool",
    "safi", "sahbi", "sahbiya", "lhoub", "l7ob", "3ziz", "aziz", "chi haja mezyana",
    "wakha", "wakhaa", "mochkil", "mochkil", "zwin bzaf", "nade", "nadi",
    # Arabic script (common in reviews)
    "جيد", "ممتاز", "رائع", "جميل", "نظيف", "واسع", "مريح", "آمن", "مثالي",
    " perfect", " best", " love", " like", " recommend",
}

NEGATIVE_WORDS = {
    # French
    "mauvais", "horrible", "désastre", "sale", "bruyant", "petit", "étroit",
    "vieux", "ancien", "dégradé", "problème", "problèmes", "moisissure",
    "insalubre", "dangereux", "inquiet", "mécontent", "insatisfait", "lent",
    "inefficace", "arnaque", "tromperie", "éviter", "déconseillé", "cher",
    "trop cher", "surfait", "nuisance", "bruit", "froid", "humide", "fuite",
    # English
    "bad", "terrible", "horrible", "disaster", "dirty", "noisy", "small", "narrow",
    "old", "degraded", "problem", "problems", "mold", "unsanitary", "dangerous",
    "worried", "unhappy", "dissatisfied", "slow", "inefficient", "scam", "fraud",
    "avoid", "not recommended", "expensive", "overpriced", "nuisance", "noise",
    "cold", "damp", "leak", "broken", "damaged", "poor", "awful", "worst",
    # Arabic / Darija (Latin transliteration)
    "khayb", "khayba", "mochkil", "mochkila", "wesekh", "wesekha", "9assi",
    "9assiya", "3ati9", "3atiqa", "dya3", "dya3a", "mamakanech", "mamakanche",
    "s3ib", "s3iba", "mabghitech", "mabghitich", "ma3jebnich", "ma3jebnish",
    "ma3andoch", "ma3andoch", "ghali", "ghalia", "khaser", "khasra",
    # Arabic script
    "سيء", "سيئة", "مشكل", "مشكلة", "وسخ", "قذر", "ضيق", "قديم", "خسارة",
    "صعب", "غالي", "غالية", "كاسر", "ماعجبنيش", "ماعجبنيش", "ماكاينش",
    " worst", " hate", " dislike", " never", " disappointed",
}

# Intensifiers multiply the sentiment score
INTENSIFIERS = {
    "très", "trop", "vraiment", "extrêmement", "absolument", "totalement",
    "complètement", "ultra", "super", "hyper", "really", "very", "extremely",
    "absolutely", "totally", "completely", "highly", "quite", "rather",
    "bzzaf", "bzaf", "bzf", "bzez", "waaayed", "waayed", "3ziz", "bzaf",
    "جدا", "كثيرا", "بزاف", "بزز", "واعر",
}

# Negation flips sentiment
NEGATIONS = {
    "pas", "ne", "non", "jamais", "rien", "aucun", "aucune", "not", "no", "never",
    "none", "nothing", "neither", "ma", "machi", "machi", "ma3andoch", "ma3andoch",
    "ما", "ماشي", "مكاينش", "ولا",
}


def detect_language(text: str) -> str:
    """Simple language detection based on script and keywords."""
    text_lower = text.lower()
    arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    if arabic_chars > 3:
        return "arabic"
    french_words = sum(1 for w in ["le", "la", "et", "de", "un", "une", "très", "bon", "mauvais"] if w in text_lower)
    english_words = sum(1 for w in ["the", "and", "of", "a", "an", "very", "good", "bad"] if w in text_lower)
    darija_words = sum(1 for w in ["mezyan", "khayb", "bzaf", "wakha", "safi", "zwin", "mochkil"] if w in text_lower)
    if darija_words > 1:
        return "darija"
    if french_words > english_words:
        return "french"
    return "english"


def analyze_sentiment(text: str) -> dict:
    """Rule-based multilingual sentiment analysis."""
    text_lower = text.lower()
    words = re.findall(r"[\w\u0600-\u06FF]+", text_lower)

    pos_score = 0.0
    neg_score = 0.0
    pos_found = []
    neg_found = []
    negation_active = False
    intensifier = 1.0

    for i, word in enumerate(words):
        if word in NEGATIONS:
            negation_active = True
            continue
        if word in INTENSIFIERS:
            intensifier = 1.5
            continue

        score = 0.0
        if word in POSITIVE_WORDS:
            score = 0.3 * intensifier
            if negation_active:
                score = -score
                negation_active = False
            pos_score += score
            pos_found.append(word)
        elif word in NEGATIVE_WORDS:
            score = 0.3 * intensifier
            if negation_active:
                score = -score
                negation_active = False
            neg_score += score
            neg_found.append(word)

        # Reset modifiers after a few words (window of 2)
        if word not in INTENSIFIERS and word not in NEGATIONS:
            intensifier = 1.0
            window_start = max(0, i - 2)
            if not any(w in NEGATIONS for w in words[window_start:i]):
                negation_active = False

    # Also check multi-word phrases
    for phrase in POSITIVE_WORDS:
        if " " in phrase and phrase in text_lower:
            pos_score += 0.5
            pos_found.append(phrase)
    for phrase in NEGATIVE_WORDS:
        if " " in phrase and phrase in text_lower:
            neg_score += 0.5
            neg_found.append(phrase)

    raw_score = pos_score - neg_score
    # Normalize to [-1, 1]
    score = max(-1.0, min(1.0, raw_score))

    if score > 0.15:
        label = "POSITIVE"
    elif score < -0.15:
        label = "NEGATIVE"
    else:
        label = "NEUTRAL"

    confidence = min(1.0, abs(raw_score) + 0.5)

    return {
        "label": label,
        "score": round(score, 3),
        "confidence": round(confidence, 3),
        "positive_words": pos_found,
        "negative_words": neg_found,
    }


@router.post("/analyze", response_model=SentimentResponse)
@limiter.limit("60/minute")
async def analyze_sentiment_endpoint(request: Request, sentiment_request: SentimentRequest):
    try:
        text = sentiment_request.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        lang = sentiment_request.language if sentiment_request.language != "auto" else detect_language(text)
        result = analyze_sentiment(text)

        return SentimentResponse(
            label=result["label"],
            score=result["score"],
            confidence=result["confidence"],
            language_detected=lang,
            positive_words=result["positive_words"],
            negative_words=result["negative_words"],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")


@router.post("/batch")
@limiter.limit("30/minute")
async def analyze_sentiment_batch(request: Request, texts: list[str]):
    """Analyze sentiment for multiple texts at once."""
    try:
        results = []
        for text in texts:
            result = analyze_sentiment(text)
            results.append({
                "text": text[:100],
                "label": result["label"],
                "score": result["score"],
                "confidence": result["confidence"],
            })
        return {"results": results}
    except Exception as e:
        logger.error(f"Batch sentiment analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")
