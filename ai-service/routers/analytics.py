"""
Analytics & TTS Router for MAROC-LOC AI Service

Provides:
- TTS endpoint: POST /analytics/tts
- Analytics endpoints: GET /analytics/*
"""

import logging
import os
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import FileResponse
from core.limiter import limiter
from services.tts_engine import get_tts_engine
from services.analytics_store import get_analytics_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])

# ─── TTS Endpoint ───────────────────────────────────────────────────

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Text to synthesize")
    language: str = Field(default="french", description="french | arabic | english | darija")


class TTSResponse(BaseModel):
    audio_url: str
    language: str
    duration_estimate: float


@router.post("/tts", response_model=TTSResponse)
@limiter.limit("30/minute")
async def text_to_speech(request: Request, tts_request: TTSRequest):
    """Convert text to speech and return an MP3 audio file URL."""
    engine = get_tts_engine()
    if not engine.available:
        raise HTTPException(status_code=503, detail="TTS service is not available. Please install edge-tts.")

    try:
        filename = f"tts_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(tts_request.text) & 0xFFFFFFFF}.mp3"
        file_path = await engine.generate_audio(
            text=tts_request.text,
            language=tts_request.language,
            filename=filename,
        )

        if not file_path:
            raise HTTPException(status_code=500, detail="TTS generation failed")

        duration_estimate = max(1.0, len(tts_request.text) / 12.0)

        return TTSResponse(
            audio_url=f"/analytics/tts/audio/{filename}",
            language=tts_request.language,
            duration_estimate=round(duration_estimate, 1),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


@router.get("/tts/audio/{filename}")
async def get_tts_audio(filename: str):
    """Serve a generated TTS audio file."""
    engine = get_tts_engine()
    file_path = engine.output_dir / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        path=str(file_path),
        media_type="audio/mpeg",
        filename=filename,
    )


# ─── Analytics Endpoints ────────────────────────────────────────────

class AnalyticsOverview(BaseModel):
    total_conversations: int
    total_messages: int
    avg_response_time_ms: float
    total_recommendations: int


class IntentDistribution(BaseModel):
    intent: str
    count: int
    percentage: float


class LanguageDistribution(BaseModel):
    language: str
    count: int
    percentage: float


class TimelinePoint(BaseModel):
    date: str
    conversations: int
    messages: int
    avg_response_time_ms: float


class TopSearch(BaseModel):
    entity_type: str
    value: str
    count: int


@router.get("/overview", response_model=AnalyticsOverview)
@limiter.limit("60/minute")
async def get_analytics_overview(request: Request):
    """Get high-level AI chatbot analytics."""
    store = get_analytics_store()
    data = store.get_overview()
    return AnalyticsOverview(**data)


@router.get("/intents", response_model=list[IntentDistribution])
@limiter.limit("60/minute")
async def get_intent_distribution(request: Request):
    """Get intent distribution across all conversations."""
    store = get_analytics_store()
    return store.get_intent_distribution()


@router.get("/languages", response_model=list[LanguageDistribution])
@limiter.limit("60/minute")
async def get_language_distribution(request: Request):
    """Get language distribution across all conversations."""
    store = get_analytics_store()
    return store.get_language_distribution()


@router.get("/timeline")
@limiter.limit("60/minute")
async def get_timeline(request: Request, days: int = 30):
    """Get daily timeline of conversations and metrics."""
    store = get_analytics_store()
    return store.get_timeline(days=days)


@router.get("/top-searches", response_model=list[TopSearch])
@limiter.limit("60/minute")
async def get_top_searches(request: Request, limit: int = 10):
    """Get most frequent search entities (cities, budgets, types)."""
    store = get_analytics_store()
    return store.get_top_searches(limit=limit)


@router.get("/accuracy")
@limiter.limit("60/minute")
async def get_accuracy_metrics(request: Request):
    """Get chatbot accuracy and satisfaction metrics."""
    # In production, this would compare predicted vs expected intents
    store = get_analytics_store()
    overview = store.get_overview()
    return {
        "intent_accuracy": 0.0,
        "user_satisfaction_rate": 0.0,
        "total_evaluated": overview["total_messages"],
    }
