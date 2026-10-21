import json
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, JSON, MetaData, String, Table, create_engine, select, insert, update
from sqlalchemy.exc import SQLAlchemyError

from core.config import settings

logger = logging.getLogger(__name__)


class SessionStore:
    def __init__(self):
        self.engine = create_engine(
            settings.SESSION_DB_URL,
            future=True,
            connect_args={"check_same_thread": False} if settings.SESSION_DB_URL.startswith("sqlite") else {},
        )
        metadata = MetaData()
        self.table = Table(
            "ai_sessions",
            metadata,
            Column("session_id", String(64), primary_key=True),
            Column("created_at", DateTime, nullable=False),
            Column("updated_at", DateTime, nullable=False),
            Column("conversation", JSON, nullable=False),
        )
        metadata.create_all(self.engine)
        logger.info("Session store initialized at %s", settings.SESSION_DB_URL)

    def _now(self):
        return datetime.now(timezone.utc)

    def create_session(self, session_id: str | None = None) -> str:
        session_id = session_id or uuid.uuid4().hex
        now = self._now()
        try:
            with self.engine.begin() as conn:
                # Use insert().prefix_with('OR IGNORE') for SQLite or ON CONFLICT for PostgreSQL
                # For simplicity, try insert and ignore duplicate key errors
                try:
                    conn.execute(
                        insert(self.table).values(
                            session_id=session_id,
                            created_at=now,
                            updated_at=now,
                            conversation=[],
                        )
                    )
                except SQLAlchemyError:
                    # Session may already exist; that's fine
                    pass
            return session_id
        except SQLAlchemyError as err:
            logger.error("Failed to create session: %s", err)
            raise

    def get_session(self, session_id: str) -> dict | None:
        try:
            with self.engine.connect() as conn:
                result = conn.execute(
                    select(self.table).where(self.table.c.session_id == session_id)
                ).one_or_none()
            if result is None:
                return None
            return dict(result._mapping)
        except SQLAlchemyError as err:
            logger.error("Failed to load session %s: %s", session_id, err)
            return None

    def get_messages(self, session_id: str) -> list:
        session = self.get_session(session_id)
        if not session:
            return []
        return session.get("conversation") or []

    def append_message(self, session_id: str, role: str, content: str) -> None:
        # Ensure session exists first
        session_data = self.get_session(session_id)
        if session_data is None:
            self.create_session(session_id)
            session_data = self.get_session(session_id)

        if session_data is None:
            logger.error("Session %s could not be created or retrieved", session_id)
            return

        conversation = session_data.get("conversation") or []
        conversation.append({
            "role": role,
            "content": content,
            "timestamp": self._now().isoformat(),
        })
        try:
            with self.engine.begin() as conn:
                conn.execute(
                    update(self.table)
                    .where(self.table.c.session_id == session_id)
                    .values(
                        conversation=conversation,
                        updated_at=self._now(),
                    )
                )
        except SQLAlchemyError as err:
            logger.error("Failed to append message for session %s: %s", session_id, err)

# Create global instance
session_store = SessionStore()
