from typing import List, Dict, Any, Optional
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from core.config import settings

logger = logging.getLogger(__name__)


class ValidationService:
    """
    Validate vector search results against PostgreSQL.
    Ensures NO hallucination — results must exist in DB.
    """

    def __init__(self, database_url: Optional[str] = None):
        db_url = database_url or settings.DATABASE_URL
        if not db_url:
            raise ValueError("DATABASE_URL must be configured for ValidationService")
        self.engine: Engine = create_engine(db_url, pool_pre_ping=True)

    def validate_properties(self, property_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """Validate that property IDs actually exist in PostgreSQL and are approved."""
        if not property_ids:
            return {}

        ids = [int(pid) for pid in property_ids if str(pid).isdigit()]
        if not ids:
            return {}

        # Use parameterized query with IN clause for cross-driver compatibility
        placeholders = ",".join([f":id_{i}" for i in range(len(ids))])
        query = text(f"""
            SELECT id, title, city, price, category, status,
                   address, surface, bedrooms, has_parking, has_pool
            FROM property
            WHERE id IN ({placeholders}) AND status = 'APPROVED'
        """)
        params = {f"id_{i}": pid for i, pid in enumerate(ids)}

        try:
            with self.engine.connect() as conn:
                result = conn.execute(query, params)
                rows = result.fetchall()
            return {str(row[0]): dict(row._mapping) for row in rows}
        except Exception as e:
            logger.error(f"Database validation query failed: {e}")
            return {}

    def get_alternative_suggestions(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        If no exact match, find similar properties with relaxed filters.
        """
        conditions = ["status = 'APPROVED'"]
        params: Dict[str, Any] = {}

        if filters.get("city"):
            conditions.append("city = :city")
            params["city"] = filters["city"]

        if filters.get("property_type"):
            conditions.append("category = :category")
            params["category"] = filters["property_type"]

        where_clause = " AND ".join(conditions)
        query = text(f"""
            SELECT id, title, city, price, category
            FROM property
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT 5
        """)

        try:
            with self.engine.connect() as conn:
                result = conn.execute(query, params)
                rows = result.fetchall()
            return [dict(row._mapping) for row in rows]
        except Exception as e:
            logger.error(f"Alternative suggestions query failed: {e}")
            return []


# Global singleton
validation_service = ValidationService()
