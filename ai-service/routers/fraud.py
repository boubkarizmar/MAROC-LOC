"""
FastAPI router for fraud detection.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field

from core.limiter import limiter
from models.fraud_detector import get_fraud_detector

router = APIRouter(prefix="/fraud", tags=["fraud"])


class FraudCheckRequestDto(BaseModel):
    property_id: int = Field(..., description="Property listing ID")
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    surface: Optional[float] = None
    city: Optional[str] = None
    property_type: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    user_id: int = Field(..., description="Poster user ID")
    ip_address: Optional[str] = None
    device_fingerprint: Optional[str] = None

    # User context
    account_age_days: float = 0.0
    listings_count: int = 0
    ip_listing_count_24h: int = 0
    device_fp_listing_count_24h: int = 0


class FraudCheckResponseDto(BaseModel):
    model_config = {"protected_namespaces": ()}
    property_id: int
    score: float = Field(..., ge=0.0, le=1.0)
    decision: str  # AUTO_APPROVE, MANUAL_REVIEW, AUTO_FLAG
    confidence: float
    features: dict
    rules_triggered: List[str]
    explanation: str
    model_version: str


@router.post("/check", response_model=FraudCheckResponseDto)
@limiter.limit("30/minute")
async def check_fraud(request: Request, fraud_request: FraudCheckRequestDto):
    detector = get_fraud_detector()

    listing = {
        "price": fraud_request.price,
        "surface": fraud_request.surface,
        "description": fraud_request.description,
        "title": fraud_request.title,
        "city": fraud_request.city,
        "property_type": fraud_request.property_type,
        "images": fraud_request.images,
        "contact_phone": fraud_request.contact_phone,
        "contact_email": fraud_request.contact_email,
        "listing_hour": 12  # placeholder
    }
    user_context = {
        "account_age_days": fraud_request.account_age_days,
        "listings_count": fraud_request.listings_count,
        "ip_listing_count_24h": fraud_request.ip_listing_count_24h,
        "device_fp_listing_count_24h": fraud_request.device_fp_listing_count_24h
    }

    try:
        result = detector.predict(listing, user_context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud detection error: {str(e)}")

    return FraudCheckResponseDto(
        property_id=fraud_request.property_id,
        score=result["score"],
        decision=result["decision"],
        confidence=result["confidence"],
        features=result["features"],
        rules_triggered=result["rules_triggered"],
        explanation=result["explanation"],
        model_version=result["model_version"]
    )


@router.post("/train")
@limiter.limit("5/minute")
async def train_fraud_model(request: Request):
    """Retrain fraud model with latest labeled data. Admin only."""
    detector = get_fraud_detector()
    pipeline = __import__("services.kaggle_pipeline", fromlist=["get_kaggle_pipeline"]).get_kaggle_pipeline()
    synthetic_df = pipeline.generate_synthetic_fraud_labels(n_legit=8000, n_fraud=800)
    detector.train(synthetic_df)
    return {"status": "trained", "samples": len(synthetic_df)}
