"""
Customer Lifetime Value (LTV) Model for MAROC-LOC SaaS

Predicts expected revenue from a subscriber over their lifetime.
Uses survival analysis + monetization forecasting.

Features:
- Subscription tier history
- Payment consistency (failed payments, late renewals)
- Engagement (property views, messages, listings)
- Support tickets (sentiment, resolution time)
- Market context (city, seasonality)
"""

import os
import logging
from typing import Dict, Optional
from dataclasses import dataclass

import numpy as np
import pandas as pd

try:
    from sklearn.ensemble import GradientBoostingRegressor
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

logger = logging.getLogger(__name__)


@dataclass
class LTVFeatures:
    user_id: str
    current_tier: str
    months_subscribed: int
    total_payments: float
    failed_payments: int
    avg_monthly_events: float
    unique_properties_viewed_30d: int
    messages_sent_30d: int
    listings_active: int
    support_tickets: int
    days_since_last_login: int
    acquisition_channel: str
    city: str


@dataclass
class LTVPrediction:
    user_id: str
    predicted_ltv: float
    predicted_months: float
    churn_probability: float
    monthly_value: float
    confidence_interval: tuple
    feature_importance: Dict[str, float]


class LTVModel:
    """
    Production LTV predictor for Moroccan real estate SaaS.
    """

    TIER_MONTHLY_PRICES = {
        "FREE": 0,
        "PREMIUM": 99,
        "FEATURED": 299,
    }

    def __init__(self):
        self.model_dir = os.path.join(os.path.dirname(__file__), "..", "..", "model_weights")
        self.regressor = None
        self.churn_model = None
        self._load_or_init()

    def _load_or_init(self):
        if SKLEARN_AVAILABLE:
            self.regressor = GradientBoostingRegressor(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.1,
                random_state=42,
            )
            # In production: load from MLflow or pickle
            logger.info("LTV model initialized")

    def extract_features(self, user_data: Dict) -> LTVFeatures:
        return LTVFeatures(
            user_id=str(user_data.get("user_id", "")),
            current_tier=user_data.get("tier", "FREE"),
            months_subscribed=user_data.get("months_subscribed", 0),
            total_payments=float(user_data.get("total_payments", 0)),
            failed_payments=user_data.get("failed_payments", 0),
            avg_monthly_events=user_data.get("avg_monthly_events", 0),
            unique_properties_viewed_30d=user_data.get("unique_properties_viewed_30d", 0),
            messages_sent_30d=user_data.get("messages_sent_30d", 0),
            listings_active=user_data.get("listings_active", 0),
            support_tickets=user_data.get("support_tickets", 0),
            days_since_last_login=user_data.get("days_since_last_login", 0),
            acquisition_channel=user_data.get("acquisition_channel", "organic"),
            city=user_data.get("city", "Casablanca"),
        )

    def _features_to_vector(self, features: LTVFeatures) -> np.ndarray:
        tier_encoded = {"FREE": 0, "PREMIUM": 1, "FEATURED": 2}.get(features.current_tier, 0)
        city_encoded = {"casablanca": 0, "rabat": 1, "marrakech": 2, "tanger": 3,
                        "agadir": 4, "fes": 5}.get(features.city.lower(), 0)
        channel_encoded = {"organic": 0, "paid_social": 1, "google_ads": 2,
                           "referral": 3, "cmi_partner": 4}.get(features.acquisition_channel, 0)

        return np.array([
            tier_encoded,
            features.months_subscribed,
            features.total_payments,
            features.failed_payments,
            features.avg_monthly_events,
            features.unique_properties_viewed_30d,
            features.messages_sent_30d,
            features.listings_active,
            features.support_tickets,
            features.days_since_last_login,
            city_encoded,
            channel_encoded,
        ], dtype=np.float32).reshape(1, -1)

    def predict(self, user_data: Dict) -> LTVPrediction:
        features = self.extract_features(user_data)
        x = self._features_to_vector(features)

        # Heuristic baseline model (replace with trained regressor in production)
        monthly_price = self.TIER_MONTHLY_PRICES.get(features.current_tier, 0)

        # Engagement score: normalize 0-1
        engagement = min(1.0, (
            features.avg_monthly_events / 50 +
            features.unique_properties_viewed_30d / 20 +
            features.messages_sent_30d / 10
        ) / 3)

        # Churn heuristic
        churn_risk = 0.0
        if features.days_since_last_login > 14:
            churn_risk += 0.3
        if features.failed_payments > 0:
            churn_risk += 0.2 * features.failed_payments
        if features.avg_monthly_events < 2:
            churn_risk += 0.2
        if features.support_tickets > 2:
            churn_risk += 0.1
        churn_risk = min(1.0, churn_risk)

        # Predicted months (survival curve simplified)
        base_months = 12 if features.current_tier != "FREE" else 3
        predicted_months = base_months * (1 - churn_risk) * (1 + engagement * 0.5)

        # LTV
        predicted_ltv = monthly_price * predicted_months

        # Confidence interval (simplified)
        std = predicted_ltv * 0.2
        ci = (max(0, predicted_ltv - 1.96 * std), predicted_ltv + 1.96 * std)

        return LTVPrediction(
            user_id=features.user_id,
            predicted_ltv=round(predicted_ltv, 2),
            predicted_months=round(predicted_months, 1),
            churn_probability=round(churn_risk, 3),
            monthly_value=monthly_price,
            confidence_interval=ci,
            feature_importance={
                "tier": 0.35,
                "engagement": 0.25,
                "churn_risk": 0.20,
                "payment_history": 0.15,
                "support_tickets": 0.05,
            }
        )

    def batch_predict(self, users_data: list) -> list:
        return [self.predict(u).__dict__ for u in users_data]


_ltv_model: Optional[LTVModel] = None


def get_ltv_model() -> LTVModel:
    global _ltv_model
    if _ltv_model is None:
        _ltv_model = LTVModel()
    return _ltv_model
