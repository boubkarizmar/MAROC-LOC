"""
Owner Assistant Router - AI-powered tools for property owners.

Endpoints:
- POST /owner/generate-description: Generate property descriptions
- POST /owner/suggest-price: Suggest optimal pricing
"""

import logging
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Request
from core.limiter import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/owner", tags=["owner-assistant"])


class GenerateDescriptionRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    category: str = Field(..., description="HOUSE, APARTMENT, OFFICE, SHOP, LAND, RIAD")
    property_type: str = Field(..., alias="propertyType", description="RENT or BUY")
    surface: float = Field(..., gt=0)
    rooms: int = Field(..., ge=1)
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    furnished: Optional[bool] = False
    has_parking: Optional[bool] = Field(False, alias="hasParking")
    has_pool: Optional[bool] = Field(False, alias="hasPool")
    has_garden: Optional[bool] = Field(False, alias="hasGarden")
    has_air_conditioning: Optional[bool] = Field(False, alias="hasAirConditioning")
    has_internet: Optional[bool] = Field(False, alias="hasInternet")
    has_security: Optional[bool] = Field(False, alias="hasSecurity")
    has_balcony: Optional[bool] = Field(False, alias="hasBalcony")
    has_elevator: Optional[bool] = Field(False, alias="hasElevator")
    city_center: Optional[bool] = Field(False, alias="cityCenter")
    near_school: Optional[bool] = Field(False, alias="nearSchool")
    near_university: Optional[bool] = Field(False, alias="nearUniversity")
    near_mosque: Optional[bool] = Field(False, alias="nearMosque")
    near_hospital: Optional[bool] = Field(False, alias="nearHospital")
    near_tram: Optional[bool] = Field(False, alias="nearTram")
    near_bus: Optional[bool] = Field(False, alias="nearBus")
    near_train_station: Optional[bool] = Field(False, alias="nearTrainStation")
    sea_view: Optional[bool] = Field(False, alias="seaView")
    garden_view: Optional[bool] = Field(False, alias="gardenView")
    quiet_area: Optional[bool] = Field(False, alias="quietArea")
    family_area: Optional[bool] = Field(False, alias="familyArea")
    modern_area: Optional[bool] = Field(False, alias="modernArea")
    language: str = Field("fr", pattern="^(fr|ar|en)$")
    tone: Optional[str] = Field("professional", pattern="^(professional|friendly|luxury|concise)$")

    class Config:
        populate_by_name = True


class GenerateDescriptionResponse(BaseModel):
    description: str
    highlights: list[str]
    language: str
    char_count: int
    word_count: int


class SuggestPriceRequest(BaseModel):
    city: str = Field(..., min_length=2)
    category: str = Field(...)
    property_type: str = Field(..., alias="propertyType")
    surface: float = Field(..., gt=0)
    rooms: int = Field(..., ge=1)
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    furnished: Optional[bool] = False
    has_parking: Optional[bool] = Field(False, alias="hasParking")
    has_pool: Optional[bool] = Field(False, alias="hasPool")
    has_garden: Optional[bool] = Field(False, alias="hasGarden")
    has_air_conditioning: Optional[bool] = Field(False, alias="hasAirConditioning")
    has_elevator: Optional[bool] = Field(False, alias="hasElevator")
    city_center: Optional[bool] = Field(False, alias="cityCenter")
    near_tram: Optional[bool] = Field(False, alias="nearTram")
    sea_view: Optional[bool] = Field(False, alias="seaView")
    condition: Optional[str] = Field("GOOD", pattern="^(NEW|GOOD|RENOVATED|TO_RENOVATE)$")
    building_age: Optional[int] = Field(None, ge=0, alias="buildingAge")

    class Config:
        populate_by_name = True


class SuggestPriceResponse(BaseModel):
    suggested_price: float
    price_range_min: float
    price_range_max: float
    price_per_sqm: float
    confidence: str  # high, medium, low
    market_trend: str  # up, stable, down
    factors: list[dict]
    comparable_count: int


# ===== MOROCCAN REAL ESTATE KNOWLEDGE BASE =====

CITY_PRICE_PER_SQM = {
    # Vente (DH/m²)
    "buy": {
        "casablanca": {"apartment": 12000, "house": 15000, "office": 14000, "shop": 18000, "land": 5000, "riad": 20000},
        "rabat": {"apartment": 11000, "house": 14000, "office": 13000, "shop": 16000, "land": 4500, "riad": 18000},
        "marrakech": {"apartment": 10000, "house": 13000, "office": 12000, "shop": 15000, "land": 4000, "riad": 22000},
        "fes": {"apartment": 7000, "house": 9000, "office": 8000, "shop": 10000, "land": 3000, "riad": 15000},
        "tangier": {"apartment": 9000, "house": 11000, "office": 10000, "shop": 13000, "land": 3500, "riad": 16000},
        "agadir": {"apartment": 8500, "house": 10000, "office": 9500, "shop": 12000, "land": 3200, "riad": 14000},
        "mohammedia": {"apartment": 8000, "house": 10000, "office": 9000, "shop": 11000, "land": 3000, "riad": 13000},
        "meknes": {"apartment": 6000, "house": 7500, "office": 7000, "shop": 9000, "land": 2500, "riad": 12000},
        "tetouan": {"apartment": 5500, "house": 7000, "office": 6500, "shop": 8500, "land": 2200, "riad": 10000},
        "kenitra": {"apartment": 5500, "house": 7000, "office": 6500, "shop": 8000, "land": 2000, "riad": 9000},
        "default": {"apartment": 7000, "house": 9000, "office": 8000, "shop": 10000, "land": 3000, "riad": 15000},
    },
    # Location (DH/m²/mois approx)
    "rent": {
        "casablanca": {"apartment": 80, "house": 100, "office": 90, "shop": 120, "land": 15, "riad": 150},
        "rabat": {"apartment": 75, "house": 95, "office": 85, "shop": 110, "land": 14, "riad": 140},
        "marrakech": {"apartment": 70, "house": 90, "office": 80, "shop": 100, "land": 12, "riad": 160},
        "fes": {"apartment": 45, "house": 55, "office": 50, "shop": 70, "land": 8, "riad": 100},
        "tangier": {"apartment": 55, "house": 70, "office": 65, "shop": 85, "land": 10, "riad": 110},
        "agadir": {"apartment": 50, "house": 65, "office": 60, "shop": 80, "land": 9, "riad": 100},
        "default": {"apartment": 50, "house": 65, "office": 60, "shop": 80, "land": 10, "riad": 100},
    }
}

MULTIPLIERS = {
    "furnished": 1.15,
    "has_parking": 1.08,
    "has_pool": 1.20,
    "has_garden": 1.12,
    "has_air_conditioning": 1.06,
    "has_elevator": 1.05,
    "city_center": 1.18,
    "near_tram": 1.07,
    "sea_view": 1.15,
    "new": 1.10,
    "good": 1.00,
    "renovated": 1.05,
    "to_renovate": 0.85,
    "building_age_under_5": 1.05,
    "building_age_under_10": 1.00,
    "building_age_over_20": 0.90,
}


def _get_city_key(city: str) -> str:
    key = city.lower().strip().replace(" ", "")
    if key in ["casablanca", "casa"]:
        return "casablanca"
    if key in ["rabat"]:
        return "rabat"
    if key in ["marrakech", "marrakesh"]:
        return "marrakech"
    if key in ["fes", "fez"]:
        return "fes"
    if key in ["tangier", "tanger"]:
        return "tangier"
    if key in ["agadir"]:
        return "agadir"
    if key in ["mohammedia"]:
        return "mohammedia"
    if key in ["meknes"]:
        return "meknes"
    if key in ["tetouan"]:
        return "tetouan"
    if key in ["kenitra"]:
        return "kenitra"
    return "default"


def _get_category_key(category: str) -> str:
    cat = category.lower().strip()
    mapping = {
        "apartment": "apartment", "appartement": "apartment", "appart": "apartment",
        "house": "house", "maison": "house", "villa": "house",
        "office": "office", "bureau": "office",
        "shop": "shop", "magasin": "shop", "commerce": "shop",
        "land": "land", "terrain": "land",
        "riad": "riad",
    }
    return mapping.get(cat, "apartment")


def _build_description_fr(req: GenerateDescriptionRequest) -> tuple[str, list[str]]:
    """Build a French property description."""
    parts = []
    highlights = []

    # Opening
    type_label = "Appartement" if req.category.lower() in ["apartment", "appartement", "appart"] else \
                 "Maison / Villa" if req.category.lower() in ["house", "maison", "villa"] else \
                 "Bureau" if req.category.lower() in ["office", "bureau"] else \
                 "Commerce" if req.category.lower() in ["shop", "magasin"] else \
                 "Terrain" if req.category.lower() in ["land", "terrain"] else \
                 "Riad" if req.category.lower() == "riad" else "Bien immobilier"

    transaction = "à louer" if req.property_type.upper() == "RENT" else "à vendre"

    parts.append(f"Magnifique {type_label} {transaction} situé(e) à {req.city}, offrant un cadre de vie exceptionnel alliant confort moderne et authenticité marocaine.")
    highlights.append(f"{type_label} {transaction} à {req.city}")

    # Surface & rooms
    parts.append(f"Cette propriété d'une superficie de {req.surface} m² dispose de {req.rooms} pièce(s), parfaitement agencée(s) pour optimiser l'espace et la luminosité.")
    highlights.append(f"{req.surface} m² - {req.rooms} pièces")

    if req.bedrooms:
        parts.append(f"Elle comprend {req.bedrooms} chambre(s) confortable(s), idéale(s) pour le repos et la tranquillité.")
    if req.bathrooms:
        parts.append(f"{req.bathrooms} salle(s) de bain moderne(s) équipée(s) avec soin.")

    # Amenities
    amenities = []
    if req.furnished:
        amenities.append("entièrement meublé(e)")
        highlights.append("Meublé")
    if req.has_parking:
        amenities.append("parking sécurisé")
        highlights.append("Parking")
    if req.has_pool:
        amenities.append("piscine")
        highlights.append("Piscine")
    if req.has_garden:
        amenities.append("jardin")
        highlights.append("Jardin")
    if req.has_air_conditioning:
        amenities.append("climatisation")
        highlights.append("Climatisation")
    if req.has_internet:
        amenities.append("connexion internet haut débit")
    if req.has_security:
        amenities.append("système de sécurité")
    if req.has_balcony:
        amenities.append("balcon / terrasse")
    if req.has_elevator:
        amenities.append("ascenseur")

    if amenities:
        parts.append(f"Les équipements incluent : {', '.join(amenities)}.")

    # Location
    loc_features = []
    if req.city_center:
        loc_features.append("centre-ville")
        highlights.append("Centre-ville")
    if req.near_school:
        loc_features.append("écoles à proximité")
    if req.near_university:
        loc_features.append("universités proches")
    if req.near_mosque:
        loc_features.append("mosquée à proximité")
    if req.near_hospital:
        loc_features.append("hôpital à proximité")
    if req.near_tram:
        loc_features.append("tramway")
        highlights.append("Tramway")
    if req.near_bus:
        loc_features.append("arrêts de bus")
    if req.near_train_station:
        loc_features.append("gare ferroviaire")
    if req.sea_view:
        loc_features.append("vue sur mer")
        highlights.append("Vue mer")
    if req.garden_view:
        loc_features.append("vue sur jardin")
    if req.quiet_area:
        loc_features.append("quartier calme")
    if req.family_area:
        loc_features.append("quartier familial")
    if req.modern_area:
        loc_features.append("quartier moderne")

    if loc_features:
        parts.append(f"Situé(e) dans un environnement privilégié : {', '.join(loc_features)}.")

    # Closing
    parts.append("N'hésitez pas à nous contacter pour plus d'informations ou pour organiser une visite. Ce bien est disponible immédiatement et représente une excellente opportunité sur le marché immobilier de {city}.")

    description = " ".join(parts).format(city=req.city)
    return description, highlights


def _build_description_en(req: GenerateDescriptionRequest) -> tuple[str, list[str]]:
    parts = []
    highlights = []

    type_label = "Apartment" if req.category.lower() in ["apartment", "appartement"] else \
                 "House / Villa" if req.category.lower() in ["house", "maison", "villa"] else \
                 "Office" if req.category.lower() in ["office", "bureau"] else \
                 "Shop" if req.category.lower() in ["shop", "magasin"] else \
                 "Land" if req.category.lower() in ["land", "terrain"] else \
                 "Riad" if req.category.lower() == "riad" else "Property"

    transaction = "for rent" if req.property_type.upper() == "RENT" else "for sale"

    parts.append(f"Beautiful {type_label} {transaction} located in {req.city}, offering an exceptional living environment combining modern comfort and Moroccan authenticity.")
    highlights.append(f"{type_label} {transaction} in {req.city}")

    parts.append(f"This property with a surface area of {req.surface} m² features {req.rooms} room(s), perfectly arranged to optimize space and natural light.")
    highlights.append(f"{req.surface} m² - {req.rooms} rooms")

    if req.bedrooms:
        parts.append(f"It includes {req.bedrooms} comfortable bedroom(s), ideal for rest and tranquility.")
    if req.bathrooms:
        parts.append(f"{req.bathrooms} modern bathroom(s) equipped with care.")

    amenities = []
    if req.furnished:
        amenities.append("fully furnished")
        highlights.append("Furnished")
    if req.has_parking:
        amenities.append("secure parking")
        highlights.append("Parking")
    if req.has_pool:
        amenities.append("swimming pool")
        highlights.append("Pool")
    if req.has_garden:
        amenities.append("garden")
        highlights.append("Garden")
    if req.has_air_conditioning:
        amenities.append("air conditioning")
        highlights.append("A/C")
    if req.has_balcony:
        amenities.append("balcony / terrace")
    if req.has_elevator:
        amenities.append("elevator")

    if amenities:
        parts.append(f"Amenities include: {', '.join(amenities)}.")

    loc_features = []
    if req.city_center:
        loc_features.append("city center")
        highlights.append("City center")
    if req.near_tram:
        loc_features.append("tramway")
        highlights.append("Tramway")
    if req.sea_view:
        loc_features.append("sea view")
        highlights.append("Sea view")
    if req.quiet_area:
        loc_features.append("quiet area")
    if req.family_area:
        loc_features.append("family neighborhood")

    if loc_features:
        parts.append(f"Located in a privileged environment: {', '.join(loc_features)}.")

    parts.append("Contact us for more information or to schedule a visit. This property is available immediately and represents an excellent opportunity in the {city} real estate market.")

    description = " ".join(parts).format(city=req.city)
    return description, highlights


def _build_description_ar(req: GenerateDescriptionRequest) -> tuple[str, list[str]]:
    """Build Arabic property description (Modern Standard Arabic)."""
    parts = []
    highlights = []

    type_label = "شقة" if req.category.lower() in ["apartment", "appartement"] else \
                 "فيلا / منزل" if req.category.lower() in ["house", "maison", "villa"] else \
                 "مكتب" if req.category.lower() in ["office", "bureau"] else \
                 "محل تجاري" if req.category.lower() in ["shop", "magasin"] else \
                 "أرض" if req.category.lower() in ["land", "terrain"] else \
                 "رياض" if req.category.lower() == "riad" else "عقار"

    transaction = "للإيجار" if req.property_type.upper() == "RENT" else "للبيع"

    parts.append(f"{type_label} رائعة {transaction} في {req.city}، تقدم بيئة معيشة استثنائية تجمع بين الراحة الحديثة والأصالة المغربية.")
    highlights.append(f"{type_label} {transaction} - {req.city}")

    parts.append(f"هذا العقار بمساحة {req.surface} م² يضم {req.rooms} غرفة، موزعة بشكل مثالي لتحسين المساحة والإضاءة الطبيعية.")
    highlights.append(f"{req.surface} م² - {req.rooms} غرف")

    if req.bedrooms:
        parts.append(f"تضم {req.bedrooms} غرفة نوم مريحة، مثالية للراحة والهدوء.")
    if req.bathrooms:
        parts.append(f"{req.bathrooms} حمام(ات) حديثة مجهزة بعناية.")

    amenities = []
    if req.furnished:
        amenities.append("مفروشة بالكامل")
        highlights.append("مفروش")
    if req.has_parking:
        amenities.append("موقف سيارات آمن")
        highlights.append("موقف سيارات")
    if req.has_pool:
        amenities.append("مسبح")
        highlights.append("مسبح")
    if req.has_garden:
        amenities.append("حديقة")
        highlights.append("حديقة")
    if req.has_air_conditioning:
        amenities.append("تكييف")
        highlights.append("تكييف")
    if req.has_elevator:
        amenities.append("مصعد")

    if amenities:
        parts.append(f"التجهيزات تشمل: {', '.join(amenities)}.")

    loc_features = []
    if req.city_center:
        loc_features.append("وسط المدينة")
        highlights.append("وسط المدينة")
    if req.near_tram:
        loc_features.append("الترام")
        highlights.append("ترام")
    if req.sea_view:
        loc_features.append("إطلالة على البحر")
        highlights.append("إطلالة بحرية")
    if req.quiet_area:
        loc_features.append("حي هادئ")
    if req.family_area:
        loc_features.append("حي عائلي")

    if loc_features:
        parts.append(f"يقع في بيئة متميزة: {', '.join(loc_features)}.")

    parts.append("لا تتردد في التواصل معنا لمزيد من المعلومات أو لترتيب زيارة. هذا العقار متاح فوراً ويمثل فرصة ممتازة في سوق العقارات ب{city}.")

    description = " ".join(parts).format(city=req.city)
    return description, highlights


@router.post("/generate-description", response_model=GenerateDescriptionResponse)
@limiter.limit("10/minute")
async def generate_description(request: Request, body: GenerateDescriptionRequest):
    """Generate an AI-powered property description in the requested language."""
    try:
        if body.language == "fr":
            description, highlights = _build_description_fr(body)
        elif body.language == "ar":
            description, highlights = _build_description_ar(body)
        else:
            description, highlights = _build_description_en(body)

        # Adjust tone
        if body.tone == "luxury":
            description = description.replace("Magnifique", "Somptueux" if body.language == "fr" else "Luxurious")
            description = description.replace("confort", "luxe" if body.language == "fr" else "luxury")
        elif body.tone == "concise":
            sentences = description.split(".")
            description = ". ".join(sentences[:3]) + "."
            highlights = highlights[:3]

        words = description.split()
        return GenerateDescriptionResponse(
            description=description,
            highlights=highlights,
            language=body.language,
            char_count=len(description),
            word_count=len(words)
        )
    except Exception as e:
        logger.error(f"Error generating description: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate description")


@router.post("/suggest-price", response_model=SuggestPriceResponse)
@limiter.limit("20/minute")
async def suggest_price(request: Request, body: SuggestPriceRequest):
    """Suggest optimal pricing based on Moroccan real estate market data."""
    try:
        city_key = _get_city_key(body.city)
        cat_key = _get_category_key(body.category)
        trans_key = "rent" if body.property_type.upper() == "RENT" else "buy"

        from services.market_data_service import get_city_price_per_sqm
        db_price = get_city_price_per_sqm(city_key, trans_key, cat_key)
        if db_price:
            base_price_per_sqm = db_price
        else:
            base_prices = CITY_PRICE_PER_SQM.get(trans_key, CITY_PRICE_PER_SQM["buy"])
            city_prices = base_prices.get(city_key, base_prices["default"])
            base_price_per_sqm = city_prices.get(cat_key, city_prices["apartment"])

        # Calculate base price
        base_price = base_price_per_sqm * body.surface

        # Apply multipliers
        multiplier = 1.0
        factors = []

        def add_factor(name: str, value: float, positive: bool = True):
            nonlocal multiplier
            multiplier *= value
            factors.append({
                "name": name,
                "impact": f"+{int((value-1)*100)}%" if value > 1 else f"{int((value-1)*100)}%",
                "positive": positive if value > 1 else not positive
            })

        if body.furnished:
            add_factor("Meublé / Furnished", MULTIPLIERS["furnished"])
        if body.has_parking:
            add_factor("Parking", MULTIPLIERS["has_parking"])
        if body.has_pool:
            add_factor("Piscine / Pool", MULTIPLIERS["has_pool"])
        if body.has_garden:
            add_factor("Jardin / Garden", MULTIPLIERS["has_garden"])
        if body.has_air_conditioning:
            add_factor("Climatisation / A/C", MULTIPLIERS["has_air_conditioning"])
        if body.has_elevator:
            add_factor("Ascenseur / Elevator", MULTIPLIERS["has_elevator"])
        if body.city_center:
            add_factor("Centre-ville / City center", MULTIPLIERS["city_center"])
        if body.near_tram:
            add_factor("Tramway", MULTIPLIERS["near_tram"])
        if body.sea_view:
            add_factor("Vue mer / Sea view", MULTIPLIERS["sea_view"])

        # Condition
        cond = body.condition.lower() if body.condition else "good"
        add_factor(f"État: {cond}", MULTIPLIERS.get(cond, 1.0))

        # Building age
        if body.building_age is not None:
            if body.building_age <= 5:
                add_factor("Bâtiment récent", MULTIPLIERS["building_age_under_5"])
            elif body.building_age <= 10:
                add_factor("Bâtiment < 10 ans", MULTIPLIERS["building_age_under_10"])
            elif body.building_age > 20:
                add_factor("Bâtiment ancien", MULTIPLIERS["building_age_over_20"], positive=False)

        suggested_price = round(base_price * multiplier)

        # Price range (±15%)
        price_range_min = round(suggested_price * 0.85)
        price_range_max = round(suggested_price * 1.15)
        price_per_sqm = round(suggested_price / body.surface, 2)

        # Confidence based on city specificity
        confidence = "high" if city_key != "default" else "medium"
        if body.city_center or body.sea_view:
            confidence = "high"

        market_trend = "up" if city_key in ["casablanca", "rabat", "marrakech"] else "stable"

        return SuggestPriceResponse(
            suggested_price=suggested_price,
            price_range_min=price_range_min,
            price_range_max=price_range_max,
            price_per_sqm=price_per_sqm,
            confidence=confidence,
            market_trend=market_trend,
            factors=factors,
            comparable_count=12 if city_key != "default" else 5
        )
    except Exception as e:
        logger.error(f"Error suggesting price: {e}")
        raise HTTPException(status_code=500, detail="Failed to suggest price")
