"""
Hybrid Recommendation Engine for MAROC-LOC

Combines:
- Content-based filtering (property embeddings, price, location, features)
- Collaborative filtering (user-item interactions via LightFM)
- Embedding-based similarity (sentence-transformers + FAISS)
- Ranking layer (XGBoost pointwise ranker)

Models:
- LightFM for matrix factorization with side features
- FAISS for approximate nearest neighbor search
- XGBoost for final ranking
"""

import os
import pickle
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix

# Optional imports - graceful degradation if not installed
try:
    from lightfm import LightFM
    from lightfm.data import Dataset
    LIGHTFM_AVAILABLE = True
except ImportError:
    LIGHTFM_AVAILABLE = False

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

from sentence_transformers import SentenceTransformer
from core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class RecommendationRequest:
    user_id: str
    context: Dict
    n_results: int = 20
    diversity_boost: float = 0.3


@dataclass
class RecommendationResult:
    property_id: str
    score: float
    reason: str
    price_trend: Optional[str] = None


class RecommendationEngine:
    """
    Production hybrid recommender for Moroccan real estate.
    """

    def __init__(self):
        self.model_dir = os.path.join(os.path.dirname(__file__), "..", "model_weights")
        os.makedirs(self.model_dir, exist_ok=True)

        self.lightfm_model: Optional[LightFM] = None
        self.faiss_index: Optional[faiss.Index] = None
        self.ranker: Optional[xgb.Booster] = None
        self.property_ids: List[str] = []
        self.property_embeddings: np.ndarray = np.array([])
        self.dataset: Optional[Dataset] = None
        self.user_id_map: Dict[str, int] = {}
        self.item_id_map: Dict[str, int] = {}

        self.encoder = SentenceTransformer(settings.EMBEDDING_MODEL)

        self._load_models()

    def _load_models(self):
        """Load persisted models or initialize fresh."""
        lf_path = os.path.join(self.model_dir, "lightfm_model.pkl")
        if LIGHTFM_AVAILABLE and os.path.exists(lf_path):
            with open(lf_path, "rb") as f:
                self.lightfm_model = pickle.load(f)
            logger.info("Loaded LightFM model")

        faiss_path = os.path.join(self.model_dir, "faiss_property.index")
        if FAISS_AVAILABLE and os.path.exists(faiss_path):
            self.faiss_index = faiss.read_index(faiss_path)
            logger.info("Loaded FAISS index")

        ranker_path = os.path.join(self.model_dir, "xgb_ranker.json")
        if XGBOOST_AVAILABLE and os.path.exists(ranker_path):
            self.ranker = xgb.Booster()
            self.ranker.load_model(ranker_path)
            logger.info("Loaded XGBoost ranker")

        ids_path = os.path.join(self.model_dir, "property_ids.pkl")
        if os.path.exists(ids_path):
            with open(ids_path, "rb") as f:
                self.property_ids = pickle.load(f)
            logger.info(f"Loaded {len(self.property_ids)} property IDs")

    def _save_models(self):
        """Persist trained models."""
        if self.lightfm_model:
            with open(os.path.join(self.model_dir, "lightfm_model.pkl"), "wb") as f:
                pickle.dump(self.lightfm_model, f)
        if self.faiss_index:
            faiss.write_index(self.faiss_index, os.path.join(self.model_dir, "faiss_property.index"))
        if self.ranker:
            self.ranker.save_model(os.path.join(self.model_dir, "xgb_ranker.json"))
        with open(os.path.join(self.model_dir, "property_ids.pkl"), "wb") as f:
            pickle.dump(self.property_ids, f)

    def build_content_embeddings(self, properties: List[Dict]) -> np.ndarray:
        """
        Build text embeddings from property descriptions.
        Each property dict should have: id, title, description, city, type, features
        """
        texts = []
        self.property_ids = []
        for prop in properties:
            text = f"{prop.get('title', '')}. {prop.get('description', '')}. " \
                   f"Ville: {prop.get('city', '')}. Type: {prop.get('property_type', '')}. " \
                   f"Caractéristiques: {', '.join(prop.get('features', []))}"
            texts.append(text)
            self.property_ids.append(str(prop["id"]))

        logger.info(f"Encoding {len(texts)} properties...")
        embeddings = self.encoder.encode(texts, show_progress_bar=True, convert_to_numpy=True)
        self.property_embeddings = embeddings

        # Build FAISS index
        if FAISS_AVAILABLE:
            dim = embeddings.shape[1]
            index = faiss.IndexFlatIP(dim)  # Inner product = cosine if normalized
            faiss.normalize_L2(embeddings)
            index.add(embeddings)
            self.faiss_index = index
            logger.info(f"FAISS index built with {index.ntotal} vectors")

        return embeddings

    def train_collaborative(self, interactions_df: pd.DataFrame, user_features_df: Optional[pd.DataFrame] = None,
                            item_features_df: Optional[pd.DataFrame] = None):
        """
        Train LightFM collaborative filtering model.

        interactions_df columns: user_id, property_id, event_strength (float), timestamp
        """
        if not LIGHTFM_AVAILABLE:
            logger.warning("LightFM not installed. Skipping collaborative training.")
            return

        logger.info("Training LightFM collaborative model...")

        dataset = Dataset()
        all_users = interactions_df["user_id"].unique().tolist()
        all_items = interactions_df["property_id"].unique().tolist()
        dataset.fit(users=all_users, items=all_items)

        # Build interaction matrix
        (interactions, weights) = dataset.build_interactions(
            [(row["user_id"], row["property_id"], row["event_strength"])
             for _, row in interactions_df.iterrows()]
        )

        # Build feature matrices
        user_features = None
        item_features = None
        if user_features_df is not None:
            user_features = dataset.build_user_features(
                [(row["user_id"], row["features"]) for _, row in user_features_df.iterrows()]
            )
        if item_features_df is not None:
            item_features = dataset.build_item_features(
                [(row["property_id"], row["features"]) for _, row in item_features_df.iterrows()]
            )

        model = LightFM(loss="warp", no_components=128, learning_rate=0.05, epochs=30)
        model.fit(interactions, sample_weight=weights,
                  user_features=user_features, item_features=item_features,
                  verbose=True)

        self.lightfm_model = model
        self.dataset = dataset
        self.user_id_map = {uid: i for i, uid in enumerate(all_users)}
        self.item_id_map = {iid: i for i, iid in enumerate(all_items)}
        logger.info("LightFM training complete")
        self._save_models()

    def train_ranker(self, training_data: pd.DataFrame):
        """
        Train XGBoost pointwise ranker.

        training_data columns:
        - user_id, property_id, label (0/1 clicked or not)
        - features: cosine_sim, user_avg_price, price_diff_pct, city_match,
                    listing_age_days, user_viewed_before, ctr_property
        """
        if not XGBOOST_AVAILABLE:
            logger.warning("XGBoost not installed. Skipping ranker training.")
            return

        logger.info("Training XGBoost ranker...")
        feature_cols = [c for c in training_data.columns if c not in ["user_id", "property_id", "label"]]
        dtrain = xgb.DMatrix(training_data[feature_cols], label=training_data["label"])

        params = {
            "objective": "binary:logistic",
            "eval_metric": "auc",
            "max_depth": 6,
            "eta": 0.1,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
        }
        model = xgb.train(params, dtrain, num_boost_round=100)
        self.ranker = model
        logger.info("Ranker training complete")
        self._save_models()

    def recommend(self, request: RecommendationRequest) -> List[RecommendationResult]:
        """
        Hybrid recommendation pipeline:
        1. Candidate generation (LightFM + FAISS + popularity)
        2. Feature assembly for ranking
        3. XGBoost scoring
        4. Diversity re-ranking (MMR)
        """
        user_id = request.user_id
        n = request.n_results
        candidates = set()

        # 1a. Collaborative candidates
        if self.lightfm_model and user_id in self.user_id_map:
            collab_scores = self._lightfm_scores(user_id, top_k=100)
            candidates.update([pid for pid, _ in collab_scores])

        # 1b. Content candidates (FAISS ANN from last viewed/saved property)
        # In production: fetch user's recent interaction embedding from DB/cache
        # Here we simulate with a random property embedding if no history
        if self.faiss_index is not None and len(self.property_embeddings) > 0:
            query_vec = self._get_user_preference_vector(user_id)
            faiss.normalize_L2(query_vec)
            distances, indices = self.faiss_index.search(query_vec, 100)
            for idx in indices[0]:
                if 0 <= idx < len(self.property_ids):
                    candidates.add(self.property_ids[idx])

        # 1c. Cold-start / popularity fallback
        if len(candidates) < 50:
            # In production: query top viewed from event_metrics_daily
            popular = self.property_ids[:50]  # placeholder
            candidates.update(popular)

        candidates = list(candidates)[:500]
        if not candidates:
            return []

        # 2. Assemble ranking features
        rank_features = self._assemble_rank_features(user_id, candidates, request.context)

        # 3. Score with ranker
        if self.ranker and not rank_features.empty:
            feature_cols = [c for c in rank_features.columns if c not in ["property_id"]]
            dmatrix = xgb.DMatrix(rank_features[feature_cols])
            scores = self.ranker.predict(dmatrix)
            scored = list(zip(candidates, scores))
        else:
            # Fallback: simple heuristic score
            scored = [(pid, 0.5) for pid in candidates]

        scored.sort(key=lambda x: x[1], reverse=True)

        # 4. Diversity re-ranking (Maximal Marginal Relevance)
        final_results = self._mmr_diverse_ranking(scored, request.diversity_boost, n)

        return [
            RecommendationResult(
                property_id=pid,
                score=round(float(score), 4),
                reason=self._generate_reason(pid, user_id, request.context),
                price_trend=self._get_price_trend(pid)
            )
            for pid, score in final_results
        ]

    def _lightfm_scores(self, user_id: str, top_k: int = 100) -> List[Tuple[str, float]]:
        if not self.lightfm_model or not self.dataset:
            return []

        user_idx = self.user_id_map.get(user_id, None)
        if user_idx is None:
            return []

        n_items = len(self.item_id_map)
        scores = self.lightfm_model.predict(user_idx, np.arange(n_items))
        top_indices = np.argsort(-scores)[:top_k]
        inv_item_map = {v: k for k, v in self.item_id_map.items()}
        return [(inv_item_map.get(i, str(i)), float(scores[i])) for i in top_indices]

    def _get_user_preference_vector(self, user_id: str) -> np.ndarray:
        """Retrieve or construct user's preference embedding."""
        # In production: fetch from Redis / user embedding table
        # Fallback: mean of random subset (should be recent interactions)
        if len(self.property_embeddings) == 0:
            return np.zeros((1, 384), dtype=np.float32)
        idx = hash(user_id) % len(self.property_embeddings)
        vec = self.property_embeddings[idx:idx+1].copy()
        return vec.astype(np.float32)

    def _assemble_rank_features(self, user_id: str, candidates: List[str],
                                context: Dict) -> pd.DataFrame:
        """Build feature dataframe for XGBoost ranker."""
        rows = []
        for pid in candidates:
            # In production: query real features from PG + Redis
            row = {
                "property_id": pid,
                "cosine_sim": 0.5,  # placeholder
                "price_diff_pct": 0.0,
                "city_match": 1 if context.get("city") and "casablanca" in context.get("city").lower() else 0,
                "listing_age_days": 5,
                "user_viewed_before": 0,
                "ctr_property": 0.03,
                "freshness_boost": 1.0,
                "subscription_boost": 0.0,
            }
            rows.append(row)
        return pd.DataFrame(rows)

    def _mmr_diverse_ranking(self, scored: List[Tuple[str, float]],
                             lambda_param: float, n: int) -> List[Tuple[str, float]]:
        """Maximal Marginal Relevance for diversity."""
        if not scored or len(scored) <= n:
            return scored[:n]

        selected = [scored[0]]
        remaining = scored[1:]

        pid_to_idx = {pid: i for i, pid in enumerate(self.property_ids)}

        while len(selected) < n and remaining:
            best_mmr_score = -1
            best_item = None
            for item in remaining:
                pid, relevance = item
                # Max similarity to already selected
                max_sim = 0.0
                for sel_pid, _ in selected:
                    sim = self._embedding_similarity(pid, sel_pid, pid_to_idx)
                    max_sim = max(max_sim, sim)
                mmr = (1 - lambda_param) * relevance - lambda_param * max_sim
                if mmr > best_mmr_score:
                    best_mmr_score = mmr
                    best_item = item

            if best_item:
                selected.append(best_item)
                remaining.remove(best_item)

        return selected

    def _embedding_similarity(self, pid1: str, pid2: str, pid_to_idx: Dict) -> float:
        if self.property_embeddings.size == 0:
            return 0.0
        idx1 = pid_to_idx.get(pid1)
        idx2 = pid_to_idx.get(pid2)
        if idx1 is None or idx2 is None:
            return 0.0
        v1 = self.property_embeddings[idx1]
        v2 = self.property_embeddings[idx2]
        return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8))

    def _generate_reason(self, property_id: str, user_id: str, context: Dict) -> str:
        # In production: template-based explanation from feature contributions
        reasons = [
            "Similar to your saved favorites",
            "Popular in your area",
            "Recently listed in your budget",
            "Matching your search preferences",
            "Price dropped recently"
        ]
        idx = hash(property_id + user_id) % len(reasons)
        return reasons[idx]

    def _get_price_trend(self, property_id: str) -> Optional[str]:
        # In production: query property_price_history
        return None


# Singleton instance
_recommendation_engine: Optional[RecommendationEngine] = None


def get_recommendation_engine() -> RecommendationEngine:
    global _recommendation_engine
    if _recommendation_engine is None:
        _recommendation_engine = RecommendationEngine()
    return _recommendation_engine
