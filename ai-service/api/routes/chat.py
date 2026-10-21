from fastapi import APIRouter, HTTPException, Request
from core.limiter import limiter
from schemas.models import ChatRequest, ChatResponse
from services.llm_engine import llm_engine
from services.nlp_engine import nlp_engine
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat_endpoint(request: Request, chat_request: ChatRequest):
    try:
        logger.info(f"Chat request: {chat_request.message} (lang: {chat_request.language})")

        # Prétraiter et générer la réponse
        result = llm_engine.generate_rag_response(
            query=chat_request.message,
            session_id=chat_request.sessionId,
            language=chat_request.language or "auto"
        )

        logger.info(f"Response generated with {len(result.get('sources', []))} sources")

        return ChatResponse(
            response=result.get("response", ""),
            sources=result.get("sources", []),
            confidence=result.get("confidence", 0.0),
            sessionId=result.get("sessionId"),
            language=result.get("language"),
            filters=result.get("filters", {})
        )

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))