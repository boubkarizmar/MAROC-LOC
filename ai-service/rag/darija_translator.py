"""
Darija (Moroccan Arabic) NLP Pipeline

Handles:
- Latin-script Darija transliteration to Arabic script
- Normalization (remove repeated letters, standardize phonetics)
- Code-switching detection (Darija + French + Arabic mixed)
- Query expansion with Moroccan real estate synonyms

Uses rule-based + lightweight ML (no heavy LLM needed for normalization).
"""

import re
import logging
from typing import List, Dict, Tuple, Optional

logger = logging.getLogger(__name__)

# Latin Darija → Arabic mappings (simplified, extendable)
DARIJA_LATIN_TO_ARABIC = {
    "chri": "شراء", "chria": "شراء", "chriha": "اشريها",
    "kri": "كراء", "kria": "كراء", "nqlb": "نقلب",
    "chkon": "شكون", "bach": "باش", "bghit": "بغيت",
    "bghina": "بغينا", "bghaw": "بغاو", "bghiti": "بغيتي",
    "wakha": "واخا", "wakhaa": "واخا", "yalah": "يلا",
    "chof": "شوف", "chouf": "شوف", "choufha": "شوفها",
    "zwin": "زوين", "zwina": "زوينة", "mezyan": "مزيان",
    "khayb": "خايب", "khayba": "خايبة", "mamchatech": "مامشاتش",
    "m3a": "مع", "m3aya": "معايا", "m3ak": "معاك",
    "f": "في", "fel": "فل", "men": "من",
    "l": "ل", "dial": "ديال", "diali": "ديالي",
    "dyal": "ديال", "dyali": "ديالي",
    "3and": "عند", "3andi": "عندي", "3andek": "عندك",
    "safi": "صافي", "sahbi": "صاحبي", "sa7bi": "صاحبي",
    "chno": "شنو", "ch7al": "شحال", "bch7al": "بشحال",
    "ghali": "غالي", "rkhis": "رخيص", "rkhiss": "رخيص",
    "kbir": "كبير", "sghir": "صغير", "megher": "اقل",
    "fo9": "فوق", "te7t": "تحت", "west": "وسط",
    "b7al": "بحال", "bhal": "بحال", "b7alk": "بحالك",
    "3ziz": "عزيز", "3ziza": "عزيزة", "nhar": "نهار",
    "lyom": "اليوم", "ghda": "غدا", "berah": "بارح",
}

# Real estate synonyms for query expansion
SYNONYMS = {
    "appartement": ["شقة", "apartment", "appart", "طابق"],
    "villa": ["فيلا", "منزل", "دار", "maison"],
    "riad": ["رياض", "riad", "دار تقليدية"],
    "studio": ["ستوديو", " Bureau", "مكتب"],
    "terrain": ["أرض", "terrain", "lot", "قطعة أرضية"],
    "jardin": ["حديقة", "jardin", "garden", "verdure"],
    "piscine": ["مسبح", "piscine", "pool", "بركة"],
    "parking": ["موقف سيارات", "parking", "garage", "كراج"],
    "ascenseur": ["مصعد", "ascenseur", "elevator", "lift"],
    "climatisation": ["تكييف", "climatisation", "AC", "air conditionné"],
    "meublé": ["مفروش", "meublé", "furnished", "مؤثث"],
    "casablanca": ["الدار البيضاء", "casablanca", "casa"],
    "rabat": ["الرباط", "rabat"],
    "marrakech": ["مراكش", "marrakech", "marrakesh"],
    "tanger": ["طنجة", "tanger", "tangier"],
    "agadir": ["أكادير", "agadir"],
}

# French/Arabic/English stopwords for real estate
STOPWORDS = {
    "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "en", "au", "aux",
    "el", "ال", "في", "من", "إلى", "على", "مع", "هذا", "هذه", "the", "a", "an", "and", "or", "in", "to",
}


class DarijaTranslator:
    """
    Multilingual query preprocessor for Moroccan real estate search.
    """

    def __init__(self):
        self.darija_map = DARIJA_LATIN_TO_ARABIC
        self.synonyms = SYNONYMS
        self.stopwords = STOPWORDS

    def detect_language(self, text: str) -> str:
        """Detect primary script/language of query."""
        text = text.strip()
        if not text:
            return "unknown"

        arabic_chars = len(re.findall(r"[\u0600-\u06FF]", text))
        latin_chars = len(re.findall(r"[a-zA-Z]", text))
        total = len(text.replace(" ", ""))

        if total == 0:
            return "unknown"

        if arabic_chars / total > 0.5:
            return "arabic"
        if latin_chars / total > 0.5:
            # Distinguish Darija from French/English heuristically
            lower = text.lower()
            darija_markers = sum(1 for k in self.darija_map if k in lower.split())
            if darija_markers >= 1:
                return "darija"
            # French check
            french_words = {"appartement", "villa", "maison", "prix", "chercher", "louer", "acheter"}
            if any(w in lower for w in french_words):
                return "french"
            return "english"
        return "mixed"

    def normalize(self, text: str) -> str:
        """Full normalization pipeline."""
        text = text.lower().strip()
        # Remove repeated characters (>2)
        text = re.sub(r"(.)\1{2,}", r"\1\1", text)
        # Normalize numbers
        text = re.sub(r"(\d)([a-zA-Z])", r"\1 \2", text)
        return text

    def transliterate_darija(self, text: str) -> str:
        """Convert Latin-script Darija to Arabic script."""
        words = text.lower().split()
        converted = []
        for word in words:
            # Exact match
            if word in self.darija_map:
                converted.append(self.darija_map[word])
                continue
            # Partial match (prefix/suffix)
            matched = False
            for latin, arabic in sorted(self.darija_map.items(), key=lambda x: -len(x[0])):
                if latin in word:
                    converted.append(arabic)
                    matched = True
                    break
            if not matched:
                converted.append(word)
        return " ".join(converted)

    def expand_synonyms(self, text: str) -> List[str]:
        """Expand query with real estate synonyms."""
        words = text.lower().split()
        expansions = set(words)
        for word in words:
            for key, synonyms in self.synonyms.items():
                if word == key or word in [s.lower() for s in synonyms]:
                    expansions.update([s.lower() for s in synonyms])
                    expansions.add(key)
        return list(expansions)

    def remove_stopwords(self, text: str) -> str:
        """Remove language stopwords."""
        words = text.split()
        filtered = [w for w in words if w.lower() not in self.stopwords]
        return " ".join(filtered)

    def process(self, text: str) -> Dict:
        """Full pipeline: detect → normalize → transliterate → expand → clean."""
        lang = self.detect_language(text)
        normalized = self.normalize(text)

        if lang == "darija":
            arabic = self.transliterate_darija(normalized)
            expanded = self.expand_synonyms(arabic)
            clean = self.remove_stopwords(" ".join(expanded))
            return {
                "original": text,
                "language": lang,
                "normalized": normalized,
                "arabic": arabic,
                "expanded": expanded,
                "clean_query": clean,
            }

        expanded = self.expand_synonyms(normalized)
        clean = self.remove_stopwords(" ".join(expanded))
        return {
            "original": text,
            "language": lang,
            "normalized": normalized,
            "arabic": None,
            "expanded": expanded,
            "clean_query": clean,
        }


_translator: Optional[DarijaTranslator] = None


def get_darija_translator() -> DarijaTranslator:
    global _translator
    if _translator is None:
        _translator = DarijaTranslator()
    return _translator
