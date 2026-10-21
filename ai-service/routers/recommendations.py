"""
FastAPI router for property recommendations.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field

from core.limiter import limiter
from models.recommendation_engine import get_recommendation_engine, RecommendationRequest, RecommendationResult

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class RecommendationRequestDto(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    context: dict = Field(default_factory=dict, description="Search context (city, device, etc.)")
    n_results: int = Field(default=20, ge=1, le=100)
    diversity_boost: float = Field(default=0.3, ge=0.0, le=1.0)


class PropertyRecommendationDto(BaseModel):
    property_id: str
    score: float
    reason: str
    price_trend: Optional[str] = None


class RecommendationResponseDto(BaseModel):
    model_config = {"protected_namespaces": ()}
    recommendations: List[PropertyRecommendationDto]
    explanation: str
    model_version: str = "rec-v1.0-hybrid"


@router.post("", response_model=RecommendationResponseDto)
@limiter.limit("20/minute")
async def get_recommendations(request: Request, rec_request: RecommendationRequestDto):
    engine = get_recommendation_engine()
    internal_request = RecommendationRequest(
        user_id=rec_request.user_id,
        context=rec_request.context,
        n_results=rec_request.n_results,
        diversity_boost=rec_request.diversity_boost
    )
    try:
        results = engine.recommend(internal_request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")

    return RecommendationResponseDto(
        recommendations=[
            PropertyRecommendationDto(
                property_id=r.property_id,
                score=r.score,
                reason=r.reason,
                price_trend=r.price_trend
            ) for r in results
        ],
        explanation=f"Personalized recommendations based on {len(results)} candidates ranked and diversified."
    )


@router.post("/feedback")
@limiter.limit("30/minute")
async def submit_feedback(
    request: Request,
    user_id: str,
    property_id: str,
    clicked: bool,
    saved: bool = False,
    contacted: bool = False
):
    """Submit user feedback for recommendation improvement."""
    # In production: store to event log for retraining
    return {"status": "recorded", "user_id": user_id, "property_id": property_id}
