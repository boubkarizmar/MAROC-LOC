"""
Cross-Encoder Re-ranker for RAG

Improves retrieval quality by performing full attention over
query-document pairs. Much more accurate than bi-encoder similarity
but slower — used only on top-K candidates.

Models:
- cross-encoder/ms-marco-MiniLM-L-6-v2 (default, fast)
- cross-encoder/ms-marco-MiniLM-L-12-v2 (better quality)
"""

import os
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass

import numpy as np

from sentence_transformers import CrossEncoder

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"


@dataclass
class RerankResult:
    property_id: str
    score: float
    text: str
    metadata: Dict
    source: str


class CrossEncoderReranker:
    """
    Production cross-encoder for final re-ranking of retrieved candidates.
    Target latency: <50ms for top-20 candidates on CPU.
    """

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or DEFAULT_MODEL
        logger.info(f"Loading cross-encoder: {self.model_name}")
        self.model = CrossEncoder(self.model_name, max_length=512)

    def rerank(
        self,
        query: str,
        candidates: List[Dict],
        top_k: int = 5,
        batch_size: int = 8
    ) -> List[RerankResult]:
        """
        Re-rank candidates using cross-encoder.
        candidates: [{"property_id": str, "text": str, "metadata": dict, "source": str}]
        """
        if not candidates:
            return []

        pairs = [(query, c["text"]) for c in candidates]
        scores = self.model.predict(pairs, batch_size=batch_size, show_progress_bar=False)

        scored = []
        for candidate, score in zip(candidates, scores):
            scored.append(RerankResult(
                property_id=candidate["property_id"],
                score=float(score),
                text=candidate["text"],
                metadata=candidate.get("metadata", {}),
                source=candidate.get("source", "unknown"),
            ))

        scored.sort(key=lambda x: x.score, reverse=True)
        return scored[:top_k]

    def rerank_with_diversity(
        self,
        query: str,
        candidates: List[Dict],
        top_k: int = 5,
        diversity_weight: float = 0.3
    ) -> List[RerankResult]:
        """
        Re-rank with MMR-style diversity boost to avoid similar listings.
        """
        reranked = self.rerank(query, candidates, top_k=len(candidates))
        if not reranked:
            return []

        selected = [reranked[0]]
        remaining = reranked[1:]

        while len(selected) < top_k and remaining:
            best_score = -1
            best_item = None
            for item in remaining:
                # Diversity penalty: max similarity to already selected
                max_sim = 0.0
                for sel in selected:
                    sim = self._text_similarity(item.text, sel.text)
                    max_sim = max(max_sim, sim)

                mmr = (1 - diversity_weight) * item.score - diversity_weight * max_sim
                if mmr > best_score:
                    best_score = mmr
                    best_item = item

            if best_item:
                selected.append(best_item)
                remaining.remove(best_item)

        return selected

    def _text_similarity(self, a: str, b: str) -> float:
        """Jaccard similarity for quick diversity estimation."""
        set_a = set(a.lower().split())
        set_b = set(b.lower().split())
        if not set_a or not set_b:
            return 0.0
        intersection = len(set_a & set_b)
        union = len(set_a | set_b)
        return intersection / union if union > 0 else 0.0


_reranker: Optional[CrossEncoderReranker] = None


def get_reranker() -> CrossEncoderReranker:
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoderReranker()
    return _reranker
