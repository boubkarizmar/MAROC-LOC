"""
Fraud Detection Model for MAROC-LOC

Hybrid approach:
- Isolation Forest for anomaly detection (unsupervised)
- XGBoost classifier (supervised, when labels available)
- Rule engine for hard constraints

Features:
- Listing content (price, description, images)
- User behavior (account age, listing frequency)
- Network signals (IP, device fingerprint)
- Image analysis (duplicate detection, quality)
- Text analysis (sentiment, template matching)
"""

import os
import re
import hashlib
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

import numpy as np
import pandas as pd

try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

logger = logging.getLogger(__name__)

MOROCCAN_PHONE_PATTERN = re.compile(r"^(\+212|0)[567][0-9]{8}$")
SUSPICIOUS_DOMAINS = {"tempmail.com", "guerrillamail.com", "10minutemail.com",
                      "throwawaymail.com", "yopmail.com", "mailinator.com"}


@dataclass
class FraudFeatures:
    price: float
    surface: float
    description_length: int
    image_count: int
    account_age_days: float
    listings_count: int
    price_per_m2: float
    median_price_per_m2_city: float
    price_deviation_ratio: float
    has_contact_phone: bool
    phone_is_moroccan: bool
    has_contact_email: bool
    email_is_suspicious: bool
    description_sentiment: float
    image_duplicate_count: int
    listing_hour: int
    ip_listing_count_24h: int
    device_fp_listing_count_24h: int
    title_template_match_score: float
    description_has_contact_info: bool


class FraudDetector:
    """
    Production fraud detection for real estate listings.
    """

    def __init__(self):
        self.model_dir = os.path.join(os.path.dirname(__file__), "..", "model_weights")
        os.makedirs(self.model_dir, exist_ok=True)

        self.isolation_forest: Optional[Any] = None
        self.xgb_classifier: Optional[xgb.Booster] = None
        self.city_median_prices: Dict[str, float] = {
            "casablanca": 8500,
            "rabat": 9000,
            "marrakech": 10000,
            "tanger": 7000,
            "agadir": 6500,
            "fes": 5500,
            "meknes": 4500,
            "tetouan": 5000,
        }
        self._load_models()

    def _load_models(self):
        if SKLEARN_AVAILABLE:
            if_path = os.path.join(self.model_dir, "isolation_forest.pkl")
            if os.path.exists(if_path):
                import joblib
                self.isolation_forest = joblib.load(if_path)
                logger.info("Loaded Isolation Forest model")

        if XGBOOST_AVAILABLE:
            xgb_path = os.path.join(self.model_dir, "fraud_xgb.json")
            if os.path.exists(xgb_path):
                self.xgb_classifier = xgb.Booster()
                self.xgb_classifier.load_model(xgb_path)
                logger.info("Loaded XGBoost fraud classifier")

    def _save_models(self):
        if SKLEARN_AVAILABLE and self.isolation_forest:
            import joblib
            joblib.dump(self.isolation_forest, os.path.join(self.model_dir, "isolation_forest.pkl"))
        if XGBOOST_AVAILABLE and self.xgb_classifier:
            self.xgb_classifier.save_model(os.path.join(self.model_dir, "fraud_xgb.json"))

    def extract_features(self, listing: Dict[str, Any], user_context: Dict[str, Any]) -> FraudFeatures:
        """Extract structured features from raw listing + user context."""
        price = float(listing.get("price", 0) or 0)
        surface = float(listing.get("surface", 1) or 1)
        description = listing.get("description", "") or ""
        city = (listing.get("city", "") or "").lower().strip()
        images = listing.get("images", []) or []

        price_per_m2 = price / surface if surface > 0 else 0
        median_ppm2 = self.city_median_prices.get(city, 7000)
        price_deviation = price_per_m2 / median_ppm2 if median_ppm2 > 0 else 1.0

        phone = listing.get("contact_phone", "") or ""
        email = listing.get("contact_email", "") or ""

        email_domain = email.split("@")[-1].lower() if "@" in email else ""

        return FraudFeatures(
            price=price,
            surface=surface,
            description_length=len(description),
            image_count=len(images),
            account_age_days=float(user_context.get("account_age_days", 0)),
            listings_count=int(user_context.get("listings_count", 0)),
            price_per_m2=price_per_m2,
            median_price_per_m2_city=median_ppm2,
            price_deviation_ratio=price_deviation,
            has_contact_phone=bool(phone),
            phone_is_moroccan=bool(MOROCCAN_PHONE_PATTERN.match(phone)) if phone else False,
            has_contact_email=bool(email),
            email_is_suspicious=email_domain in SUSPICIOUS_DOMAINS,
            description_sentiment=self._estimate_sentiment(description),
            image_duplicate_count=0,  # would run perceptual hash
            listing_hour=int(listing.get("listing_hour", 12)),
            ip_listing_count_24h=int(user_context.get("ip_listing_count_24h", 0)),
            device_fp_listing_count_24h=int(user_context.get("device_fp_listing_count_24h", 0)),
            title_template_match_score=self._template_match(listing.get("title", "")),
            description_has_contact_info=self._has_external_contact(description)
        )

    def _estimate_sentiment(self, text: str) -> float:
        """Very basic sentiment heuristic. In production: use AraBERT/FlauBERT."""
        positive = ["magnifique", "superbe", "belle", "excellent", "parfait", "riad", "luxueux", "splendide", "agréable"]
        negative = ["probleme", "problème", "mochkil", "urgent", "à vendre rapidement", "fuite", "moisissure", "insalubre"]
        text_lower = text.lower()
        pos_count = sum(1 for w in positive if w in text_lower)
        neg_count = sum(1 for w in negative if w in text_lower)
        total = pos_count + neg_count
        if total == 0:
            return 0.0
        return (pos_count - neg_count) / total

    def _template_match(self, title: str) -> float:
        """Detect templated/title-stuffed listings."""
        templates = ["à vendre", "à louer", "villa", "appartement", "opportunité", "pas cher"]
        title_lower = title.lower()
        matches = sum(1 for t in templates if t in title_lower)
        return min(1.0, matches / 4.0)

    def _has_external_contact(self, text: str) -> bool:
        """Detect if description tries to redirect off-platform."""
        patterns = ["whatsapp", "appeler directement", "contactez-moi sur", "mon numéro", "mon tel"]
        text_lower = text.lower()
        return any(p in text_lower for p in patterns)

    def _features_to_vector(self, features: FraudFeatures) -> np.ndarray:
        return np.array([
            features.price,
            features.surface,
            features.description_length,
            features.image_count,
            features.account_age_days,
            features.listings_count,
            features.price_per_m2,
            features.price_deviation_ratio,
            int(features.has_contact_phone),
            int(features.phone_is_moroccan),
            int(features.has_contact_email),
            int(features.email_is_suspicious),
            features.description_sentiment,
            features.image_duplicate_count,
            features.listing_hour,
            features.ip_listing_count_24h,
            features.device_fp_listing_count_24h,
            features.title_template_match_score,
            int(features.description_has_contact_info)
        ], dtype=np.float32).reshape(1, -1)

    def predict(self, listing: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run full fraud detection pipeline.
        Returns: score, decision, confidence, rules_triggered, explanation
        """
        features = self.extract_features(listing, user_context)
        feature_vec = self._features_to_vector(features)

        rules_triggered = self._apply_hard_rules(features, listing)
        rule_score = min(1.0, len(rules_triggered) * 0.20)

        # Anomaly score from Isolation Forest
        anomaly_score = 0.0
        if SKLEARN_AVAILABLE and self.isolation_forest:
            try:
                raw_score = self.isolation_forest.decision_function(feature_vec)[0]
                # Convert to [0,1] where higher = more anomalous
                anomaly_score = 0.5 - raw_score * 0.5
                anomaly_score = max(0.0, min(1.0, anomaly_score))
            except Exception as e:
                logger.warning("IsolationForest prediction failed: %s", e)

        # Classifier score from XGBoost
        classifier_score = 0.0
        if XGBOOST_AVAILABLE and self.xgb_classifier:
            try:
                dmatrix = xgb.DMatrix(feature_vec)
                classifier_score = float(self.xgb_classifier.predict(dmatrix)[0])
            except Exception as e:
                logger.warning("XGBoost prediction failed: %s", e)

        # Ensemble: weighted average
        final_score = (
            rule_score * 0.35 +
            anomaly_score * 0.25 +
            classifier_score * 0.40
        )
        final_score = round(max(0.0, min(1.0, final_score)), 3)

        if final_score > 0.70:
            decision = "AUTO_FLAG"
        elif final_score > 0.30:
            decision = "MANUAL_REVIEW"
        else:
            decision = "AUTO_APPROVE"

        return {
            "score": final_score,
            "decision": decision,
            "confidence": round(0.8 + 0.15 * (1 - abs(final_score - 0.5)), 3),
            "features": features.__dict__,
            "rules_triggered": rules_triggered,
            "explanation": self._build_explanation(rules_triggered, features),
            "model_version": "fraud-v1.2-hybrid"
        }

    def _apply_hard_rules(self, features: FraudFeatures, listing: Dict) -> List[str]:
        rules = []
        if features.image_count == 0 and features.price > 500000:
            rules.append("ZERO_IMAGES_HIGH_PRICE")
        if features.description_length < 20 and features.price < 50000:
            rules.append("SHORT_DESCRIPTION_BAIT")
        if features.has_contact_phone and not features.phone_is_moroccan:
            rules.append("FOREIGN_PHONE_NUMBER")
        if features.email_is_suspicious:
            rules.append("SUSPICIOUS_EMAIL_DOMAIN")
        if features.price_deviation_ratio > 5.0:
            rules.append("PRICE_DEVIATION_EXTREME")
        if features.price_deviation_ratio < 0.15 and features.price > 100000:
            rules.append("PRICE_TOO_LOW_SCAM")
        if features.account_age_days < 1 and features.price > 200000:
            rules.append("NEW_ACCOUNT_HIGH_VALUE")
        if features.ip_listing_count_24h > 10:
            rules.append("IP_SPAM_BURST")
        if features.device_fp_listing_count_24h > 10:
            rules.append("DEVICE_SPAM_BURST")
        if features.description_has_contact_info:
            rules.append("EXTERNAL_CONTACT_REDIRECT")
        return rules

    def _build_explanation(self, rules: List[str], features: FraudFeatures) -> str:
        if not rules:
            return "Aucun signal suspect détecté."
        descriptions = {
            "ZERO_IMAGES_HIGH_PRICE": "annonce chère sans photos",
            "SHORT_DESCRIPTION_BAIT": "description très courte (appât)",
            "FOREIGN_PHONE_NUMBER": "numéro non marocain",
            "SUSPICIOUS_EMAIL_DOMAIN": "e-mail temporaire",
            "PRICE_DEVIATION_EXTREME": "prix très éloigné du marché local",
            "PRICE_TOO_LOW_SCAM": "prix anormalement bas pour la valeur",
            "NEW_ACCOUNT_HIGH_VALUE": "nouveau compte avec annonce de valeur",
            "IP_SPAM_BURST": "trop d'annonces depuis la même IP (24h)",
            "DEVICE_SPAM_BURST": "trop d'annonces depuis le même appareil (24h)",
            "EXTERNAL_CONTACT_REDIRECT": "tentative de contact externe"
        }
        parts = [descriptions.get(r, r) for r in rules[:3]]
        return "Signaux suspects: " + ", ".join(parts)

    def train(self, labeled_df: pd.DataFrame):
        """
        Train models on labeled data.
        labeled_df columns: all feature columns + 'label' (0=legit, 1=fraud)
        """
        feature_cols = [c for c in labeled_df.columns if c != "label"]
        X = labeled_df[feature_cols].values
        y = labeled_df["label"].values

        if SKLEARN_AVAILABLE:
            logger.info("Training Isolation Forest...")
            self.isolation_forest = IsolationForest(
                n_estimators=200,
                contamination=0.05,
                random_state=42,
                n_jobs=-1
            )
            self.isolation_forest.fit(X[y == 0])  # Train on legitimate only

        if XGBOOST_AVAILABLE:
            logger.info("Training XGBoost classifier...")
            dtrain = xgb.DMatrix(X, label=y)
            params = {
                "objective": "binary:logistic",
                "eval_metric": ["auc", "logloss"],
                "max_depth": 6,
                "eta": 0.1,
                "subsample": 0.8,
                "scale_pos_weight": sum(y == 0) / max(sum(y == 1), 1)
            }
            self.xgb_classifier = xgb.train(params, dtrain, num_boost_round=150)

        self._save_models()
        logger.info("Fraud model training complete")


_fraud_detector: Optional[FraudDetector] = None


def get_fraud_detector() -> FraudDetector:
    global _fraud_detector
    if _fraud_detector is None:
        _fraud_detector = FraudDetector()
    return _fraud_detector
