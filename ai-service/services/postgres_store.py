import logging
from typing import Any, Dict, Iterable, List

from sqlalchemy import MetaData, Table, create_engine, select
from sqlalchemy.exc import SQLAlchemyError

from core.config import settings

logger = logging.getLogger(__name__)


class PostgresPropertyStore:
    def __init__(self):
        self.enabled = bool(settings.DATABASE_URL)
        self.engine = None
        self.table = None

        if not self.enabled:
            logger.info("DATABASE_URL not configured; skipping Postgres property sync.")
            return

        try:
            self.engine = create_engine(settings.DATABASE_URL, future=True)
            metadata = MetaData()
            self.table = Table("property", metadata, autoload_with=self.engine)
            logger.info("Connected to Postgres property table for RAG sync.")
        except Exception as exc:
            logger.error("Unable to initialize Postgres property store: %s", exc)
            self.enabled = False

    def load_properties(self, limit: int = 10000) -> List[Dict[str, Any]]:
        if not self.enabled or self.table is None:
            return []

        try:
            stmt = select(self.table).limit(limit)
            if "status" in self.table.c:
                stmt = stmt.where(self.table.c.status.in_(["APPROVED", "AVAILABLE"]))

            with self.engine.connect() as conn:
                rows = conn.execute(stmt).all()

            properties = [dict(row._mapping) for row in rows]
            logger.info("Loaded %d properties from Postgres.", len(properties))
            return properties
        except SQLAlchemyError as exc:
            logger.error("Error reading properties from Postgres: %s", exc)
            return []

    def load_properties_by_ids(self, property_ids: Iterable[str]) -> Dict[str, Dict[str, Any]]:
        if not self.enabled or self.table is None:
            return {}

        ids = [int(pid) for pid in property_ids if str(pid).isdigit()]
        if not ids:
            return {}

        try:
            stmt = select(self.table).where(self.table.c.id.in_(ids))
            if "status" in self.table.c:
                stmt = stmt.where(self.table.c.status.in_(["APPROVED", "AVAILABLE"]))

            with self.engine.connect() as conn:
                rows = conn.execute(stmt).all()

            return {str(row._mapping["id"]): dict(row._mapping) for row in rows}
        except SQLAlchemyError as exc:
            logger.error("Error loading properties by ids from Postgres: %s", exc)
            return {}


postgres_store = PostgresPropertyStore()
