import re
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class NLPEngine:
    def __init__(self):

        # =========================================================
        # DARIJA / ARABIC / FR / EN TRANSLATIONS
        # =========================================================
        self.darija_to_french = {

            # ================= PROPERTY TYPES =================
            "دار": "maison",
            "منزل": "maison",
            "دور": "maisons",
            "شقة": "appartement",
            "شقاق": "appartements",
            "فيلا": "villa",
            "رياض": "riad",
            "ستوديو": "studio",
            "بقعة": "terrain",
            "أرض": "terrain",
            "محل": "local commercial",
            "مكتب": "bureau",
            "garage": "garage",


            # ================= TRANSACTION =================
            "لكراء": "location",
            "الكراء": "location",
            "كري": "location",
            "إيجار": "location",
            "للبيع": "vente",
            "البيع": "vente",
            "بيع": "vente",
            "شري": "achat",
            "شراء": "achat",

            # ================= QUESTION WORDS =================
            "اشمن": "quel",
            "أشمن": "quel",
            "شنو": "quoi",
            "فين": "où",
            "فاش": "où",
            "واش": "est ce que",
            "شحال": "combien",
            "كيفاش": "comment",
            "شكون": "qui",
            "كيف": "comment",



            # ================= COMMON WORDS =================
            "كاين": "il y a",
            "كاينة": "il y a",
            "بغيت": "je cherche",
            "بغينا": "nous cherchons",
            "عندها": "avec",
            "فيه": "avec",
            "فيها": "avec",

            # ================= ROOMS =================
            "بيت": "chambre",
            "غرفة": "chambre",
            "صالون": "salon",
            "حمام": "salle de bain",
            "كوزينة": "cuisine",

            # ================= PRICE =================
            "رخيص": "pas cher",
            "غالي": "cher",
            "الثمن": "prix",
            "بكم": "prix",

            # ================= AREA =================
            "المساحة": "surface",
            "متر": "mètre",
            "متر مربع": "m²",
             # ================= SEARCH ACTIONS =================
    "قلب": "chercher",
    "كنقلب": "je cherche",
    "كنفتش": "je cherche",
    "فتش": "chercher",
    "بغينا": "nous cherchons",
    "باغي": "je veux",
    "باغية": "je veux",
    "حاب": "je veux",
    "عايز": "je veux",

    # ================= PROPERTY CONDITIONS =================
    "جديدة": "neuf",
    "نقية": "propre",
    "قديمة": "ancien",
    "مصلحة": "rénové",
    "مجددة": "rénové",
    "واسعة": "grand",
    "ضيقة": "petit",
    "كبيرة": "grand",
    "صغيرة": "petit",

    # ================= LOCATION =================
    "قريب": "proche",
    "بعيد": "loin",
    "وسط المدينة": "centre ville",
    "المدينة": "ville",
    "جنب": "près",
    "حدا": "près",
    "قرب": "près",
    "البحر": "mer",
    "الجبل": "montagne",

    # ================= FURNITURE =================
    "مفروشة": "meublé",
    "بلاصتها": "meublé",
    "فارغة": "vide",

    # ================= ROOMS =================
    "بيوت": "chambres",
    "غرف": "chambres",
    "حمامات": "salles de bain",
    "كوزينات": "cuisines",

    # ================= REAL ESTATE TERMS =================
    "عقار": "immobilier",
    "سمسار": "agent immobilier",
    "وكالة": "agence immobilière",
    "إقامة": "résidence",
    "عمارة": "immeuble",

    # ================= TIME =================
    "دابا": "maintenant",
    "اليوم": "aujourd'hui",
    "غدا": "demain",

    # ================= MONEY =================
    "درهم": "dh",
    "مليون": "million",
    "الف": "mille",

    # ================= NEGATIONS =================
    "ماكاينش": "pas disponible",
    "مافيهش": "sans",
    "ماعندوش": "sans",
        }

        # =========================================================
        # MOROCCAN CITIES
        # =========================================================
        self.darija_cities = {

            "كازا": "Casablanca",
            "الدار البيضاء": "Casablanca",
            "مراكش": "Marrakech",
            "فاس": "Fes",
            "طنجة": "Tangier",
            "الرباط": "Rabat",
            "سلا": "Salé",
            "تمارة": "Temara",
            "مكناس": "Meknes",
            "أكادير": "Agadir",
            "وجدة": "Oujda",
            "تطوان": "Tetouan",
            "الحسيمة": "Al Hoceima",
            "العيون": "Laayoune",
            "الداخلة": "Dakhla",
            "القنيطرة": "Kenitra",
            "الجديدة": "El Jadida",
            "الناظور": "Nador",
            "بركان": "Berkane",
            "خريبكة": "Khouribga",
            "آسفي": "Safi",
            "بني ملال": "Beni Mellal",
            "ورزازات": "Ouarzazate",
            "إفران": "Ifrane",
            "شفشاون": "Chefchaouen",
            "الصويرة": "Essaouira",
            "تاونات": "Taounate",
            "تازة": "Taza",
            "سطات": "Settat",
            "الراشيدية": "Errachidia",
            "تزنيت": "Tiznit",
            "العرائش": "Larache",
            "المضيق": "M'diq",
            "الفنيدق": "Fnideq",
            "المحمدية": "Mohammedia",
        }

        # =========================================================
        # AMENITIES
        # =========================================================
        self.amenities_mapping = {

            # PARKING
            "parking": "hasParking",
            "garage": "hasParking",
            "garaje": "hasParking",
            "باركينغ": "hasParking",
            "پاركينڭ": "hasParking",

            # POOL
            "piscine": "hasPool",
            "pool": "hasPool",
            "مسبح": "hasPool",

            # ELEVATOR
            "ascenseur": "hasElevator",
            "elevator": "hasElevator",
            "مصعد": "hasElevator",

            # AC
            "clim": "hasAirConditioning",
            "climatiseur": "hasAirConditioning",
            "ac": "hasAirConditioning",

            # GARDEN
            "jardin": "hasGarden",
            "garden": "hasGarden",
            "حديقة": "hasGarden",

            # BALCONY
            "balcon": "hasBalcony",
            "balcony": "hasBalcony",

            # FURNISHED
            "meublé": "furnished",
            "meublée": "furnished",
            "مفروشة": "furnished",

            # SECURITY
            "sécurité": "security",
            "gardien": "security",
            "security": "security",

            # WIFI
            "wifi": "wifi",
            "internet": "wifi",

            # TERRACE
            "terrasse": "terrace",
            "سطح": "terrace",

            # SEA VIEW
            "vue sur mer": "seaView",
            "mer": "seaView",

            # HEATING
            "chauffage": "heating",

            # CAMERA
            "caméra": "cameraSecurity",
            "camera": "cameraSecurity",
        }

        # =========================================================
        # QUESTION WORDS
        # =========================================================
        self.question_words = [
            "اشمن",
            "أشمن",
            "فاش",
            "فين",
            "واش",
            "شنو",
            "شكون",
            "كيفاش",
            "شحال",
            "?",
            "؟"
        ]

        # =========================================================
        # NUMBERS
        # =========================================================
        self.quantity_map = {

            "صفر": 0,
            "واحد": 1,
            "وحدة": 1,
            "جوج": 2,
            "زوج": 2,
            "تلاتة": 3,
            "ثلاثة": 3,
            "ربعة": 4,
            "خمسة": 5,
            "ستة": 6,
            "سبعة": 7,
            "ثمانية": 8,
            "تسعة": 9,
            "عشرة": 10,
        }

    # =========================================================
    # PREPROCESS
    # =========================================================
    def preprocess_query(self, text: str) -> str:

        text = text.lower().strip()

        text = re.sub(r'[^\w\s\u0600-\u06FF]', ' ', text)

        for darija, french in self.darija_to_french.items():
            if darija in text:
                text = text.replace(darija, french)

        return text

    # =========================================================
    # LANGUAGE DETECTION
    # =========================================================
    def detect_language(self, text: str, default="auto") -> str:

        if default != "auto":
            return default

        if re.search(r'[\u0600-\u06FF]', text):

            darija_markers = [
                "بغيت",
                "كاين",
                "واش",
                "فين",
                "شحال",
                "دار",
                "شقة"
            ]

            if any(word in text for word in darija_markers):
                return "darija"

            return "arabic"

        french_words = [
            "bonjour",
            "cherche",
            "location",
            "vente",
            "appartement"
        ]

        if any(word in text.lower() for word in french_words):
            return "french"

        return "english"

    # =========================================================
    # QUESTION DETECTION
    # =========================================================
    def is_question(self, text: str) -> bool:
        return any(qw in text.lower() for qw in self.question_words)

    # =========================================================
    # CATEGORY EXTRACTION (for llm_engine compatibility)
    # =========================================================
    def extract_category(self, text: str) -> Optional[str]:
        """Extract property category (BUY/RENT)"""
        text = text.lower()
        if any(word in text for word in ["لكراء", "الكراء", "كري", "location", "rent"]):
            return "RENT"
        if any(word in text for word in ["بيع", "vente", "buy", "villa", "دار", "فيلا"]):
            return "BUY"
        return None

    # =========================================================
    # CITY EXTRACTION
    # =========================================================
    def extract_city(self, text: str) -> Optional[str]:

        text = text.lower()

        for darija, city in self.darija_cities.items():
            if darija.lower() in text:
                return city

        return None

    # =========================================================
    # AMENITIES EXTRACTION
    # =========================================================
    def extract_amenities(self, text: str) -> Dict[str, bool]:

        amenities = {}

        text = text.lower()

        for keyword, field in self.amenities_mapping.items():
            if keyword.lower() in text:
                amenities[field] = True

        return amenities

    # =========================================================
    # TRANSACTION TYPE
    # =========================================================
    def extract_transaction_type(self, text: str) -> Optional[str]:

        text = text.lower()

        rent_words = [
            "لكراء",
            "الكراء",
            "location",
            "rent",
            "rental",
            "إيجار"
        ]

        buy_words = [
            "بيع",
            "vente",
            "buy",
            "achat",
            "شراء"
        ]

        if any(word in text for word in rent_words):
            return "RENT"

        if any(word in text for word in buy_words):
            return "BUY"

        return None

    # =========================================================
    # QUANTITY EXTRACTION
    # =========================================================
    def extract_quantity(self, text: str) -> Optional[int]:

        for word, qty in self.quantity_map.items():
            if word in text:
                return qty

        numbers = re.findall(r'\b(\d+)\b', text)

        if numbers:
            return int(numbers[0])

        return None

    # =========================================================
    # PROPERTY TYPE EXTRACTION
    # =========================================================
    def extract_property_type(self, text: str) -> Optional[str]:

        property_types = {

            "appartement": "apartment",
            "شقة": "apartment",

            "villa": "villa",
            "فيلا": "villa",

            "maison": "house",
            "دار": "house",

            "riad": "riad",
            "رياض": "riad",

            "studio": "studio",

            "terrain": "land",
            "أرض": "land",

            "bureau": "office",
            "مكتب": "office",

            "local": "commercial"
        }

        for keyword, value in property_types.items():
            if keyword in text.lower():
                return value

        return None


nlp_engine = NLPEngine()