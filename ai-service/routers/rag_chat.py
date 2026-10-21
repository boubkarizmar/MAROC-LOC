"""
Enhanced RAG Chatbot Router

End-to-end pipeline:
1. Darija detection & transliteration
2. Intent classification + entity extraction
3. Query rewriting with conversation memory
4. Hybrid vector retrieval (FAISS + metadata filters)
5. Cross-encoder re-ranking
6. LLM response generation with structured grounding
7. Memory update (session + user profile)
"""

import os
import logging
import threading
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from core.limiter import limiter

from rag.darija_translator import get_darija_translator
from rag.memory.conversation_memory import get_conversation_memory, ConversationTurn
from rag.retrieval.vector_retriever import get_vector_retriever  # kept for startup pre-load compatibility
from models.intent_classifier import get_intent_classifier
from models.entity_extractor import get_entity_extractor
from services.rag_service import get_rag_pipeline
from core.config import settings

try:
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rag", tags=["rag-chat"])

# Thread-safe LLM loading with lock
_llm_lock = threading.Lock()
_llm_pipeline = None


def _get_llm():
    global _llm_pipeline
    if _llm_pipeline is not None:
        return _llm_pipeline

    with _llm_lock:
        if _llm_pipeline is None and TRANSFORMERS_AVAILABLE:
            logger.info("Loading FLAN-T5 for RAG generation...")
            try:
                _llm_pipeline = pipeline(
                    "text2text-generation",
                    model=settings.LLM_MODEL or "google/flan-t5-base",
                    device=0 if settings.DEVICE == "cuda" else -1,
                    max_length=512,
                )
                logger.info("LLM loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load LLM: {e}")
                _llm_pipeline = None
    return _llm_pipeline


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=1000)
    session_id: str
    user_id: Optional[str] = None
    language: Optional[str] = None  # auto-detect if null
    voice: bool = False
    context: Optional[Dict] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    reply: str
    reply_fr: Optional[str] = None
    reply_ar: Optional[str] = None
    intent: str
    entities: Dict
    confidence: float
    sources: List[Dict]
    suggested_properties: List[str]
    audio_url: Optional[str] = None


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def rag_chat(request: Request, chat_request: ChatRequest):
    if not chat_request.message or not chat_request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(chat_request.message) > 2000:
        raise HTTPException(status_code=400, detail="Message too long (max 2000 characters)")
    if not chat_request.session_id or len(chat_request.session_id) < 4:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    try:
        # 1. Language detection & Darija processing
        translator = get_darija_translator()
        processed = translator.process(chat_request.message)
        detected_lang = processed.get("language", "french")
        clean_query = processed.get("clean_query", chat_request.message)

        # 2. Intent & entities
        intent_classifier = get_intent_classifier()
        entity_extractor = get_entity_extractor()
        intent_result = intent_classifier.classify(clean_query)
        intent = intent_result.get("primary_intent", "SEARCH") if isinstance(intent_result, dict) else str(intent_result)
        intent_confidence = intent_result.get("confidence", 0.5) if isinstance(intent_result, dict) else 0.5
        entities_obj = entity_extractor.extract_all_filters(clean_query)
        entities = {
            "city": entities_obj.city,
            "min_price": entities_obj.min_price,
            "max_price": entities_obj.max_price,
            "property_type": entities_obj.property_type,
            "transaction_type": entities_obj.transaction_type,
            "bedrooms": entities_obj.bedrooms,
            "amenities": entities_obj.amenities,
        }

        # 3. Memory & context
        memory = get_conversation_memory()
        context_window = memory.get_context_window(
            chat_request.session_id, chat_request.user_id, max_tokens=1500
        )

        # 4. Unified RAG pipeline
        rag = get_rag_pipeline()
        rag_result = rag.answer(
            query=clean_query,
            lang=detected_lang,
            intent=intent,
            entities=entities,
            use_mmr=True,
            top_k=5,
        )

        reply = rag_result.get("response") or _fallback_reply(intent, entities, [])
        sources = rag_result.get("sources", [])
        suggested_properties = [p.get("id") for p in rag_result.get("properties", []) if p.get("id")]

        # 5. Update memory
        memory.add_turn(chat_request.session_id, ConversationTurn(
            role="user",
            content=chat_request.message,
            timestamp=datetime.now(),
            intent=intent,
            entities=entities,
        ))
        memory.add_turn(chat_request.session_id, ConversationTurn(
            role="assistant",
            content=reply,
            timestamp=datetime.now(),
            properties_suggested=suggested_properties,
        ))

        if chat_request.user_id and entities:
            memory.update_user_memory(chat_request.user_id, {
                "preferences": {k: str(v) for k, v in entities.items() if v}
            })

        return ChatResponse(
            reply=reply,
            intent=intent,
            entities=entities,
            confidence=round(intent_confidence, 2),
            sources=[{"id": s.get("id"), "score": s.get("score"), "source": s.get("metadata", {}).get("source", "unknown")} for s in sources],
            suggested_properties=suggested_properties,
            audio_url=None,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("RAG chat failed")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


def _sanitize_input(text: str) -> str:
    """Basic prompt injection sanitization."""
    if not text:
        return ""
    # Remove common prompt injection patterns
    text = text.replace("Answer:", "")
    text = text.replace("System:", "")
    text = text.replace("Assistant:", "")
    text = text.replace("Ignore previous instructions", "")
    text = text.replace("Disregard", "")
    # Truncate excessively long inputs
    return text[:2000]


def _build_prompt(query: str, intent: str, entities: Dict, sources: str,
                  context: str, lang: str) -> str:
    lang_instruction = {
        "darija": "Respond in Darija (Moroccan Arabic) using Arabic script.",
        "arabic": "Respond in Modern Standard Arabic.",
        "french": "Respond in French.",
        "english": "Respond in English.",
    }.get(lang, "Respond in the same language as the user.")

    safe_query = _sanitize_input(query)
    safe_context = _sanitize_input(context)
    safe_sources = sources[:3000] if sources else ""

    return f"""You are MAROC-LOC AI, a helpful Moroccan real estate assistant.
{lang_instruction}

Conversation context:
{safe_context}

User query: {safe_query}
Intent: {intent}
Entities: {entities}

Relevant properties:
{safe_sources}

Provide a helpful, concise response. Mention specific property details and prices when relevant.
Answer:"""


def _fallback_reply(intent: str, entities: Dict, reranked: List) -> str:
    if intent == "search" and reranked:
        props = ", ".join([r.metadata.get("title", r.property_id) for r in reranked[:3]])
        return f"J'ai trouvé quelques biens qui pourraient vous intéresser : {props}. Souhaitez-vous plus de détails ?"
    if intent == "price_inquiry":
        return "Le prix dépend de plusieurs facteurs : localisation, surface, état. Pouvez-vous me donner plus de détails ?"
    return "Je suis là pour vous aider à trouver un bien immobilier au Maroc. Que cherchez-vous exactement ?"


@router.post("/feedback")
@limiter.limit("30/minute")
async def chat_feedback(request: Request, session_id: str, helpful: bool, user_id: Optional[str] = None):
    try:
        memory = get_conversation_memory()
        summary = memory.summarize_session(session_id)
        logger.info(f"Chat feedback: session={session_id}, helpful={helpful}, summary={summary}")
        return {"status": "recorded"}
    except Exception as e:
        logger.error(f"Feedback recording failed: {e}")
        return {"status": "error", "detail": str(e)}
