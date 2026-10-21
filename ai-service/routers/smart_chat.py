"""
Role-Aware Smart Real Estate Chatbot Router

Detects user role and intent, then routes to specialized handlers:
- VISITOR / BUYER / TENANT → property search, recommendations, mortgage
- OWNER / PROPRIETAIRE → listing assistant, pricing, analytics, visits
- GUEST → general info, guided onboarding

Supports: Darija, Arabic, French, English

NEW FEATURES:
- RAG on PostgreSQL: returns real, approved properties only
- Context Memory: merges entities across conversation turns
- Intelligent Recommendations: relevance-scored results
"""

import logging
import re
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, List, Dict, Literal
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Request
from core.limiter import limiter

from rag.darija_translator import get_darija_translator
from rag.memory.conversation_memory import get_conversation_memory, ConversationTurn
from services.property_search_service import get_property_search_service
from services.session_store import session_store
from services.analytics_store import get_analytics_store
from services.rag_service import get_rag_pipeline
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/smart", tags=["smart-chat"])

# Thread pool for blocking ML operations
_retrieval_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="retrieval")

# Intents for which the RAG pipeline should be used (if available)
RAG_INTENTS = {
    'SEARCH', 'EXPLORE', 'COMPARE', 'PRICE_CHECK',
    'NEIGHBORHOOD_INFO', 'SUPPORT', 'GENERAL',
}

# Generic RAG fallback messages that should not override existing templates
RAG_GENERIC_FALLBACKS = {
    "Je peux vous aider à trouver un bien au Maroc. Précisez ville, budget et type.",
    "Je peux vous aider à trouver un bien au Maroc.",
    "I can help you find a property in Morocco. Please specify city, budget, and type.",
    "I can help you find a property in Morocco.",
    "يمكنني مساعدتك في العثور على عقار في المغرب. حدد المدينة والميزانية والنوع.",
    "نقدر نعاونك تلقى عقار فالمغرب. قوليا المدينة والبودجيت والنوع.",
}

# ─── Role & Intent Detection ────────────────────────────────────────

BUYER_KEYWORDS = {
    'fr': ['cherche', 'cherche', 'louer', 'location', 'acheter', 'achat', 'appartement', 'maison', 'villa', 'studio', 'budget', 'pas cher', 'meuble'],
    'ar': ['أبحث', 'إيجار', 'شراء', 'شقة', 'منزل', 'فيلا', 'غرفة', 'رخيص', 'مفروش'],
    'darija': ['بغيت', 'نكري', 'نشري', 'شقة', 'دار', 'ڤيلا', 'بروطو', 'رخيص', 'مفروش', 'كنقلب', 'بغيت نكري', 'بغيت نشري', 'كنبغي', 'كرهن', 'كتاري', 'بغيت نكرهن'],
    'en': ['rent', 'buy', 'looking for', 'apartment', 'house', 'villa', 'studio', 'budget', 'cheap', 'furnished'],
}

OWNER_KEYWORDS = {
    'fr': ['vendre', 'vend', 'publier', 'annonce', 'propriétaire', 'prix conseil', 'boost', 'visite', 'description'],
    'ar': ['أبيع', 'نشر', 'إعلان', 'مالك', 'سعر', 'تعزيز', 'زيارة', 'وصف'],
    'darija': ['نبيع', 'حط', 'إعلان', 'صاحب', 'تمان', 'بوست', 'زيارة', 'وصف'],
    'en': ['sell', 'publish', 'listing', 'owner', 'price suggestion', 'boost', 'visit', 'description'],
}

MORTGAGE_KEYWORDS = {
    'fr': ['crédit', 'prêt', 'banque', 'mensualité', 'taux', 'simulation', 'hypothèque', 'mensualité', 'monthly payment'],
    'ar': ['قرض', 'بنك', 'شهري', 'معدل', 'محاكاة', 'رهن', 'أدفع شهرياً', 'نخلص شهريا'],
    'darija': ['كرادي', 'بنك', 'شهري', 'نسبة', 'حساب', 'رهن', 'نخلص', 'خاصني نخلص'],
    'en': ['mortgage', 'loan', 'bank', 'monthly', 'rate', 'simulation', 'credit', 'monthly payment'],
}

REAL_ESTATE_KEYWORDS = {
    'fr': ['prix', 'quartier', 'appartement', 'maison', 'villa', 'studio', 'terrain', 'location', 'achat', 'louer', 'acheter', 'immobilier', 'bien', 'propriété', 'résidence', 'logement'],
    'ar': ['سعر', 'حي', 'شقة', 'منزل', 'فيلا', 'ستوديو', 'أرض', 'إيجار', 'شراء', 'عقار', 'مالك'],
    'darija': ['تمان', 'ثمن', 'حي', 'شقة', 'دار', 'ڤيلا', 'بروطو', 'ارض', 'كراء', 'شراء', 'عقار', 'صاحب', 'كرهن', 'كتاري', 'نكري', 'نشري', 'كنقلب', 'بغيت'],
    'en': ['price', 'neighborhood', 'apartment', 'house', 'villa', 'studio', 'land', 'rent', 'buy', 'real estate', 'property', 'housing'],
}

NON_REAL_ESTATE_KEYWORDS = [
    'météo', 'weather', 'qu\'il fait', 'cuisiner', 'cooking', 'recette', 'recipe',
    'politique', 'politics', 'sport', 'football', 'actualité', 'news', 'joke', 'blague',
    'amusant', 'funny', 'histoire', 'history du monde', 'history', 'math', 'mathématique', 'physique',
    'chimie', 'biologie', 'programmation', 'code', 'python', 'java', 'javascript',
    'film', 'movie', 'musique', 'music', 'jeu', 'game', 'vidéo', 'video',
    'طقس', 'جو', 'مباراة', 'foot', 'cuisine', 'nourriture', 'food', 'restaurant',
    'voyage', 'travel', 'tourisme', 'vacances', 'holidays', 'santé', 'health', 'médecin',
    'كرة القدم', 'لاعب', 'رياضة', 'sports', 'player', 'joueur', 'équipe', 'team',
    'tomate', 'طماطم', 'tomatoes', 'prix du marché', 'marché', 'market',
]


def detect_role_and_intent(message: str, known_role: Optional[str] = None) -> Dict:
    """Detect user role and intent from message and known context."""
    msg_lower = message.lower()

    # 1. Known role from auth context takes precedence
    if known_role:
        role_map = {
            'proprietaire': 'OWNER',
            'owner': 'OWNER',
            'locataire': 'BUYER',
            'tenant': 'BUYER',
            'buyer': 'BUYER',
            'admin': 'ADMIN',
        }
        detected_role = role_map.get(known_role.lower(), 'GUEST')
    else:
        detected_role = 'GUEST'

    # 2. Override role from message content if no known role
    if detected_role == 'GUEST':
        owner_score = sum(1 for lang_words in OWNER_KEYWORDS.values() for w in lang_words if w in msg_lower)
        buyer_score = sum(1 for lang_words in BUYER_KEYWORDS.values() for w in lang_words if w in msg_lower)
        re_score = sum(1 for lang_words in REAL_ESTATE_KEYWORDS.values() for w in lang_words if w in msg_lower)

        if owner_score > buyer_score and owner_score > 0:
            detected_role = 'OWNER'
        elif buyer_score > 0 or re_score > 0:
            detected_role = 'BUYER'

    # If user explicitly negates owner actions or asks "how to" questions, treat as buyer/guest
    if detected_role == 'OWNER' and not known_role:
        if any(m in msg_lower for m in ['non', 'not', 'pas', 'ماشي', 'لا', 'never', 'jamais']):
            detected_role = 'BUYER'
        elif any(m in msg_lower for m in ['how do', 'how can', 'can i', 'what should', 'what do', 'what is', 'what are', 'comment', 'help', 'aide', 'guide', 'كيف', 'كيفاش', 'هل', 'شنو', 'shno', 'what about', 'tell me about']):
            detected_role = 'BUYER'

    # Detect language early (needed for guardrail and response)
    translator = get_darija_translator()
    processed = translator.process(message)
    detected_lang = processed.get('language', 'french')

    # 3. Detect intent
    intent = 'GENERAL'
    confidence = 0.5

    # Helper: word-boundary matching to avoid substring false positives
    _ARABIC_LETTERS_RE = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')

    def _has_keyword(msg: str, keywords: list) -> bool:
        for w in keywords:
            if not w:
                continue
            has_arabic = bool(_ARABIC_LETTERS_RE.search(w))
            if has_arabic:
                if w in msg or msg.startswith(w) or msg.endswith(w):
                    return True
            else:
                if re.search(r'\b' + re.escape(w) + r'\b', msg):
                    return True
        return False

    def _mod_word_in_msg(msg: str, mod_words: list) -> bool:
        """Check if any modification word appears as a whole word (not substring)."""
        for w in mod_words:
            if not w:
                continue
            if w not in msg:
                continue
            idx = msg.find(w)
            if idx > 0 and msg[idx - 1].isalnum():
                continue
            end = idx + len(w)
            if end < len(msg) and msg[end].isalnum():
                continue
            return True
        return False

    # Guardrail: detect non-real-estate queries FIRST
    non_re_score = sum(1 for kw in NON_REAL_ESTATE_KEYWORDS if kw in msg_lower)
    if non_re_score >= 1:
        intent = 'OUT_OF_SCOPE'
        confidence = 0.9
        return {
            'role': detected_role,
            'intent': intent,
            'confidence': confidence,
            'language': detected_lang,
        }

    # Support keywords
    _support_kw = [
        'contact', 'aide', 'help', 'comment', 'how to', 'how do', 'how can',
        'guide', 'document', 'papier', 'proprietaire', 'proprietaire',
        'telephone', 'telephone', 'appeler', 'numero', 'numero',
        'كيفاش', 'كيف', 'هل يمكنني', 'هل', 'مساعدة', 'مشكل', 'problem',
        'نسيت', 'أنسيت', 'تواصل', 'اتصل', 'زيارة', 'visite',
        'وثائق', 'documents', 'بلاغ', 'signal',
        'ضمانة', 'caution', 'connexion', 'compte',
        'mot de passe', 'password', 'reset', 'upload', 'photos', 'images',
        'modifier', 'supprimer', 'changer', 'بدل', 'تغيير', 'تعديل', 'after', 'بعد',
        'connecter', 'login', 'se connecter',
        'pieces', 'required', 'requises', 'payer', 'payment', 'plusieurs fois',
        'كونط', 'بلغ', 'report', 'signaler', 'نزور', 'nzour',
        'programme', 'referral', 'visit', 'hacked', 'hack', 'piraté', 'account',
        'تخفيض', 'عمولة', 'commission', 'réduction', 'discount', 'promo',
        'edit', 'publishing', 'خاصني', 'إلا', 'نحيد',
    ]
    _create_kw = ['publier', 'نشر إعلان', 'publish', 'creer', 'create', 'ajouter', 'للبيع', 'vendre', 'sell', 'بيع', 'annonce de vente', 'mettre en vente', 'put up for sale', 'create a listing', 'إعلان للبيع', 'en vente', 'vente', 'for sale']
    _mod_words = ['modifier', 'supprimer', 'changer', 'upload', 'بدل', 'تغيير', 'تعديل', 'تبديل', 'change', 'delete', 'remove', 'edit', 'non', 'not', 'pas', 'ماشي', 'retirer']
    # Early Mortgage detection for very specific phrases that would otherwise fall into PRICE_CHECK
    if _has_keyword(msg_lower, ['mensualité', 'monthly payment', 'نخلص شهريا', 'أدفع شهرياً', 'خاصني نخلص', 'nkhles', 'adfa3', 'شهريا', 'mortgage', 'mortgage cost', 'cost for a', 'قرض عقاري']):
        intent = 'MORTGAGE'
        confidence = 0.9
    # Price check detection (for all roles)
    elif _has_keyword(msg_lower, ['prix', 'price', 'taman', 'تمان', 'ثمن', 'combien', 'coûte', 'coute', 'tarif', 'budget', 'moyen', 'average', 'شحال', 'bch7al', 'بشحال', 'سعر', 'بكم', 'كم', 'how much', 'prices', 'loyer']):
        intent = 'PRICE_CHECK'
        confidence = 0.85
    # Mortgage detection (broader)
    elif any(_has_keyword(msg_lower, words) for words in MORTGAGE_KEYWORDS.values()):
        intent = 'MORTGAGE'
        confidence = 0.9
    # Favorites detection (before SUPPORT to avoid "how to save" being classified as support)
    elif _has_keyword(msg_lower, ['favori', 'favorite', 'مفضل', 'saved', 'حفظ', 'sauvegarder', 'save', 'المفضلين', 'المفضلة']):
        intent = 'FAVORITES'
        confidence = 0.8
    # Create listing detection (before SUPPORT)
    elif _has_keyword(msg_lower, _create_kw) and not _mod_word_in_msg(msg_lower, _mod_words):
        intent = 'CREATE_LISTING'
        confidence = 0.85
    elif _has_keyword(msg_lower, _support_kw):
        intent = 'SUPPORT'
        confidence = 0.8
    # Owner intents
    elif detected_role == 'OWNER':
        if _has_keyword(msg_lower, ['prix', 'conseil', 'taman', 'سعر', 'price', 'suggest']):
            intent = 'PRICE_SUGGEST'
        elif _has_keyword(msg_lower, ['description', 'وصف', 'desc']):
            intent = 'DESCRIPTION_GENERATE'
        elif _has_keyword(msg_lower, ['boost', 'promouvoir', 'promote', 'تعزيز']):
            intent = 'PROMOTION'
        elif _has_keyword(msg_lower, ['visite', 'زيارة', 'visit']):
            intent = 'VISIT_SUMMARY'
        elif _has_keyword(msg_lower, ['publier', 'نشر', 'publish', 'creer', 'create', 'ajouter', 'للبيع', 'vendre', 'sell', 'بيع']) and not _mod_word_in_msg(msg_lower, _mod_words):
            intent = 'CREATE_LISTING'
        elif _has_keyword(msg_lower, ['vue', 'view', 'مشاهدة', 'performance', 'stats']):
            intent = 'ANALYTICS'
        else:
            intent = 'OWNER_ASSISTANT'
            confidence = 0.7
    # Buyer / Guest intents
    elif detected_role in ['BUYER', 'GUEST']:
        if _has_keyword(msg_lower, ['cherche', 'بغيت', 'looking', 'أبحث', 'search', 'كنقلب', 'نقلب', 'trouve', 'trouver', 'أريد', 'عايز', 'je veux', 'i want', 'ndir', 'بغيت نكري', 'بغيت نشري', 'بغيت نكرهن', 'أبحث عن', 'looking for', 'rent in', 'louer à', 'louer un', 'louer une', 'cheap', 'pas cher', 'à louer', 'نكري', 'nkri', 'knkri', 'ناخري', 'واش كاين', 'واش', 'شي', 'عندي', 'show me', 'properties', 'near', 'university', 'universities', 'acheter', 'buy', 'purchase', 'شراء', 'نشري', 'louer', 'rent', 'location', 'إيجار', 'كراء']):
            intent = 'SEARCH'
            confidence = 0.9
        else:
            # Fallback: if message contains both a property type and a city, treat as SEARCH
            extracted = extract_entities(message, detected_lang)
            if extracted.get('city') and extracted.get('property_type'):
                intent = 'SEARCH'
                confidence = 0.75
            elif _has_keyword(msg_lower, ['comparer', 'compare', 'مقارنة']):
                intent = 'COMPARE'
                confidence = 0.8
            elif _has_keyword(msg_lower, ['quartier', 'quartiers', 'حي', 'أحياء', 'neighborhood', 'neighborhoods', 'zone', 'endroit', 'area', 'أحسن', 'أفضل', 'meilleurs', 'best', 'good']):
                intent = 'NEIGHBORHOOD_INFO'
                confidence = 0.8
            else:
                intent = 'EXPLORE'
                confidence = 0.6

    return {
        'role': detected_role,
        'intent': intent,
        'confidence': confidence,
        'language': detected_lang,
    }


def extract_entities(message: str, lang: str) -> Dict:
    """Extract real estate entities from user message."""
    msg_lower = message.lower()
    entities = {
        'city': None,
        'min_price': None,
        'max_price': None,
        'property_type': None,
        'transaction_type': None,
        'bedrooms': None,
        'surface_min': None,
        'surface_max': None,
        'furnished': None,
        'neighborhood': None,
    }

    # City extraction - Moroccan cities
    _prep_split_re = re.compile(
        r'([\u0600-\u06FF])(ف|ب|ل|لل|من|عند|على)([\u0600-\u06FF])'
    )
    msg_normalized = _prep_split_re.sub(r'\1 \2\3', msg_lower)
    msg_normalized = re.sub(
        r'\b(ف|ب|ل|لل|من|عند|على)([\u0600-\u06FF])',
        r' \1 \2',
        msg_normalized
    )

    CITY_ALIASES = {
        'casablanca': ['casablanca', 'casa', 'كازا', 'الدار البيضاء', 'dar el beida'],
        'rabat': ['rabat', 'الرباط'],
        'marrakech': ['marrakech', 'مراكش', 'marrakesh'],
        'fes': ['fes', 'fez', 'فاس'],
        'tanger': ['tanger', 'tangier', 'طنجة'],
        'agadir': ['agadir', 'أكادير'],
        'meknes': ['meknes', 'مكناس'],
        'tetouan': ['tetouan', 'تطوان'],
        'kenitra': ['kenitra', 'القنيطرة'],
        'mohammedia': ['mohammedia', 'المحمدية'],
        'oujda': ['oujda', 'وجدة'],
        'nador': ['nador', 'الناظور'],
        'el jadida': ['el jadida', 'الجديدة', 'mazagan'],
        'larache': ['larache', 'العرائش'],
        'settat': ['settat', 'سطات'],
        'beni mellal': ['beni mellal', 'بني ملال'],
        'taza': ['taza', 'تازة'],
        'guelmim': ['guelmim', 'كلميم'],
        'tiznit': ['tiznit', 'تزنيت'],
        'taroudant': ['taroudant', 'تارودانت'],
        'al hoceima': ['al hoceima', 'الحسيمة'],
        'ouarzazate': ['ouarzazate', 'ورزازات'],
        'ifrane': ['ifrane', 'إفران'],
        'essaouira': ['essaouira', 'الصويرة', 'mogador'],
        'chefchaouen': ['chefchaouen', 'شفشاون'],
        'ksar el kebir': ['ksar el kebir', 'قصر الكبير'],
        'safi': ['safi', 'آسفي'],
        'khouribga': ['khouribga', 'خريبكة'],
    }
    for canonical, aliases in CITY_ALIASES.items():
        if any(alias in msg_lower or alias in msg_normalized for alias in aliases):
            entities['city'] = canonical.title()
            break

    # Price extraction
    price_patterns = [
        r'(\d[\d\s.,]*)(?:\s*)(?:dh|mad|درهم|د\.م|دينار)',
        r'(?:budget|prix|taman|سعر|price)\s*(?:de|:)?\s*(\d[\d\s.,]*)',
        r'(?:moins|under|less|أقل|تحت|اقل|inferieur|inférieur)\s*(?:de|:|a|à)?\s*(\d[\d\s.,]*)',
        r'(?:ب|بـ|ب )(\d[\d\s.,]*)\s*(?:dh|mad|درهم|د\.م)',
    ]
    prices_found = []
    has_under_keyword = any(w in msg_lower for w in ['moins', 'under', 'less', 'أقل', 'تحت', 'اقل', 'inferieur', 'inférieur'])

    for pattern in price_patterns:
        matches = re.findall(pattern, msg_lower)
        for match in matches:
            try:
                price_str = match.replace(' ', '').replace(',', '').replace('.', '')
                price = int(price_str)
                if price >= 100:
                    prices_found.append(price)
            except ValueError:
                continue

    # Deduplicate and sort prices
    unique_prices = sorted(set(prices_found))

    if unique_prices:
        if has_under_keyword:
            # If "moins de/under/less/أقل" is present, treat as max_price only
            entities['max_price'] = unique_prices[0]
            entities['min_price'] = None
        elif len(unique_prices) == 1:
            entities['max_price'] = unique_prices[0]
        else:
            entities['min_price'] = unique_prices[0]
            entities['max_price'] = unique_prices[-1]

    # Property type
    type_keywords = {
        'APARTMENT': ['appartement', 'شقة', 'apartment', 'appart', 'بروطو'],
        'HOUSE': ['maison', 'dar', 'منزل', 'house', 'villa', 'ڤيلا', 'فيلا', 'duplex', 'triplex'],
        'STUDIO': ['studio', 'ستوديو', 'ستوديو'],
        'OFFICE': ['bureau', 'office', 'مكتب'],
        'SHOP': ['magasin', 'shop', 'commerce', 'محل'],
        'LAND': ['terrain', 'land', 'أرض'],
    }
    for ptype, keywords in type_keywords.items():
        if any(kw in msg_lower for kw in keywords):
            entities['property_type'] = ptype
            break

    # Transaction type
    rent_keywords = ['louer', 'location', 'إيجار', 'نكري', 'كراء', 'rent', 'rental', 'loue', 'للكراء', 'للإيجار']
    buy_keywords = ['acheter', 'achat', 'شراء', 'نشري', 'buy', 'purchase', 'للبيع', 'بيع']
    if any(kw in msg_lower for kw in rent_keywords):
        entities['transaction_type'] = 'RENT'
    elif any(kw in msg_lower for kw in buy_keywords):
        entities['transaction_type'] = 'BUY'

    # Bedrooms
    bedroom_patterns = [
        r'(\d+)\s*(?:chambre|piece|غرف|room|ch)',
        r'(?:chambre|piece|غرف|room)\s*(\d+)',
        r'(?:ب|بـ|ب )(\d+)\s*(?:غرف|chambre|room)',
        r'(?:بجوج|ب زوج|بزوج)',  # Darija: 2
        r'(?:بوحدة|بواحد|واحد)',  # Darija: 1
        r'(?:بثلاثة|3)',  # 3
    ]
    for pattern in bedroom_patterns:
        match = re.search(pattern, msg_lower)
        if match:
            try:
                val = match.group(1) if match.lastindex and match.group(1) else None
                if val:
                    entities['bedrooms'] = int(val)
                else:
                    # Handle Darija words
                    if 'بجوج' in msg_lower or 'ب زوج' in msg_lower or 'بزوج' in msg_lower:
                        entities['bedrooms'] = 2
                    elif 'بوحدة' in msg_lower or 'بواحد' in msg_lower or 'واحد' in msg_lower:
                        entities['bedrooms'] = 1
                    elif 'بثلاثة' in msg_lower:
                        entities['bedrooms'] = 3
                break
            except ValueError:
                continue

    # Surface
    surface_pattern = r'(\d+)\s*(?:m2|m²|metre|متر)'
    surface_match = re.search(surface_pattern, msg_lower)
    if surface_match:
        try:
            entities['surface_min'] = int(surface_match.group(1))
        except ValueError:
            pass

    # Furnished
    furnished_keywords = ['meuble', 'مفروش', 'furnished', 'meublé']
    if any(kw in msg_lower for kw in furnished_keywords):
        entities['furnished'] = True

    return entities


# ─── Context Memory: Entity Merge ───────────────────────────────────

CHANGE_WORDS = ['changer', 'بدل', 'autre', 'different', 'ماشي هادي', 'ماشي', 'غير', 'autre chose', 'something else', 'new', 'nouveau']


def merge_entities(
    current: Dict,
    previous: Optional[Dict],
    message: str,
) -> Dict:
    """
    Merge current extracted entities with previous session entities.
    Preserves context across conversation turns unless user explicitly changes criteria.
    """
    if not previous:
        return current

    msg_lower = message.lower()
    has_change_word = any(w in msg_lower for w in CHANGE_WORDS)

    merged = dict(previous)  # Start with previous

    # City: keep previous unless new city explicitly mentioned
    if current.get('city'):
        merged['city'] = current['city']
    elif has_change_word and 'city' in merged:
        # Only clear city if change word is combined with city-related context
        pass  # Conservative: don't clear city easily

    # Max price: update if new price found, unless change word suggests clearing
    if current.get('max_price'):
        merged['max_price'] = current['max_price']
    if current.get('min_price'):
        merged['min_price'] = current['min_price']

    # Bedrooms: update if new number found
    if current.get('bedrooms') is not None:
        merged['bedrooms'] = current['bedrooms']

    # Property type: update if new type mentioned
    if current.get('property_type'):
        merged['property_type'] = current['property_type']

    # Transaction type: update if new verb found
    if current.get('transaction_type'):
        merged['transaction_type'] = current['transaction_type']

    # Surface
    if current.get('surface_min'):
        merged['surface_min'] = current['surface_min']
    if current.get('surface_max'):
        merged['surface_max'] = current['surface_max']

    # Furnished
    if current.get('furnished') is not None:
        merged['furnished'] = current['furnished']

    return merged


def get_previous_entities_from_memory(session_id: str) -> Optional[Dict]:
    """Retrieve merged entities from previous turns in the session.

    First checks a dedicated Redis key for merged entities, then falls back
    to scanning conversation history and filtering out null values.
    """
    if not session_id:
        return None

    try:
        memory = get_conversation_memory()
        # 1. Try dedicated Redis entity store first (most accurate)
        redis_key = f"chat:session:{session_id}:entities"
        raw = memory.redis.hgetall(redis_key)
        if raw:
            entities = {}
            for k, v in raw.items():
                # Attempt to restore original types
                if k in ('min_price', 'max_price', 'bedrooms', 'surface_min', 'surface_max'):
                    try:
                        entities[k] = int(v) if '.' not in v else float(v)
                    except ValueError:
                        entities[k] = v
                elif k == 'furnished':
                    entities[k] = v.lower() in ('true', '1', 'yes')
                else:
                    entities[k] = v
            if any(v is not None for v in entities.values()):
                return entities

        # 2. Fallback: scan conversation history for most recent non-null entities
        history = memory.get_history(session_id, limit=10)
        for turn in reversed(history):
            if turn.role == 'user' and turn.entities:
                filtered = {k: v for k, v in turn.entities.items() if v is not None}
                if filtered:
                    return filtered
    except Exception as e:
        logger.warning(f"Could not retrieve previous entities: {e}")
    return None


# ─── Prompt Templates ───────────────────────────────────────────────

PROMPT_TEMPLATES = {
    'OWNER': {
        'CREATE_LISTING': """You are MAROC-LOC AI, a smart business assistant for Moroccan property owners.
Guide the user step-by-step to create a great listing:
1. Suggest an SEO-optimized title
2. Help write a compelling description (ask about key features)
3. Recommend pricing based on location and type
4. Remind about required fields: photos, CIN, phone
Speak in {lang}. Be concise and actionable.""",

        'PRICE_SUGGEST': """You are MAROC-LOC AI Pricing Expert. Analyze the Moroccan real estate market.
Provide a price recommendation with:
- Suggested price range
- Price per m² for the area
- Factors affecting price (location, amenities, condition)
- Market trend (up/down/stable)
Use the pricing data from our market knowledge base.
Speak in {lang}. Be data-driven and concise.""",

        'DESCRIPTION_GENERATE': """You are MAROC-LOC AI Copywriter. Create compelling property descriptions.
Highlight: location benefits, unique features, nearby amenities, lifestyle appeal.
Write in {lang}. Keep it professional yet warm. Max 300 words.""",

        'VISIT_SUMMARY': """You are MAROC-LOC AI Scheduling Assistant. Help the owner manage property visits.
Provide: number of pending visits, suggested time slots, preparation checklist.
Speak in {lang}. Be organized and helpful.""",

        'ANALYTICS': """You are MAROC-LOC AI Analytics Advisor. Analyze property performance.
Explain why views might be low and suggest improvements:
- Photo quality tips
- Price adjustment suggestions
- Title/description optimization
- Boost/promotion recommendations
Speak in {lang}. Be encouraging and specific.""",

        'PROMOTION': """You are MAROC-LOC AI Marketing Advisor. Suggest promotion strategies:
- Featured listing benefits
- Boost timing recommendations
- Social media sharing tips
- Pricing psychology
Speak in {lang}. Be persuasive and data-backed.""",

        'OWNER_ASSISTANT': """You are MAROC-LOC AI, a smart assistant for property owners in Morocco.
You help with: creating listings, pricing, marketing, managing visits, and maximizing revenue.
Be professional, knowledgeable about Moroccan real estate, and speak in {lang}.""",
    },
    'BUYER': {
        'SEARCH': """You are MAROC-LOC AI Property Finder. Help the user find their ideal property.
Acknowledge their criteria, show relevant results, and ask smart follow-ups:
- Budget confirmation
- Preferred neighborhoods
- Must-have features
- Timeline
Speak in {lang}. Be enthusiastic and helpful.""",

        'MORTGAGE': """You are MAROC-LOC AI Mortgage Calculator. Explain Moroccan mortgage options:
- Simulate monthly payments
- Explain required down payment (typically 10-30%)
- Mention bank options (Attijariwafa, BMCE, CIH, etc.)
- Explain taqqafol (gage) process
Speak in {lang}. Be clear and educational.""",

        'NEIGHBORHOOD_INFO': """You are MAROC-LOC AI Neighborhood Guide. Describe Moroccan neighborhoods:
- Safety and family-friendliness
- Proximity to schools, mosques, markets
- Transport access (tram, bus, train)
- Price trends
- Lifestyle vibe
Speak in {lang}. Be descriptive and balanced.""",

        'COMPARE': """You are MAROC-LOC AI Comparison Expert. Help users compare properties.
Highlight: price per m², location pros/cons, amenities, investment potential.
Use a structured format. Speak in {lang}.""",

        'EXPLORE': """You are MAROC-LOC AI, a friendly Moroccan real estate advisor.
Help users discover properties, understand the market, and make informed decisions.
You can search properties, explain neighborhoods, calculate mortgages, and save searches.
Speak in {lang}. Be warm and knowledgeable.""",
    },
    'GUEST': {
        'GENERAL': """You are MAROC-LOC AI, Morocco's smartest real estate assistant.
You help people find, buy, rent, and sell properties across Morocco.
Available in Darija, Arabic, French, and English.
Guide guests to register for personalized recommendations.
Speak in {lang}. Be welcoming and helpful.""",
        'PRICE_CHECK': """You are MAROC-LOC AI Market Expert. Provide accurate real estate pricing information for Moroccan cities.
Use our market knowledge base. Give specific price ranges per m² for rent and purchase.
Speak in {lang}. Be data-driven and concise.""",
        'SUPPORT': """You are MAROC-LOC AI Support Assistant. Help users navigate the platform.
Explain how to contact owners, required documents, account creation, and platform features.
Speak in {lang}. Be clear and helpful.""",
        'OUT_OF_SCOPE': """You are MAROC-LOC AI. Politely explain that you only handle real estate questions.
Suggest real estate topics they can ask about: property search, prices, neighborhoods, mortgages, documents.
Speak in {lang}. Be friendly but firm.""",
    },
}


# ─── Response Builder ───────────────────────────────────────────────

def build_response(role: str, intent: str, entities: Dict, lang: str,
                   properties: List[Dict] = None, context: str = '') -> Dict:
    """Build a structured response with text, actions, and property cards."""

    template_key = intent if intent in PROMPT_TEMPLATES.get(role, {}) else 'OWNER_ASSISTANT' if role == 'OWNER' else 'EXPLORE' if role == 'BUYER' else 'GENERAL'
    system_prompt = PROMPT_TEMPLATES.get(role, {}).get(template_key, PROMPT_TEMPLATES['GUEST']['GENERAL'])
    system_prompt = system_prompt.format(lang=lang)

    # Build quick reply suggestions based on role and intent
    quick_replies = []
    if role == 'BUYER' or role == 'GUEST':
        if intent == 'SEARCH':
            quick_replies = [
                {'label': 'بغيت نكري فكازا', 'action': 'search_rent_casa'},
                {'label': 'Je cherche à Rabat', 'action': 'search_rabat'},
                {'label': 'Villa Marrakech < 2M', 'action': 'search_villa_marrakech'},
                {'label': 'Studio pas cher', 'action': 'search_studio_cheap'},
            ]
        elif intent == 'PRICE_CHECK':
            quick_replies = [
                {'label': 'Casablanca', 'action': 'price_casa'},
                {'label': 'Rabat', 'action': 'price_rabat'},
                {'label': 'Marrakech', 'action': 'price_marrakech'},
                {'label': 'Tanger', 'action': 'price_tanger'},
            ]
        elif intent == 'NEIGHBORHOOD_INFO':
            quick_replies = [
                {'label': 'Casablanca', 'action': 'neighborhood_casa'},
                {'label': 'Rabat', 'action': 'neighborhood_rabat'},
                {'label': 'Marrakech', 'action': 'neighborhood_marrakech'},
            ]
        elif intent == 'MORTGAGE':
            quick_replies = [
                {'label': 'Calculer mensualité', 'action': 'mortgage_calc'},
                {'label': 'Taux actuels', 'action': 'mortgage_rates'},
                {'label': 'Banques partenaires', 'action': 'mortgage_banks'},
            ]
        elif intent == 'SUPPORT':
            quick_replies = [
                {'label': 'Comment contacter', 'action': 'how_to_contact'},
                {'label': 'Documents requis', 'action': 'required_docs'},
                {'label': 'Créer un compte', 'action': 'nav_register'},
            ]
        elif intent == 'OUT_OF_SCOPE':
            quick_replies = [
                {'label': 'Chercher un bien', 'action': 'intent_search'},
                {'label': 'Prix immobiliers', 'action': 'intent_price'},
                {'label': 'Meilleurs quartiers', 'action': 'intent_neighborhood'},
            ]
        else:
            quick_replies = [
                {'label': 'بغيت نكري', 'action': 'intent_rent'},
                {'label': 'بغيت نشري', 'action': 'intent_buy'},
                {'label': 'Simuler crédit', 'action': 'intent_mortgage'},
                {'label': 'Meilleurs quartiers', 'action': 'intent_neighborhood'},
            ]
    elif role == 'OWNER':
        if intent == 'CREATE_LISTING':
            quick_replies = [
                {'label': 'Créer une annonce', 'action': 'nav_create_property'},
                {'label': 'Conseil prix', 'action': 'intent_price'},
                {'label': 'Générer description', 'action': 'intent_description'},
            ]
        else:
            quick_replies = [
                {'label': 'Nouvelle annonce', 'action': 'nav_create_property'},
                {'label': 'Mes propriétés', 'action': 'nav_dashboard'},
                {'label': 'Estimer prix', 'action': 'intent_price'},
                {'label': 'Mes visites', 'action': 'nav_visits'},
            ]
    else:
        quick_replies = [
            {'label': 'Chercher un bien', 'action': 'intent_search'},
            {'label': 'Comment ça marche ?', 'action': 'intent_how_it_works'},
            {'label': 'Créer un compte', 'action': 'nav_register'},
        ]

    # Generate text response
    response_text = _generate_text_response(role, intent, entities, lang, properties)

    return {
        'response': response_text,
        'quick_replies': quick_replies,
        'role': role,
        'intent': intent,
        'entities': entities,
        'properties': properties or [],
        'actions': _suggest_actions(role, intent, entities),
    }


def _generate_text_response(role: str, intent: str, entities: Dict, lang: str, properties: List[Dict] = None) -> str:
    """Generate contextual text response."""
    city = entities.get('city', '')
    ptype = entities.get('property_type', '')
    max_price = entities.get('max_price')
    min_price = entities.get('min_price')
    transaction = entities.get('transaction_type', '')
    bedrooms = entities.get('bedrooms')

    # If we have real properties for SEARCH/EXPLORE/COMPARE, generate a data-driven response
    if properties and intent in ['SEARCH', 'EXPLORE', 'COMPARE']:
        return _format_property_search_response(properties, entities, lang)

    # ─── Unified PRICE_CHECK with real PostgreSQL market data ──────────
    if intent == 'PRICE_CHECK':
        from services.market_data_service import get_city_price_stats
        if city:
            stats = get_city_price_stats(city)
            if stats and (stats.get('buy_per_m2') or stats.get('rent_per_m2')):
                count = stats.get('buy_count', 0) + stats.get('rent_count', 0)
                if lang in ['french', 'fr']:
                    lines = [f"💰 Prix immobiliers à **{city}** (basé sur {count} annonces)"]
                    if stats.get('rent_per_m2'):
                        lines.append(f"🏢 Location : ~{stats['rent_per_m2']:,.0f} DH/m²/mois")
                    if stats.get('buy_per_m2'):
                        lines.append(f"🏠 Achat : ~{stats['buy_per_m2']:,.0f} DH/m²")
                    lines.append("\nExemples :")
                    if stats.get('rent_per_m2'):
                        lines.append(f"• Studio 50m² (location) : ~{stats['rent_per_m2']*50:,.0f} DH/mois")
                    if stats.get('buy_per_m2'):
                        lines.append(f"• Appartement 100m² (achat) : ~{stats['buy_per_m2']*100:,.0f} DH")
                    return "\n".join(lines)
                elif lang in ['arabic', 'ar']:
                    lines = [f"💰 أسعار العقارات في **{city}** (بناءً على {count} إعلان)"]
                    if stats.get('rent_per_m2'):
                        lines.append(f"🏢 الإيجار : ~{stats['rent_per_m2']:,.0f} درهم/م²/شهر")
                    if stats.get('buy_per_m2'):
                        lines.append(f"🏠 الشراء : ~{stats['buy_per_m2']:,.0f} درهم/م²")
                    lines.append("\nأمثلة :")
                    if stats.get('rent_per_m2'):
                        lines.append(f"• ستوديو 50م² (إيجار) : ~{stats['rent_per_m2']*50:,.0f} درهم/شهر")
                    if stats.get('buy_per_m2'):
                        lines.append(f"• شقة 100م² (شراء) : ~{stats['buy_per_m2']*100:,.0f} درهم")
                    return "\n".join(lines)
                elif lang in ['darija', 'dar']:
                    lines = [f"💰 ثمن العقارات ف **{city}** (على حساب {count} إعلان)"]
                    if stats.get('rent_per_m2'):
                        lines.append(f"🏢 الكراء : ~{stats['rent_per_m2']:,.0f} درهم/م²/شهر")
                    if stats.get('buy_per_m2'):
                        lines.append(f"🏠 الشراء : ~{stats['buy_per_m2']:,.0f} درهم/م²")
                    lines.append("\nأمثلة :")
                    if stats.get('rent_per_m2'):
                        lines.append(f"• ستوديو 50م² (كراء) : ~{stats['rent_per_m2']*50:,.0f} درهم/شهر")
                    if stats.get('buy_per_m2'):
                        lines.append(f"• شقة 100م² (شراء) : ~{stats['buy_per_m2']*100:,.0f} درهم")
                    return "\n".join(lines)
                else:
                    lines = [f"💰 Real estate prices in **{city}** (based on {count} listings)"]
                    if stats.get('rent_per_m2'):
                        lines.append(f"🏢 Rent : ~{stats['rent_per_m2']:,.0f} MAD/m²/month")
                    if stats.get('buy_per_m2'):
                        lines.append(f"🏠 Buy : ~{stats['buy_per_m2']:,.0f} MAD/m²")
                    lines.append("\nExamples :")
                    if stats.get('rent_per_m2'):
                        lines.append(f"• Studio 50m² (rent) : ~{stats['rent_per_m2']*50:,.0f} MAD/month")
                    if stats.get('buy_per_m2'):
                        lines.append(f"• Apartment 100m² (buy) : ~{stats['buy_per_m2']*100:,.0f} MAD")
                    return "\n".join(lines)
            if lang in ['french', 'fr']:
                return f"Je n'ai pas encore assez de données pour **{city}**. Essayez de chercher des annonces actives pour voir les prix réels."
            elif lang in ['arabic', 'ar']:
                return f"ليس لديّ بعد بيانات كافية لـ **{city}**. جرب البحث عن إعلانات نشطة لمعرفة الأسعار الحقيقية."
            elif lang in ['darija', 'dar']:
                return f"مازال عندي شي بيانات قليلة لـ **{city}**. جرب تقلب على إعلانات نشطة باش تشوف الثمن الحقيقي."
            else:
                return f"I don't have enough data for **{city}** yet. Try searching active listings to see real prices."
        if lang in ['french', 'fr']:
            return "Précisez la ville pour une estimation basée sur nos annonces réelles !"
        elif lang in ['arabic', 'ar']:
            return "حدد المدينة للحصول على تقدير بناءً على إعلاناتنا الحقيقية!"
        elif lang in ['darija', 'dar']:
            return "قوليا فاش بغيتي باش نعطيك تقدير على حساب إعلاناتنا الحقيقية!"
        else:
            return "Specify the city for an estimate based on our real listings!"

    # French responses
    if lang in ['french', 'fr']:
        if role == 'BUYER' or role == 'GUEST':
            if intent == 'SEARCH':
                return f"Je cherche {'une location' if transaction == 'RENT' else 'un achat'}{f' à {city}' if city else ''} pour vous. Pouvez-vous me donner plus de détails sur votre budget et vos critères ?"
            elif intent == 'NEIGHBORHOOD_INFO':
                if city:
                    return f"🏘️ Pour découvrir les meilleurs quartiers à **{city}**, je vous recommande de chercher des annonces dans cette ville et de filtrer par critères (proximité écoles, transports, etc.).\n\nIndiquez votre budget et vos priorités pour affiner les recommandations."
                return "Les meilleurs quartiers dépendent de vos besoins. Précisez votre ville et je vous aiderai à trouver des annonces dans les zones qui vous conviennent !"
            elif intent == 'MORTGAGE':
                return "🏦 **Crédit immobilier au Maroc**\n\nLes banques marocaines offrent généralement :\n• Taux : 4.5% à 6.5% selon votre profil\n• Durée : jusqu'à 25 ans\n• Apport personnel : minimum 10-20%\n• Mensualité max : 40-50% du revenu net\n\n**Documents requis** :\n• Pièce d'identité\n• Bulletins de salaire (3 derniers mois)\n• Attestation de travail\n• Relevés bancaires\n\nQuel montant envisagez-vous d'emprunter ?"
            elif intent == 'SUPPORT':
                return "📞 **Contacter un propriétaire sur MAROC-LOC** :\n\n1️⃣ Cliquez sur une annonce qui vous intéresse\n2️⃣ Utilisez le bouton **Contacter** sur la page détail\n3️⃣ Vous pouvez :\n   • Envoyer un message via notre messagerie sécurisée\n   • Voir le numéro de téléphone (si public)\n   • Demander une visite en ligne\n\n💡 Créez un compte pour sauvegarder vos conversations et recevoir des alertes."
            elif intent == 'OUT_OF_SCOPE':
                return "Je suis désolé, je suis spécialisé uniquement dans l'immobilier au Maroc. 🏠\n\nVoici ce que je peux vous aider à faire :\n• 🔍 Chercher un appartement, villa ou riad\n• 💰 Connaître les prix par ville\n• 📍 Découvrir les meilleurs quartiers\n• 🏦 Simuler un crédit immobilier\n• 📋 Connaître les documents requis\n\nPosez-moi une question sur l'immobilier !"
            else:
                return "Je suis là pour vous aider à trouver le bien idéal ! Dites-moi ce que vous cherchez (ville, budget, type) et je vous proposerai les meilleures options."

        elif role == 'OWNER':
            if intent == 'PRICE_SUGGEST':
                return f"Pour établir un prix optimal{f' à {city}' if city else ''}{f' pour un {ptype.lower()}' if ptype else ''}, j'analyse le marché actuel. Les facteurs clés sont : localisation, surface, état, équipements et la demande actuelle. Voulez-vous que je fasse une estimation précise ?"
            elif intent == 'DESCRIPTION_GENERATE':
                return "Je peux générer une description professionnelle et attractive pour votre annonce. Donnez-moi les détails clés : surface, pièces, équipements, points forts du quartier."
            elif intent == 'CREATE_LISTING':
                return "Créons ensemble une annonce qui se démarque ! Voici les étapes : 1) Titre accrocheur 2) Photos de qualité 3) Description détaillée 4) Prix compétitif. Par quoi voulez-vous commencer ?"
            elif intent == 'ANALYTICS':
                return "Analysons les performances de vos annonces. Si une propriété a peu de vues, cela peut venir du prix, des photos, du titre ou du positionnement. Voulez-vous des conseils spécifiques ?"
            else:
                return "Bonjour ! Je suis votre assistant immobilier personnel. Je peux vous aider à créer des annonces, fixer des prix, promouvoir vos biens et gérer vos visites. Que souhaitez-vous faire aujourd'hui ?"

        else:
            return "Bienvenue sur MAROC-LOC ! Je suis votre assistant immobilier. Que puis-je faire pour vous aujourd'hui ?"

    # Arabic responses
    elif lang in ['arabic', 'ar']:
        if intent == 'NEIGHBORHOOD_INFO':
            if city:
                return f"🏘️ لاكتشاف أفضل الأحياء في **{city}**، ابحث عن إعلانات في هذه المدينة وصنف حسب معاييرك (قرب المدارس، النقل، إلخ)."
            return "أفضل الأحياء تعتمد على احتياجاتك. حدد مدينتك وسأساعدك في العثور على إعلانات في المناطق المناسبة لك!"
        elif intent == 'SUPPORT':
            return "📞 **التواصل مع المالك** :\n\n1️⃣ اضغط على الإعلان\n2️⃣ استخدم زر **اتصل**\n3️⃣ يمكنك إرسال رسالة أو طلب زيارة\n\n💡 أنشئ حساباً لحفظ محادثاتك."
        elif intent == 'OUT_OF_SCOPE':
            return "أعتذر، أنا متخصص فقط في العقارات في المغرب. 🏠\n\nيمكنني مساعدتك في :\n• البحث عن عقار\n• معرفة الأسعار\n• أفضل الأحياء\n• القروض العقارية\n\nاسألني عن العقارات!"
        elif role == 'BUYER' or role == 'GUEST':
            return f"أستطيع مساعدتك في البحث عن {'عقار للإيجار' if transaction == 'RENT' else 'عقار للبيع'}{f' في {city}' if city else ''}. ما هو ميزانيتك؟"
        elif role == 'OWNER':
            return "مرحباً! يمكنني مساعدتك في إنشاء إعلانات، تحديد الأسعار، وترويج عقاراتك. كيف يمكنني مساعدتك؟"
        else:
            return "مرحباً بك في MAROC-LOC! كيف يمكنني مساعدتك؟"

    # Darija responses
    elif lang in ['darija', 'dar']:
        if intent == 'NEIGHBORHOOD_INFO':
            if city:
                return f"🏘️ باش تعرف أحسن الأحياء ف **{city}**، قلب على الإعلانات فهاد المدينة وصنف حسب معاييرك."
            return "أحسن الأحياء كيعتمدو على احتياجاتك. قوليا فاش بغيتي!"
        elif intent == 'SUPPORT':
            return "📞 **كيفاش تواصل مع صاحب الدار** :\n\n1️⃣ ضغط على الإعلان\n2️⃣ استعمل زر **اتصل**\n3️⃣ يمكنك تبعث رسالة ولا تطلب زيارة\n\n💡 دير حساب باش تحفظ محادثاتك."
        elif intent == 'OUT_OF_SCOPE':
            return "سمح ليا، أنا غير متخصص فالعقارات فالمغرب. 🏠\n\nنقدر نعاونك فـ :\n• نقلب ليك على شقة ولا دار\n• نعطيك الثمن\n• أحسن الأحياء\n• الكرادي\n\nسولني على العقارات!"
        elif role == 'BUYER' or role == 'GUEST':
            return f"واخا، نقدر نعاونك تلقى {'شي حاجة للكراء' if transaction == 'RENT' else 'شي حاجة للشراء'}{f' ف{city}' if city else ''}. شحال هو البودجيت ديالك؟"
        elif role == 'OWNER':
            return "سلام! نقدر نعاونك دير إعلان، حدد تمان، ولا نروج لعقار ديالك. شنو بغيتي دير؟"
        else:
            return "مرحبا بيك ف MAROC-LOC! كيفاش نقدر نعاونك؟"

    # English fallback
    else:
        if intent == 'NEIGHBORHOOD_INFO':
            if city:
                return f"🏘️ To discover the best neighborhoods in **{city}**, search for listings there and filter by your criteria (schools, transport, etc.)."
            return "The best neighborhoods depend on your needs. Specify your city and I'll help you find listings in suitable areas!"
        elif intent == 'SUPPORT':
            return "📞 **Contacting an owner on MAROC-LOC** :\n\n1️⃣ Click on a listing\n2️⃣ Use the **Contact** button\n3️⃣ You can send a message or request a visit\n\n💡 Create an account to save your conversations."
        elif intent == 'OUT_OF_SCOPE':
            return "Sorry, I only handle real estate in Morocco. 🏠\n\nI can help you with:\n• Property search\n• Price information\n• Neighborhood guides\n• Mortgage simulation\n• Required documents\n\nAsk me about real estate!"
        elif role == 'BUYER' or role == 'GUEST':
            return f"I can help you find {'a rental' if transaction == 'RENT' else 'a property to buy'}{f' in {city}' if city else ''}. What's your budget?"
        elif role == 'OWNER':
            return "Hello! I can help you create listings, set prices, and promote your properties. What would you like to do?"
        else:
            return "Welcome to MAROC-LOC! How can I help you today?"


def _format_property_search_response(properties: List[Dict], entities: Dict, lang: str) -> str:
    """Format a response when real properties are found."""
    city = entities.get('city', '')
    transaction = entities.get('transaction_type', '')
    max_price = entities.get('max_price')
    bedrooms = entities.get('bedrooms')
    count = len(properties)

    # Language-specific response headers
    headers = {
        'fr': f"J'ai trouvé **{count}** bien{'s' if count > 1 else ''}{' en location' if transaction == 'RENT' else ' à vendre' if transaction == 'BUY' else ''}{f' à {city}' if city else ''}{f' sous {max_price:,.0f} DH' if max_price else ''} :",
        'ar': f"وجدت **{count}** عقار{'ات' if count > 1 else ''}{' للإيجار' if transaction == 'RENT' else ' للبيع' if transaction == 'BUY' else ''}{f' في {city}' if city else ''}{f' بأقل من {max_price:,.0f} درهم' if max_price else ''} :",
        'dar': f"لقيت **{count}** {'إعلان' if count == 1 else 'إعلانات'}{' للكراء' if transaction == 'RENT' else ' للبيع' if transaction == 'BUY' else ''}{f' ف{city}' if city else ''}{f' تحت {max_price:,.0f} درهم' if max_price else ''} :",
        'en': f"I found **{count}** listing{'s' if count > 1 else ''}{' for rent' if transaction == 'RENT' else ' for sale' if transaction == 'BUY' else ''}{f' in {city}' if city else ''}{f' under {max_price:,.0f} MAD' if max_price else ''}:",
    }

    header = headers.get(lang, headers['en'])
    if lang in ['french', 'fr']:
        header = headers['fr']
    elif lang in ['arabic', 'ar']:
        header = headers['ar']
    elif lang in ['darija', 'dar']:
        header = headers['dar']
    else:
        header = headers['en']

    lines = [header, ""]

    for i, prop in enumerate(properties, 1):
        price_str = prop.get('price_formatted', f"{prop.get('price', 0):,.0f} DH")
        title = prop.get('title', 'Propriété')
        prop_city = prop.get('city', '')
        bedrooms_str = f"{prop.get('bedrooms')} ch." if prop.get('bedrooms') else ""
        surface_str = f"{prop.get('surface')}m²" if prop.get('surface') else ""
        verified = "✅" if prop.get('is_verified') else ""

        details = " | ".join(filter(None, [price_str, bedrooms_str, surface_str, verified]))
        lines.append(f"{i}. **{title}** — {details}")
        if prop_city and not city:
            lines.append(f"   📍 {prop_city}")

    lines.append("")
    if lang in ['french', 'fr']:
        lines.append("💡 Cliquez sur une annonce pour voir plus de détails ou contacter le propriétaire.")
    elif lang in ['arabic', 'ar']:
        lines.append("💡 اضغط على إعلان لرؤية المزيد من التفاصيل أو التواصل مع المالك.")
    elif lang in ['darija', 'dar']:
        lines.append("💡 ضغط على الإعلان باش تشوف التفاصيل ولا تواصل مع صاحب الدار.")
    else:
        lines.append("💡 Click on a listing to see more details or contact the owner.")

    return "\n".join(lines)


def _suggest_actions(role: str, intent: str, entities: Dict) -> List[Dict]:
    """Suggest follow-up actions based on context."""
    actions = []

    if role == 'BUYER':
        if intent == 'SEARCH':
            actions.append({'type': 'button', 'label': 'Voir sur la carte', 'action': 'show_map'})
            actions.append({'type': 'button', 'label': 'Sauvegarder recherche', 'action': 'save_search'})
            if entities.get('max_price') and entities.get('max_price') > 500000:
                actions.append({'type': 'button', 'label': 'Simuler crédit', 'action': 'mortgage_calc'})
        elif intent == 'MORTGAGE':
            actions.append({'type': 'slider', 'label': 'Montant', 'min': 200000, 'max': 5000000, 'default': 1000000})
            actions.append({'type': 'slider', 'label': 'Durée (années)', 'min': 5, 'max': 25, 'default': 20})

    elif role == 'OWNER':
        if intent == 'CREATE_LISTING':
            actions.append({'type': 'button', 'label': 'Commencer la publication', 'action': 'nav_create_property'})
        elif intent == 'PRICE_SUGGEST':
            actions.append({'type': 'button', 'label': 'Obtenir estimation', 'action': 'api_price_estimate'})
        elif intent == 'ANALYTICS':
            actions.append({'type': 'button', 'label': 'Voir mes stats', 'action': 'nav_analytics'})
        elif intent == 'VISIT_SUMMARY':
            actions.append({'type': 'button', 'label': 'Gérer les visites', 'action': 'nav_visits'})

    return actions


# ─── API Models ─────────────────────────────────────────────────────

class SmartChatRequest(BaseModel):
    message: str = Field(..., max_length=2000)
    session_id: Optional[str] = Field(
        default_factory=lambda: session_store.create_session(),
        alias='sessionId',
    )
    user_id: Optional[str] = None
    user_role: Optional[str] = None  # 'proprietaire', 'locataire', 'admin', or None for guest
    language: Optional[str] = None
    context: Dict = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class SmartChatResponse(BaseModel):
    response: str
    role: str
    intent: str
    confidence: float
    language: str
    entities: Dict
    quick_replies: List[Dict]
    actions: List[Dict]
    properties: List[Dict]
    session_id: str
    audio_url: Optional[str] = None  # For future TTS integration


# ─── Endpoints ──────────────────────────────────────────────────────

@router.post("/chat", response_model=SmartChatResponse)
@limiter.limit("30/minute")
async def smart_chat(request: Request, chat_request: SmartChatRequest):
    if not chat_request.message or not chat_request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    start_time = datetime.now()

    try:
        # 1. Detect role and intent
        detection = detect_role_and_intent(chat_request.message, chat_request.user_role)
        role = detection['role']
        intent = detection['intent']
        lang = chat_request.language if chat_request.language and chat_request.language != 'auto' else detection['language']

        # 2. Extract entities from current message
        current_entities = extract_entities(chat_request.message, lang)

        # 3. Context Memory: merge with previous session entities
        previous_entities = get_previous_entities_from_memory(chat_request.session_id)
        merged_entities = merge_entities(current_entities, previous_entities, chat_request.message)

        # 3b. Persist merged entities to Redis for fast cross-turn retrieval
        try:
            memory = get_conversation_memory()
            redis_key = f"chat:session:{chat_request.session_id}:entities"
            if merged_entities:
                mapping = {k: str(v) for k, v in merged_entities.items() if v is not None}
                if mapping:
                    memory.redis.hset(redis_key, mapping=mapping)
                    memory.redis.expire(redis_key, 86400 * 7)  # 7 days TTL
        except Exception as e:
            logger.warning(f"Failed to persist merged entities: {e}")

        # 4. Retrieve real properties from PostgreSQL if buyer searching (fallback)
        properties = []
        if role in ['BUYER', 'GUEST'] and intent in ['SEARCH', 'EXPLORE', 'COMPARE', 'PRICE_CHECK', 'NEIGHBORHOOD_INFO']:
            try:
                loop = asyncio.get_event_loop()

                def _do_sql_search():
                    svc = get_property_search_service()
                    if not svc.enabled:
                        return []
                    return svc.search(
                        city=merged_entities.get('city'),
                        min_price=merged_entities.get('min_price'),
                        max_price=merged_entities.get('max_price'),
                        property_type=merged_entities.get('property_type'),
                        transaction_type=merged_entities.get('transaction_type'),
                        bedrooms=merged_entities.get('bedrooms'),
                        min_surface=merged_entities.get('surface_min'),
                        furnished=merged_entities.get('furnished'),
                        limit=5,
                    )

                raw_properties = await asyncio.wait_for(
                    loop.run_in_executor(_retrieval_executor, _do_sql_search),
                    timeout=8.0
                )

                # Format properties for response
                svc = get_property_search_service()
                properties = [svc.format_property_for_chat(p) for p in raw_properties]

            except asyncio.TimeoutError:
                logger.warning("Property SQL search timed out, returning without properties")
            except Exception as e:
                logger.warning(f"Property SQL search failed: {e}")

        # 4b. RAG pipeline: semantic retrieval + context generation
        rag_response = None
        rag_properties = []
        if role in ['BUYER', 'GUEST'] and intent in RAG_INTENTS:
            try:
                loop = asyncio.get_event_loop()

                def _do_rag():
                    rag = get_rag_pipeline()
                    return rag.answer(
                        query=chat_request.message,
                        lang=lang,
                        intent=intent,
                        entities=merged_entities,
                        use_mmr=True,
                        top_k=5,
                    )

                rag_result = await asyncio.wait_for(
                    loop.run_in_executor(_retrieval_executor, _do_rag),
                    timeout=25.0
                )

                if rag_result.get("properties"):
                    rag_properties = rag_result["properties"]
                if rag_result.get("response"):
                    rag_response = rag_result["response"]

            except asyncio.TimeoutError:
                logger.warning("RAG pipeline timed out, falling back to SQL/templates")
            except Exception as e:
                logger.warning(f"RAG pipeline failed: {e}")

        # Prefer RAG results when they contain real properties
        if rag_properties:
            properties = rag_properties

        # 5. Build structured response
        result = build_response(role, intent, merged_entities, lang, properties)

        # 5b. For knowledge intents (FAQ/support/general), prefer the LLM-generated RAG answer
        # unless it is a generic fallback. For pure property search, keep the data-driven formatted
        # response but still list RAG properties.
        is_generic_fallback = rag_response in RAG_GENERIC_FALLBACKS
        if rag_response and intent in {"SUPPORT", "GENERAL", "NEIGHBORHOOD_INFO"} and not is_generic_fallback:
            result['response'] = rag_response
        elif rag_response and not properties and not is_generic_fallback:
            result['response'] = rag_response

        # 6. Calculate response time
        response_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        # 7. Store in session memory
        memory = get_conversation_memory()
        memory.add_turn(chat_request.session_id, ConversationTurn(
            role="user",
            content=chat_request.message,
            timestamp=datetime.now(),
            intent=intent,
            entities=merged_entities,
        ))
        memory.add_turn(chat_request.session_id, ConversationTurn(
            role="assistant",
            content=result['response'],
            timestamp=datetime.now(),
            properties_suggested=[p['id'] for p in properties],
        ))

        if chat_request.user_id:
            memory.update_user_memory(chat_request.user_id, {
                "preferences": {k: str(v) for k, v in merged_entities.items() if v},
                "role": role,
            })

        # 8. Store in SQLite session store
        session_store.append_message(chat_request.session_id, "user", chat_request.message)
        session_store.append_message(chat_request.session_id, "assistant", result['response'])

        # 9. Log analytics
        try:
            analytics = get_analytics_store()
            analytics.log_interaction(
                session_id=chat_request.session_id,
                user_id=chat_request.user_id,
                message=chat_request.message,
                intent=intent,
                role=role,
                language=lang,
                entities=merged_entities,
                properties_count=len(properties),
                response_time_ms=response_time_ms,
            )
        except Exception as e:
            logger.warning(f"Analytics logging failed: {e}")

        return SmartChatResponse(
            response=result['response'],
            role=role,
            intent=intent,
            confidence=detection['confidence'],
            language=lang,
            entities=merged_entities,
            quick_replies=result['quick_replies'],
            actions=result['actions'],
            properties=properties,
            session_id=chat_request.session_id or session_store.create_session(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Smart chat failed")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.get("/session/{session_id}")
async def get_session_history(session_id: str):
    """Get chat history for a session."""
    try:
        messages = session_store.get_messages(session_id)
        return {"session_id": session_id, "messages": messages}
    except Exception as e:
        logger.error(f"Failed to get session: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve session")


@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Clear a chat session."""
    try:
        memory = get_conversation_memory()
        memory.clear_session(session_id)
        return {"status": "cleared"}
    except Exception as e:
        logger.error(f"Failed to clear session: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear session")
