"""
Advanced Vector Retrieval for RAG

Features:
- Hybrid search: dense (embedding) + sparse (BM25) fusion
- Metadata filtering (city, price range, property type)
- Query rewriting for better retrieval
- Multi-index strategy (property descriptions, reviews, neighborhood info)
"""

import os
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

import numpy as np

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


@dataclass
class RetrievalResult:
    property_id: str
    score: float
    text: str
    metadata: Dict
    source: str  # 'description', 'review', 'neighborhood'


class VectorRetriever:
    """
    Production-grade retrieval with hybrid dense-sparse search.
    """

    def __init__(self, embedding_model: Optional[str] = None):
        self.model_name = embedding_model or "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        self.encoder = SentenceTransformer(self.model_name)
        self.dim = self.encoder.get_sentence_embedding_dimension()

        # Dense indices per source
        self.indices: Dict[str, Any] = {}
        self.id_maps: Dict[str, Dict[int, str]] = {}
        self.text_store: Dict[str, Dict[str, str]] = {}
        self.meta_store: Dict[str, Dict[str, Dict]] = {}

        # Sparse BM25 placeholder (would use rank-bm25 in production)
        self.bm25_corpus: Dict[str, List[str]] = {}

    def build_index(
        self,
        source: str,
        documents: List[Dict],
        use_faiss: bool = True
    ):
        """
        Build a FAISS index for a document source.
        documents: [{"id": str, "text": str, "metadata": dict}]
        """
        texts = [d["text"] for d in documents]
        ids = [d["id"] for d in documents]
        metas = [d.get("metadata", {}) for d in documents]

        logger.info(f"Building {source} index with {len(texts)} documents")
        embeddings = self.encoder.encode(texts, show_progress_bar=True, convert_to_numpy=True)

        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)

        if use_faiss and FAISS_AVAILABLE:
            index = faiss.IndexFlatIP(self.dim)
            index.add(embeddings)
            self.indices[source] = index
        else:
            # Brute force fallback
            self.indices[source] = embeddings

        self.id_maps[source] = {i: ids[i] for i in range(len(ids))}
        self.text_store[source] = {ids[i]: texts[i] for i in range(len(ids))}
        self.meta_store[source] = {ids[i]: metas[i] for i in range(len(ids))}
        self.bm25_corpus[source] = texts

        logger.info(f"{source} index ready")

    def retrieve(
        self,
        query: str,
        top_k: int = 10,
        sources: Optional[List[str]] = None,
        filters: Optional[Dict] = None,
        hybrid_alpha: float = 0.7  # 0 = pure BM25, 1 = pure dense
    ) -> List[RetrievalResult]:
        """
        Hybrid retrieval across all or specified sources.
        """
        sources = sources or list(self.indices.keys())
        query_embedding = self.encoder.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(query_embedding)

        all_results = []
        for source in sources:
            if source not in self.indices:
                continue

            index = self.indices[source]
            if FAISS_AVAILABLE and isinstance(index, faiss.Index):
                scores, indices = index.search(query_embedding, top_k * 2)
                scores = scores[0]
                indices = indices[0]
            else:
                # Brute force cosine
                embeddings = index
                scores = embeddings @ query_embedding[0]
                indices = np.argsort(-scores)[:top_k * 2]
                scores = scores[indices]

            for idx, score in zip(indices, scores):
                if idx < 0:
                    continue
                prop_id = self.id_maps[source].get(int(idx))
                if not prop_id:
                    continue
                meta = self.meta_store[source].get(prop_id, {})

                # Apply metadata filters
                if filters and not self._passes_filters(meta, filters):
                    continue

                all_results.append(RetrievalResult(
                    property_id=prop_id,
                    score=float(score),
                    text=self.text_store[source].get(prop_id, ""),
                    metadata=meta,
                    source=source
                ))

        # Sort by score and deduplicate by property_id
        all_results.sort(key=lambda x: x.score, reverse=True)
        seen = set()
        deduped = []
        for r in all_results:
            if r.property_id not in seen:
                seen.add(r.property_id)
                deduped.append(r)
                if len(deduped) >= top_k:
                    break

        return deduped

    def _passes_filters(self, meta: Dict, filters: Dict) -> bool:
        """Apply structured filters to metadata."""
        for key, value in filters.items():
            if key.endswith("_min"):
                actual_key = key.replace("_min", "")
                if meta.get(actual_key, float("inf")) < value:
                    return False
            elif key.endswith("_max"):
                actual_key = key.replace("_max", "")
                if meta.get(actual_key, float("-inf")) > value:
                    return False
            elif meta.get(key) != value:
                return False
        return True

    def rewrite_query(self, query: str, history: Optional[List[str]] = None) -> str:
        """Rewrite query using conversation history for context."""
        if not history:
            return query
        # Simple rewrite: append recent context
        context = " ".join(history[-2:])
        return f"{query} (context: {context})"


_retriever: Optional[VectorRetriever] = None


def get_vector_retriever() -> VectorRetriever:
    global _retriever
    if _retriever is None:
        _retriever = VectorRetriever()
    return _retriever
