"""
Property Search Service for MAROC-LOC AI Chatbot

Connects directly to PostgreSQL to retrieve real, approved property listings.
Uses SQLAlchemy Core for dynamic query building with optimal performance.

Key features:
- Dynamic SQL filters based on extracted entities
- Relevance scoring (price proximity, bedrooms match, verified status, views)
- Anti-hallucination: only returns properties verified in PostgreSQL
- Fallback to vector search if SQL returns no results
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

from sqlalchemy import (
    create_engine, MetaData, Table, select, and_, or_, desc, asc, func, text
)
from sqlalchemy.exc import SQLAlchemyError

from core.config import settings

logger = logging.getLogger(__name__)


class PropertySearchService:
    """PostgreSQL-backed property search with relevance scoring."""

    def __init__(self):
        self.enabled = bool(settings.DATABASE_URL)
        self.engine = None
        self.table = None

        if not self.enabled:
            logger.info("DATABASE_URL not configured; PropertySearchService disabled.")
            return

        try:
            self.engine = create_engine(
                settings.DATABASE_URL,
                future=True,
                pool_pre_ping=True,
                pool_recycle=3600,
            )
            metadata = MetaData()
            self.table = Table("property", metadata, autoload_with=self.engine)
            logger.info("PropertySearchService connected to Postgres.")
        except Exception as exc:
            logger.error("Unable to initialize PropertySearchService: %s", exc)
            self.enabled = False

    def _normalize_city(self, city: str) -> str:
        """Normalize city name to match DB casing."""
        if not city:
            return city
        # Capitalize each word, preserve common abbreviations
        city = city.strip()
        special = {
            'casablanca': 'Casablanca',
            'casa': 'Casablanca',
            'rabat': 'Rabat',
            'marrakech': 'Marrakech',
            'marrakesh': 'Marrakech',
            'fes': 'Fes',
            'fez': 'Fes',
            'tanger': 'Tanger',
            'tangier': 'Tanger',
            'agadir': 'Agadir',
            'meknes': 'Meknes',
            'tetouan': 'Tetouan',
            'kenitra': 'Kenitra',
            'mohammedia': 'Mohammedia',
            'oujda': 'Oujda',
            'nador': 'Nador',
            'el jadida': 'El Jadida',
            'larache': 'Larache',
            'settat': 'Settat',
            'beni mellal': 'Beni Mellal',
            'taza': 'Taza',
            'guelmim': 'Guelmim',
            'tiznit': 'Tiznit',
            'taroudant': 'Taroudant',
            'al hoceima': 'Al Hoceima',
            'ouarzazate': 'Ouarzazate',
            'ifrane': 'Ifrane',
            'essaouira': 'Essaouira',
            'chefchaouen': 'Chefchaouen',
        }
        return special.get(city.lower(), city.title())

    def _normalize_property_type(self, ptype: str) -> Optional[str]:
        """Map frontend/API property types to DB category enum values."""
        if not ptype:
            return None
        mapping = {
            'APARTMENT': 'APARTMENT',
            'HOUSE': 'HOUSE',
            'VILLA': 'HOUSE',
            'STUDIO': 'STUDIO',
            'OFFICE': 'OFFICE',
            'SHOP': 'SHOP',
            'COMMERCIAL': 'SHOP',
            'LAND': 'LAND',
            'TERRAIN': 'LAND',
        }
        return mapping.get(ptype.upper())

    def search(
        self,
        city: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        property_type: Optional[str] = None,  # maps to category
        transaction_type: Optional[str] = None,  # RENT/BUY
        bedrooms: Optional[int] = None,
        min_surface: Optional[float] = None,
        max_surface: Optional[float] = None,
        furnished: Optional[bool] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Search approved properties in PostgreSQL with dynamic filters.
        Returns list of property dicts sorted by relevance.
        """
        if not self.enabled or self.table is None:
            logger.warning("PropertySearchService disabled, returning empty list.")
            return []

        t = self.table
        stmt = select(t)
        conditions = []

        # Always filter by approved/available status
        if "status" in t.c:
            conditions.append(t.c.status.in_(["APPROVED", "AVAILABLE"]))

        # City filter (exact match, case-insensitive via ILIKE would be better but we normalize)
        if city:
            normalized_city = self._normalize_city(city)
            conditions.append(func.lower(t.c.city) == normalized_city.lower())

        # Price filters
        if min_price is not None and min_price > 0:
            conditions.append(t.c.price >= min_price)
        if max_price is not None and max_price > 0:
            conditions.append(t.c.price <= max_price)

        # Property category (APARTMENT, HOUSE, STUDIO, etc.)
        mapped_type = self._normalize_property_type(property_type)
        if mapped_type and "category" in t.c:
            conditions.append(func.lower(t.c.category) == mapped_type.lower())

        # Transaction type (RENT / BUY)
        if transaction_type and "type" in t.c:
            conditions.append(func.lower(t.c.type) == transaction_type.lower())

        # Bedrooms
        if bedrooms is not None and bedrooms >= 0 and "bedrooms" in t.c:
            # Allow flexibility: exact match or ±1 for small numbers
            if bedrooms <= 3:
                conditions.append(t.c.bedrooms.between(bedrooms - 1, bedrooms + 1))
            else:
                conditions.append(t.c.bedrooms >= bedrooms)

        # Surface
        if min_surface is not None and min_surface > 0 and "surface" in t.c:
            conditions.append(t.c.surface >= min_surface)
        if max_surface is not None and max_surface > 0 and "surface" in t.c:
            conditions.append(t.c.surface <= max_surface)

        # Furnished
        if furnished is not None and "furnished" in t.c:
            conditions.append(t.c.furnished == furnished)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Default ordering: newest first, then by view count
        stmt = stmt.order_by(desc(t.c.created_at), desc(t.c.view_count))
        stmt = stmt.limit(limit * 2)  # Fetch extra for scoring

        try:
            with self.engine.connect() as conn:
                rows = conn.execute(stmt).all()

            if not rows:
                return []

            # Convert to dicts and compute relevance score
            properties = [dict(row._mapping) for row in rows]
            scored = []
            for prop in properties:
                score = self._compute_relevance_score(prop, max_price, bedrooms, city)
                scored.append({**prop, "relevance_score": score})

            # Sort by relevance score descending
            scored.sort(key=lambda x: x["relevance_score"], reverse=True)
            return scored[:limit]

        except SQLAlchemyError as exc:
            logger.error("Property search SQL error: %s", exc)
            return []

    def _compute_relevance_score(
        self,
        prop: Dict[str, Any],
        target_price: Optional[float],
        target_bedrooms: Optional[int],
        target_city: Optional[str],
    ) -> float:
        """Compute a relevance score for ranking results."""
        score = 0.0

        # Price proximity (40% weight)
        if target_price and target_price > 0 and prop.get("price"):
            price = float(prop["price"])
            if price > 0:
                price_diff = abs(price - target_price) / target_price
                score += max(0.0, 1.0 - price_diff) * 0.4

        # Bedrooms match (20% weight)
        if target_bedrooms is not None and prop.get("bedrooms") is not None:
            prop_bedrooms = int(prop["bedrooms"])
            if prop_bedrooms == target_bedrooms:
                score += 0.2
            elif abs(prop_bedrooms - target_bedrooms) == 1:
                score += 0.1

        # City match (15% weight)
        if target_city and prop.get("city"):
            if target_city.lower() in str(prop["city"]).lower():
                score += 0.15

        # Verified status (10% weight)
        if prop.get("is_verified"):
            score += 0.1

        # View popularity (10% weight, capped)
        view_count = prop.get("view_count", 0) or 0
        score += min(view_count / 1000.0, 1.0) * 0.1

        # Recent listing (5% weight)
        created_at = prop.get("created_at")
        if created_at:
            try:
                if isinstance(created_at, datetime):
                    days_old = (datetime.now() - created_at).days
                else:
                    days_old = 30  # assume moderate
                score += max(0.0, 1.0 - days_old / 30.0) * 0.05
            except Exception:
                pass

        return round(score, 4)

    def get_property_by_id(self, property_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single property by ID, verifying it exists and is approved."""
        if not self.enabled or self.table is None:
            return None

        if not str(property_id).isdigit():
            return None

        t = self.table
        stmt = select(t).where(t.c.id == int(property_id))
        if "status" in t.c:
            stmt = stmt.where(t.c.status.in_(["APPROVED", "AVAILABLE"]))

        try:
            with self.engine.connect() as conn:
                row = conn.execute(stmt).one_or_none()
            return dict(row._mapping) if row else None
        except SQLAlchemyError as exc:
            logger.error("get_property_by_id error: %s", exc)
            return None

    def validate_properties_exist(self, property_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """Validate that property IDs exist in PostgreSQL and are approved."""
        if not self.enabled or self.table is None:
            return {}

        ids = [int(pid) for pid in property_ids if str(pid).isdigit()]
        if not ids:
            return {}

        t = self.table
        stmt = select(t).where(t.c.id.in_(ids))
        if "status" in t.c:
            stmt = stmt.where(t.c.status.in_(["APPROVED", "AVAILABLE"]))

        try:
            with self.engine.connect() as conn:
                rows = conn.execute(stmt).all()
            return {str(row._mapping["id"]): dict(row._mapping) for row in rows}
        except SQLAlchemyError as exc:
            logger.error("validate_properties_exist error: %s", exc)
            return {}

    def format_property_for_chat(self, prop: Dict[str, Any]) -> Dict[str, Any]:
        """Format a raw property dict for chatbot response."""
        images = prop.get("images", [])
        image_url = None
        if images and isinstance(images, list) and len(images) > 0:
            image_url = images[0]
        elif images and isinstance(images, str):
            # JSONB might come back as string
            try:
                import json
                parsed = json.loads(images)
                if parsed and isinstance(parsed, list):
                    image_url = parsed[0]
            except Exception:
                pass

        price = prop.get("price")
        if price is not None:
            try:
                price = float(price)
            except (ValueError, TypeError):
                price = 0.0

        return {
            "id": str(prop.get("id", "")),
            "title": prop.get("title", ""),
            "description": prop.get("description", "")[:200] + "..." if len(prop.get("description", "")) > 200 else prop.get("description", ""),
            "city": prop.get("city", ""),
            "address": prop.get("address", ""),
            "price": price,
            "price_formatted": f"{price:,.0f} DH" if price else "Prix sur demande",
            "type": prop.get("type", ""),
            "category": prop.get("category", ""),
            "bedrooms": prop.get("bedrooms"),
            "bathrooms": prop.get("bathrooms"),
            "surface": prop.get("surface"),
            "furnished": prop.get("furnished"),
            "is_verified": prop.get("is_verified", False),
            "view_count": prop.get("view_count", 0),
            "image_url": image_url,
            "phone_number": prop.get("phone_number", ""),
            "whatsapp_number": prop.get("whatsapp_number", ""),
            "relevance_score": prop.get("relevance_score", 0.0),
            "created_at": prop.get("created_at"),
        }


# Global singleton
_property_search_service: Optional[PropertySearchService] = None


def get_property_search_service() -> PropertySearchService:
    global _property_search_service
    if _property_search_service is None:
        _property_search_service = PropertySearchService()
    return _property_search_service
