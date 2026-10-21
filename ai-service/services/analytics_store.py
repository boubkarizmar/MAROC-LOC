"""
Analytics Store for MAROC-LOC AI Chatbot

Tracks every chat interaction for dashboard reporting:
- conversation metrics
- intent distribution
- language distribution
- response times
- top searches
"""

import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any

from sqlalchemy import (
    Column, DateTime, Integer, String, Float, create_engine, MetaData, Table,
    select, func, desc, text
)
from sqlalchemy.exc import SQLAlchemyError

from core.config import settings

logger = logging.getLogger(__name__)

# FIX: use PostgreSQL (same as property search) so analytics survive container restarts
ANALYTICS_DB_URL = getattr(settings, 'DATABASE_URL', None) or 'sqlite:///./ai_analytics.db'


class AnalyticsStore:
    """PostgreSQL-backed analytics storage for AI chatbot metrics."""

    def __init__(self):
        connect_args = {"check_same_thread": False} if ANALYTICS_DB_URL.startswith("sqlite") else {}
        self.engine = create_engine(
            ANALYTICS_DB_URL,
            future=True,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args=connect_args,
        )
        metadata = MetaData()
        self.table = Table(
            "ai_analytics",
            metadata,
            Column("id", Integer, primary_key=True, autoincrement=True),
            Column("session_id", String(64), nullable=False, index=True),
            Column("user_id", String(64), nullable=True, index=True),
            Column("timestamp", DateTime, nullable=False, index=True),
            Column("message", String(2000), nullable=False),
            Column("intent", String(50), nullable=False, index=True),
            Column("role", String(20), nullable=False),
            Column("language", String(20), nullable=False, index=True),
            Column("entities_json", String(2000), nullable=True),
            Column("properties_count", Integer, default=0),
            Column("response_time_ms", Integer, default=0),
            Column("user_feedback", String(20), nullable=True),
        )
        metadata.create_all(self.engine)
        logger.info("Analytics store initialized at %s", ANALYTICS_DB_URL)

    def _now(self):
        return datetime.now(timezone.utc)

    def log_interaction(
        self,
        session_id: str,
        user_id: Optional[str],
        message: str,
        intent: str,
        role: str,
        language: str,
        entities: Optional[Dict] = None,
        properties_count: int = 0,
        response_time_ms: int = 0,
        user_feedback: Optional[str] = None,
    ) -> bool:
        """Log a single chat interaction."""
        try:
            with self.engine.begin() as conn:
                conn.execute(
                    self.table.insert().values(
                        session_id=session_id or '',
                        user_id=user_id,
                        timestamp=self._now(),
                        message=message[:2000],
                        intent=intent,
                        role=role,
                        language=language,
                        entities_json=json.dumps(entities, ensure_ascii=False, default=str)[:2000] if entities else None,
                        properties_count=properties_count,
                        response_time_ms=response_time_ms,
                        user_feedback=user_feedback,
                    )
                )
            return True
        except SQLAlchemyError as err:
            logger.error("Failed to log analytics: %s", err)
            return False

    def get_overview(self) -> Dict[str, Any]:
        """Get high-level analytics overview."""
        try:
            t = self.table
            with self.engine.connect() as conn:
                # Total conversations (unique session_ids)
                total_conversations = conn.execute(
                    select(func.count(func.distinct(t.c.session_id)))
                ).scalar() or 0

                # Total messages
                total_messages = conn.execute(
                    select(func.count(t.c.id))
                ).scalar() or 0

                # Average response time
                avg_response_time = conn.execute(
                    select(func.avg(t.c.response_time_ms))
                ).scalar() or 0.0

                # Total recommendations (sum of properties_count)
                total_recommendations = conn.execute(
                    select(func.sum(t.c.properties_count))
                ).scalar() or 0

            return {
                "total_conversations": int(total_conversations),
                "total_messages": int(total_messages),
                "avg_response_time_ms": round(float(avg_response_time), 2),
                "total_recommendations": int(total_recommendations),
            }
        except SQLAlchemyError as err:
            logger.error("Analytics overview failed: %s", err)
            return {
                "total_conversations": 0,
                "total_messages": 0,
                "avg_response_time_ms": 0.0,
                "total_recommendations": 0,
            }

    def get_intent_distribution(self) -> List[Dict[str, Any]]:
        """Get intent distribution."""
        try:
            t = self.table
            with self.engine.connect() as conn:
                total = conn.execute(select(func.count(t.c.id))).scalar() or 1
                results = conn.execute(
                    select(t.c.intent, func.count(t.c.id).label("count"))
                    .group_by(t.c.intent)
                    .order_by(desc("count"))
                ).all()

            return [
                {
                    "intent": row.intent,
                    "count": int(row.count),
                    "percentage": round(int(row.count) / total * 100, 1),
                }
                for row in results
            ]
        except SQLAlchemyError as err:
            logger.error("Intent distribution failed: %s", err)
            return []

    def get_language_distribution(self) -> List[Dict[str, Any]]:
        """Get language distribution."""
        try:
            t = self.table
            with self.engine.connect() as conn:
                total = conn.execute(select(func.count(t.c.id))).scalar() or 1
                results = conn.execute(
                    select(t.c.language, func.count(t.c.id).label("count"))
                    .group_by(t.c.language)
                    .order_by(desc("count"))
                ).all()

            return [
                {
                    "language": row.language,
                    "count": int(row.count),
                    "percentage": round(int(row.count) / total * 100, 1),
                }
                for row in results
            ]
        except SQLAlchemyError as err:
            logger.error("Language distribution failed: %s", err)
            return []

    def get_timeline(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get daily timeline."""
        try:
            t = self.table
            since = self._now() - timedelta(days=days)
            with self.engine.connect() as conn:
                results = conn.execute(
                    select(
                        func.date(t.c.timestamp).label("date"),
                        func.count(func.distinct(t.c.session_id)).label("conversations"),
                        func.count(t.c.id).label("messages"),
                        func.avg(t.c.response_time_ms).label("avg_response_time_ms"),
                    )
                    .where(t.c.timestamp >= since)
                    .group_by("date")
                    .order_by("date")
                ).all()

            return [
                {
                    "date": row.date,
                    "conversations": int(row.conversations),
                    "messages": int(row.messages),
                    "avg_response_time_ms": round(float(row.avg_response_time_ms or 0), 2),
                }
                for row in results
            ]
        except SQLAlchemyError as err:
            logger.error("Timeline failed: %s", err)
            return []

    def get_top_searches(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most frequent search entities."""
        try:
            t = self.table
            with self.engine.connect() as conn:
                # Get recent SEARCH interactions
                results = conn.execute(
                    select(t.c.entities_json)
                    .where(t.c.intent == "SEARCH")
                    .order_by(desc(t.c.timestamp))
                    .limit(1000)
                ).all()

            # Aggregate cities
            city_counts: Dict[str, int] = {}
            type_counts: Dict[str, int] = {}
            for row in results:
                if not row.entities_json:
                    continue
                try:
                    entities = json.loads(row.entities_json)
                    if entities.get("city"):
                        city = entities["city"]
                        city_counts[city] = city_counts.get(city, 0) + 1
                    if entities.get("property_type"):
                        ptype = entities["property_type"]
                        type_counts[ptype] = type_counts.get(ptype, 0) + 1
                except Exception:
                    continue

            top_cities = sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
            top_types = sorted(type_counts.items(), key=lambda x: x[1], reverse=True)[:limit]

            output = []
            for city, count in top_cities:
                output.append({"entity_type": "city", "value": city, "count": count})
            for ptype, count in top_types:
                output.append({"entity_type": "property_type", "value": ptype, "count": count})

            return sorted(output, key=lambda x: x["count"], reverse=True)[:limit]
        except SQLAlchemyError as err:
            logger.error("Top searches failed: %s", err)
            return []


# Global instance
_analytics_store: Optional[AnalyticsStore] = None


def get_analytics_store() -> AnalyticsStore:
    global _analytics_store
    if _analytics_store is None:
        _analytics_store = AnalyticsStore()
    return _analytics_store
