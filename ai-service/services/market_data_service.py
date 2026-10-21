"""
PostgreSQL-backed market data service.
Replaces hardcoded price dictionaries with real database queries.
"""

import logging
from typing import Dict, Optional
from sqlalchemy import create_engine, text
from core.config import settings

logger = logging.getLogger(__name__)

_engine = None


def _get_engine():
    global _engine
    if _engine is None and settings.DATABASE_URL:
        _engine = create_engine(settings.DATABASE_URL, future=True, pool_pre_ping=True)
    return _engine


def get_city_price_stats(city: str) -> Optional[Dict]:
    """Get average price per m² for rent and buy from real DB data."""
    engine = _get_engine()
    if not engine:
        return None

    try:
        with engine.connect() as conn:
            # Average buy price per m²
            buy_result = conn.execute(text("""
                SELECT AVG(price / NULLIF(surface, 0)) as avg_price_m2,
                       COUNT(*) as property_count
                FROM property
                WHERE LOWER(city) = LOWER(:city)
                  AND type = 'BUY'
                  AND status IN ('APPROVED', 'AVAILABLE')
                  AND surface > 0 AND price > 0
            """), {"city": city}).fetchone()

            # Average rent price per m²
            rent_result = conn.execute(text("""
                SELECT AVG(price / NULLIF(surface, 0)) as avg_price_m2,
                       COUNT(*) as property_count
                FROM property
                WHERE LOWER(city) = LOWER(:city)
                  AND type = 'RENT'
                  AND status IN ('APPROVED', 'AVAILABLE')
                  AND surface > 0 AND price > 0
            """), {"city": city}).fetchone()

            avg_buy = float(buy_result.avg_price_m2) if buy_result and buy_result.avg_price_m2 else None
            avg_rent = float(rent_result.avg_price_m2) if rent_result and rent_result.avg_price_m2 else None
            count_buy = int(buy_result.property_count) if buy_result else 0
            count_rent = int(rent_result.property_count) if rent_result else 0

            if avg_buy or avg_rent:
                return {
                    "city": city,
                    "buy_per_m2": round(avg_buy, 0) if avg_buy else None,
                    "rent_per_m2": round(avg_rent, 0) if avg_rent else None,
                    "buy_count": count_buy,
                    "rent_count": count_rent,
                    "trend": "stable",  # Could be computed from time series if available
                }
    except Exception as e:
        logger.warning(f"Failed to query price stats for {city}: {e}")

    return None


def get_city_price_per_sqm(city: str, transaction: str = "buy", category: str = "apartment") -> Optional[float]:
    """Get average price per m² for a specific city, transaction type and category."""
    engine = _get_engine()
    if not engine:
        return None

    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT AVG(price / NULLIF(surface, 0)) as avg_price_m2
                FROM property
                WHERE LOWER(city) = LOWER(:city)
                  AND LOWER(type) = LOWER(:transaction_type)
                  AND LOWER(category) = LOWER(:category)
                  AND status IN ('APPROVED', 'AVAILABLE')
                  AND surface > 0 AND price > 0
            """), {
                "city": city,
                "transaction_type": transaction,
                "category": category,
            }).fetchone()

            if result and result.avg_price_m2:
                return float(result.avg_price_m2)
    except Exception as e:
        logger.warning(f"Failed to query price per m² for {city}: {e}")

    return None
