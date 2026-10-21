"""
Conversation Memory for RAG Chatbot

Supports:
- Sliding window summary for long conversations
- Entity extraction and user preference persistence
- Cross-session memory via Redis
- Context compression to stay within LLM token limits
"""

import json
import logging
import os
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta

import redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


@dataclass
class ConversationTurn:
    role: str  # user, assistant, system
    content: str
    timestamp: datetime
    intent: Optional[str] = None
    entities: Optional[Dict] = None
    properties_suggested: Optional[List[str]] = None


@dataclass
class UserMemory:
    user_id: str
    preferences: Dict[str, str]  # budget, city, type, etc.
    recent_views: List[str]  # property_ids
    saved_searches: List[Dict]
    last_active: datetime
    conversation_summary: str


class ConversationMemory:
    """
    Redis-backed conversation memory with entity extraction caching.
    """

    def __init__(self, redis_url: Optional[str] = None):
        self.redis = redis.from_url(redis_url or REDIS_URL, decode_responses=True)
        self.max_history = 20
        self.summary_threshold = 10

    def _key(self, session_id: str) -> str:
        return f"chat:session:{session_id}"

    def _user_key(self, user_id: str) -> str:
        return f"chat:user:{user_id}"

    def add_turn(self, session_id: str, turn: ConversationTurn):
        """Append a turn to session history."""
        key = self._key(session_id)
        data = json.dumps({
            "role": turn.role,
            "content": turn.content,
            "timestamp": turn.timestamp.isoformat(),
            "intent": turn.intent,
            "entities": turn.entities,
            "properties_suggested": turn.properties_suggested,
        })
        self.redis.lpush(key, data)
        self.redis.ltrim(key, 0, self.max_history - 1)
        self.redis.expire(key, 86400 * 7)  # 7 days

    def get_history(self, session_id: str, limit: int = 10) -> List[ConversationTurn]:
        """Retrieve recent conversation history."""
        key = self._key(session_id)
        raw = self.redis.lrange(key, 0, limit - 1)
        turns = []
        for item in reversed(raw):  # oldest first
            try:
                d = json.loads(item)
                turns.append(ConversationTurn(
                    role=d["role"],
                    content=d["content"],
                    timestamp=datetime.fromisoformat(d["timestamp"]),
                    intent=d.get("intent"),
                    entities=d.get("entities"),
                    properties_suggested=d.get("properties_suggested"),
                ))
            except Exception as e:
                logger.warning(f"Failed to parse turn: {e}")
        return turns

    def get_context_window(
        self, session_id: str, user_id: Optional[str] = None, max_tokens: int = 2000
    ) -> str:
        """
        Build a context string for LLM prompt, including user memory.
        Compresses if history is too long.
        """
        history = self.get_history(session_id, limit=self.max_history)
        user_memory = self.get_user_memory(user_id) if user_id else None

        parts = []
        if user_memory and user_memory.preferences:
            pref_str = ", ".join([f"{k}={v}" for k, v in user_memory.preferences.items()])
            parts.append(f"[User Preferences: {pref_str}]")

        if user_memory and user_memory.conversation_summary:
            parts.append(f"[Conversation Summary: {user_memory.conversation_summary}]")

        for turn in history:
            prefix = "User" if turn.role == "user" else "Assistant"
            parts.append(f"{prefix}: {turn.content}")

        context = "\n".join(parts)
        # Rough token estimation (1 token ≈ 4 chars for multilingual)
        if len(context) > max_tokens * 4:
            context = self._compress(context, max_tokens * 4)
        return context

    def update_user_memory(self, user_id: str, updates: Dict):
        """Persist extracted user preferences across sessions."""
        key = self._user_key(user_id)
        existing = self.redis.get(key)
        memory = json.loads(existing) if existing else {
            "user_id": user_id,
            "preferences": {},
            "recent_views": [],
            "saved_searches": [],
            "last_active": datetime.now().isoformat(),
            "conversation_summary": "",
        }
        memory["preferences"].update(updates.get("preferences", {}))
        if "recent_views" in updates:
            memory["recent_views"] = (updates["recent_views"] + memory["recent_views"])[:20]
        memory["last_active"] = datetime.now().isoformat()
        self.redis.set(key, json.dumps(memory), ex=86400 * 30)  # 30 days

    def get_user_memory(self, user_id: str) -> Optional[UserMemory]:
        key = self._user_key(user_id)
        raw = self.redis.get(key)
        if not raw:
            return None
        d = json.loads(raw)
        return UserMemory(
            user_id=d["user_id"],
            preferences=d.get("preferences", {}),
            recent_views=d.get("recent_views", []),
            saved_searches=d.get("saved_searches", []),
            last_active=datetime.fromisoformat(d["last_active"]),
            conversation_summary=d.get("conversation_summary", ""),
        )

    def summarize_session(self, session_id: str) -> str:
        """Generate a summary of the session for long-term memory."""
        history = self.get_history(session_id, limit=50)
        if len(history) < self.summary_threshold:
            return ""
        # In production: call a lightweight summarization model
        # Simplified: concatenate user intents
        intents = [t.intent for t in history if t.intent and t.role == "user"]
        entities = []
        for t in history:
            if t.entities:
                entities.append(str(t.entities))
        summary = f"Intents: {', '.join(set(intents))}. "
        if entities:
            summary += f"Entities: {', '.join(set(entities))}."
        return summary

    def _compress(self, text: str, max_chars: int) -> str:
        """Simple truncation with ellipsis. In production: use summarization."""
        if len(text) <= max_chars:
            return text
        return text[:max_chars - 3] + "..."

    def clear_session(self, session_id: str):
        self.redis.delete(self._key(session_id))


_memory: Optional[ConversationMemory] = None


def get_conversation_memory() -> ConversationMemory:
    global _memory
    if _memory is None:
        _memory = ConversationMemory()
    return _memory
