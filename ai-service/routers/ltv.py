"""
LTV Prediction API
"""

from typing import List
from fastapi import APIRouter
from pydantic import BaseModel

from models.ltv.ltv_calculator import get_ltv_model

router = APIRouter(prefix="/ltv", tags=["ltv"])


class LTVRequest(BaseModel):
    user_id: str
    tier: str = "FREE"
    months_subscribed: int = 0
    total_payments: float = 0.0
    failed_payments: int = 0
    avg_monthly_events: float = 0
    unique_properties_viewed_30d: int = 0
    messages_sent_30d: int = 0
    listings_active: int = 0
    support_tickets: int = 0
    days_since_last_login: int = 0
    acquisition_channel: str = "organic"
    city: str = "Casablanca"


class LTVResponse(BaseModel):
    user_id: str
    predicted_ltv: float
    predicted_months: float
    churn_probability: float
    monthly_value: float
    confidence_interval: tuple
    feature_importance: dict


@router.post("/predict", response_model=LTVResponse)
async def predict_ltv(request: LTVRequest):
    model = get_ltv_model()
    result = model.predict(request.dict())
    return LTVResponse(**result.__dict__)


@router.post("/batch")
async def batch_predict_ltv(requests: List[LTVRequest]):
    model = get_ltv_model()
    results = model.batch_predict([r.dict() for r in requests])
    return {"predictions": results}
