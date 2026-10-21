import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class ExtractedFilters:
    city: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    property_type: Optional[str] = None
    transaction_type: Optional[str] = None
    bedrooms: Optional[int] = None
    amenities: List[str] = None

    def __post_init__(self):
        if self.amenities is None:
            self.amenities = []


class EntityExtractor:
    """
    Extract structured entities from normalized English queries
    """

    # City mapping (normalized)
    CITIES = {
        'casablanca': 'Casablanca', 'dar el beida': 'Casablanca',
        'marrakech': 'Marrakech', 'marrakesh': 'Marrakech',
        'rabat': 'Rabat', 'fes': 'Fes', 'fez': 'Fes',
        'tangier': 'Tangier', 'tanger': 'Tangier',
        'agadir': 'Agadir', 'meknes': 'Meknes'
    }

    # Property type mapping
    PROPERTY_TYPES = {
        'house': 'HOUSE', 'villa': 'HOUSE', 'riad': 'HOUSE',
        'apartment': 'APARTMENT', 'flat': 'APARTMENT', 'studio': 'APARTMENT',
        'office': 'OFFICE', 'shop': 'SHOP', 'commercial': 'SHOP',
        'land': 'LAND', 'garage': 'GARAGE'
    }

    # Transaction type mapping
    TRANSACTION_TYPES = {
        'rent': 'RENT', 'rental': 'RENT', 'lease': 'RENT',
        'buy': 'BUY', 'purchase': 'BUY', 'sale': 'BUY',
        'mortgage': 'MORTGAGE'
    }

    # Amenities mapping
    AMENITIES = {
        'parking': 'hasParking', 'garage': 'hasParking',
        'pool': 'hasPool', 'swimming pool': 'hasPool', 'piscine': 'hasPool',
        'elevator': 'hasElevator', 'lift': 'hasElevator',
        'air conditioning': 'hasAirConditioning', 'ac': 'hasAirConditioning',
        'garden': 'hasGarden', 'yard': 'hasGarden',
        'balcony': 'hasBalcony', 'terrace': 'hasBalcony',
        'furnished': 'furnished', 'meuble': 'furnished'
    }

    def extract_city(self, text: str) -> Optional[str]:
        """Extract city from normalized query"""
        for key, city in self.CITIES.items():
            if key in text.lower():
                return city
        return None

    def extract_price_range(self, text: str) -> Tuple[Optional[float], Optional[float]]:
        """Extract min and max price"""
        import re

        numbers = re.findall(r'(\d+(?:\.\d+)?)\s*(?:million|m|thousand|k)?', text.lower())
        if not numbers:
            return None, None

        prices = []
        for n in numbers:
            price = float(n)
            # Handle millions
            if 'million' in text.lower() and price < 1000:
                price *= 1000000
            elif 'thousand' in text.lower() or 'k' in text.lower():
                price *= 1000
            prices.append(price)

        min_price = min(prices) if prices else None
        max_price = max(prices) if prices else None

        # Check for comparison operators
        if 'less than' in text.lower() or 'under' in text.lower() or 'moins de' in text.lower():
            max_price = min_price
            min_price = None
        elif 'more than' in text.lower() or 'over' in text.lower() or 'plus de' in text.lower():
            min_price = max_price
            max_price = None

        return min_price, max_price

    def extract_property_type(self, text: str) -> Optional[str]:
        """Extract property type (HOUSE, APARTMENT, OFFICE, etc.)"""
        for key, prop_type in self.PROPERTY_TYPES.items():
            if key in text.lower():
                return prop_type
        return None

    def extract_transaction_type(self, text: str) -> Optional[str]:
        """Extract transaction type (RENT, BUY, MORTGAGE)"""
        for key, trans_type in self.TRANSACTION_TYPES.items():
            if key in text.lower():
                return trans_type
        return None

    def extract_bedrooms(self, text: str) -> Optional[int]:
        """Extract number of bedrooms"""
        import re
        patterns = [r'(\d+)\s*(?:bedroom|bed|room|chambre)', r'(\d+)\s*(?:br)']
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                return int(match.group(1))
        return None

    def extract_amenities(self, text: str) -> List[str]:
        """Extract requested amenities"""
        amenities = []
        for key, amenity in self.AMENITIES.items():
            if key in text.lower():
                amenities.append(amenity)
        return amenities

    def extract_all_filters(self, text: str) -> ExtractedFilters:
        """Extract all filters from normalized English query"""
        return ExtractedFilters(
            city=self.extract_city(text),
            min_price=self.extract_price_range(text)[0],
            max_price=self.extract_price_range(text)[1],
            property_type=self.extract_property_type(text),
            transaction_type=self.extract_transaction_type(text),
            bedrooms=self.extract_bedrooms(text),
            amenities=self.extract_amenities(text)
        )


entity_extractor = EntityExtractor()


def get_entity_extractor() -> EntityExtractor:
    """Get the singleton entity extractor instance."""
    return entity_extractor