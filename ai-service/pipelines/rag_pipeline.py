import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from core.translation import translation_service
from models.intent_classifier import intent_classifier
from models.entity_extractor import entity_extractor, ExtractedFilters
from services.vector_store import vector_store
from services.validation_service import validation_service
from services.session_store import session_store

logger = logging.getLogger(__name__)


@dataclass
class RAGResponse:
    answer: str
    sources: List[Dict]
    property_ids: List[str]
    confidence: float
    language: str
    filters: ExtractedFilters
    has_results: bool


class RAGPipeline:
    """
    Complete RAG pipeline with:
    1. Language detection
    2. Translation to English
    3. Intent classification
    4. Entity extraction
    5. Vector search
    6. PostgreSQL validation
    7. Response generation (not found OR results)
    """

    def __init__(self):
        self.translation = translation_service
        self.intent = intent_classifier
        self.extractor = entity_extractor
        self.vector_store = vector_store
        self.validator = validation_service

    def process(self, query: str, session_id: str = None, user_language: str = "auto") -> RAGResponse:
        """Main pipeline entry point"""

        # STEP 1: Detect original language
        original_lang = self.translation.detect_language(query)
        logger.info(f"Detected language: {original_lang}")

        # STEP 2: Translate to English
        normalized_query = self.translation.translate_to_english(query, original_lang)
        logger.info(f"Normalized query: {normalized_query}")

        # STEP 3: Classify intent
        intent_result = self.intent.classify(normalized_query, original_lang)
        logger.info(f"Intent: {intent_result['primary_intent']} (confidence: {intent_result['confidence']:.2f})")

        # STEP 4: Extract entities/filters
        filters = self.extractor.extract_all_filters(normalized_query)
        logger.info(f"Extracted filters: {filters}")

        # STEP 5: Vector search
        vector_results = self.vector_store.search(normalized_query, top_k=10)

        # STEP 6: Validate results with PostgreSQL
        property_ids = [r.get('metadata', {}).get('id', r.get('id')) for r in vector_results]
        validated_properties = self.validator.validate_properties(property_ids)

        # STEP 7: Apply filters (re-filter with validated data)
        filtered_results = self._apply_filters(validated_properties, filters)

        # STEP 8: Generate response based on results
        if filtered_results:
            response = self._generate_success_response(
                filtered_results, filters, intent_result, original_lang
            )
            has_results = True
        else:
            # Get alternative suggestions
            alternatives = self.validator.get_alternative_suggestions(
                {'city': filters.city, 'property_type': filters.property_type}
            )
            response = self._generate_not_found_response(filters, alternatives, original_lang)
            has_results = False

        # Compute confidence based on result quality
        confidence = 0.0
        if filtered_results:
            # Higher confidence with more results, capped at 0.95
            confidence = min(0.95, 0.5 + len(filtered_results) * 0.1)

        return RAGResponse(
            answer=response,
            sources=filtered_results,
            property_ids=[str(p['id']) for p in filtered_results],
            confidence=round(confidence, 2),
            language=original_lang,
            filters=filters,
            has_results=has_results
        )

    def _apply_filters(self, properties: Dict, filters: ExtractedFilters) -> List[Dict]:
        """Apply extracted filters to validated properties"""
        results = []

        for prop_id, prop in properties.items():
            # City filter
            if filters.city and prop.get('city') != filters.city:
                continue

            # Price range
            price = float(prop.get('price', 0))
            if filters.min_price and price < filters.min_price:
                continue
            if filters.max_price and price > filters.max_price:
                continue

            # Property type
            if filters.property_type and prop.get('category') != filters.property_type:
                continue

            # Bedrooms
            if filters.bedrooms and prop.get('bedrooms', 0) < filters.bedrooms:
                continue

            # Amenities (simplified - would need more complex matching)
            # For now, pass if no strict amenity filters

            results.append(prop)

        return results[:5]  # Limit to 5 results

    def _generate_success_response(self, results: List[Dict], filters: ExtractedFilters,
                                    intent: Dict, language: str) -> str:
        """Generate response when properties are found"""

        count = len(results)

        # Count by city
        cities = {}
        for r in results:
            city = r.get('city', 'Unknown')
            cities[city] = cities.get(city, 0) + 1

        city_str = " و ".join(cities.keys()) if len(cities) == 2 else ", ".join(cities.keys())

        if language == 'darija':
            response = f"كاين {count} ديال العقارات فـ {city_str}\n\n" if count > 1 else f"كاين عقار واحد فـ {city_str}\n\n"
        elif language == 'arabic':
            response = f"يوجد {count} عقارات في {city_str}\n\n" if count > 1 else f"يوجد عقار واحد في {city_str}\n\n"
        else:
            response = f"Found {count} propert{'ies' if count > 1 else 'y'} in {city_str}\n\n"

        # List properties
        for i, prop in enumerate(results[:5]):
            title = prop.get('title', f"Property #{prop.get('id')}")
            city = prop.get('city', '')
            price = float(prop.get('price', 0))

            if language in ['darija', 'arabic']:
                response += f"{i+1}. {title} - {city} - {price:,.0f} MAD\n"
            else:
                response += f"{i+1}. {title} - {city} - {price:,.0f} MAD\n"

        return response

    def _generate_not_found_response(self, filters: ExtractedFilters,
                                      alternatives: List[Dict], language: str) -> str:
        """Generate response when no properties match"""

        # Determine what was requested
        requested = []
        if filters.property_type:
            type_map = {'HOUSE': 'دار', 'APARTMENT': 'شقة', 'OFFICE': 'مكتب'}
            requested.append(type_map.get(filters.property_type, filters.property_type))
        if filters.city:
            requested.append(filters.city)

        requested_str = " ".join(requested) if requested else "عقار"

        if language == 'darija':
            response = f"ماعنديش والو فـ {requested_str}"
        elif language == 'arabic':
            response = f"لا توجد عقارات في {requested_str}"
        else:
            response = f"No properties found for {requested_str}"

        # Add alternative suggestions
        if alternatives:
            response += "\n\nقتراحات أخرى:\n" if language == 'darija' else "\n\nSuggestions:\n"
            for alt in alternatives[:3]:
                alt_title = alt.get('title', f"Property #{alt.get('id')}")
                alt_city = alt.get('city', '')
                response += f"- {alt_title} ({alt_city})\n"

        return response


rag_pipeline = RAGPipeline()