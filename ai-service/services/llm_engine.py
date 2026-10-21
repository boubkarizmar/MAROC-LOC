import logging
from typing import Any, Dict, Optional

from core.config import settings
from services.session_store import session_store
from pipelines.rag_pipeline import rag_pipeline

logger = logging.getLogger(__name__)


class LLMEngine:
    """
    Simplified LLM Engine that uses the RAG pipeline
    No hallucination - results always validated against PostgreSQL
    """

    def generate_rag_response(
        self,
        query: str,
        top_k: int | None = None,
        session_id: Optional[str] = None,
        language: str = "auto",
    ) -> Dict[str, Any]:
        """Main entry point for AI responses"""

        session_id = session_id or session_store.create_session()
        session_store.append_message(session_id, "user", query)

        # Run RAG pipeline
        result = rag_pipeline.process(
            query=query,
            session_id=session_id,
            user_language=language
        )

        session_store.append_message(session_id, "assistant", result.answer)

        return {
            "response": result.answer,
            "sources": result.sources,
            "property_ids": result.property_ids,
            "confidence": result.confidence,
            "sessionId": session_id,
            "language": result.language,
            "has_results": result.has_results,
            "filters": {
                "city": result.filters.city,
                "min_price": result.filters.min_price,
                "max_price": result.filters.max_price,
                "property_type": result.filters.property_type,
                "transaction_type": result.filters.transaction_type,
                "bedrooms": result.filters.bedrooms,
                "amenities": result.filters.amenities
            }
        }


llm_engine = LLMEngine()