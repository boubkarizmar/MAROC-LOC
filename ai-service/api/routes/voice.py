from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request
from core.limiter import limiter
from schemas.models import VoiceChatResponse, VoiceTranscribeResponse
from services.llm_engine import llm_engine
from services.voice_engine import voice_engine
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/voice/transcribe", response_model=VoiceTranscribeResponse)
@limiter.limit("15/minute")
async def transcribe_endpoint(
    request: Request,
    audio: UploadFile = File(..., description="Audio file (mp3, wav, m4a)"),
    language: str = Form(None, description="auto | darija | arabic | french | english")
):
    try:
        audio_bytes = await audio.read()
        result = voice_engine.transcribe(audio_bytes, language=language)
        return VoiceTranscribeResponse(**result)
    except Exception as e:
        logger.error(f"Voice error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice/chat", response_model=VoiceChatResponse)
@limiter.limit("10/minute")
async def voice_chat_endpoint(
    request: Request,
    audio: UploadFile = File(..., description="Audio file (webm, mp3, wav, m4a)"),
    sessionId: str = Form(None, description="Conversation session identifier"),
    language: str = Form("auto", description="auto | darija | arabic | french | english")
):
    try:
        audio_bytes = await audio.read()
        transcript = voice_engine.transcribe(audio_bytes, language=language)
        result = llm_engine.generate_rag_response(
            query=transcript["text"],
            session_id=sessionId,
            language=language or transcript.get("language_detected") or "auto",
        )
        return VoiceChatResponse(transcript=transcript["text"], **result)
    except Exception as e:
        logger.error(f"Voice chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
