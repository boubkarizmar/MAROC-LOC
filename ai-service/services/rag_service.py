"""
RAGPipeline — production-grade Retrieval-Augmented Generation for MAROC-LOC.

Used by /smart/chat and /rag/chat.

Pipeline:
    query
    → intent/entities (already extracted by caller)
    → dense retrieval over ChromaDB (collection `marocloc_kb`)
    → optional cross-encoder re-rank
    → optional MMR diversity
    → context injection
    → LLM generation (FLAN-T5) or deterministic fallback
    → response + source property cards
"""

import os
import re
import json
import logging
import threading
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

import numpy as np
import chromadb
from chromadb.api.types import EmbeddingFunction
from sentence_transformers import SentenceTransformer

from core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Embedding adapter for ChromaDB
# ---------------------------------------------------------------------------

class _EmbeddingAdapter(EmbeddingFunction):
    def __init__(self, model: SentenceTransformer):
        self.model = model

    def __call__(self, input: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(input, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.tolist()


# ---------------------------------------------------------------------------
# LLM lazy loader
# ---------------------------------------------------------------------------

_llm_lock = threading.Lock()
_llm_pipeline = None

try:
    from transformers import pipeline
    _TRANSFORMERS_AVAILABLE = True
except Exception:  # pragma: no cover
    _TRANSFORMERS_AVAILABLE = False


def preload_llm():
    """Pre-load the LLM in a background thread. Called at startup."""
    global _llm_pipeline
    if _llm_pipeline is not None or not _TRANSFORMERS_AVAILABLE:
        return _llm_pipeline
    with _llm_lock:
        if _llm_pipeline is None:
            try:
                logger.info(f"Pre-loading LLM for RAG: {settings.LLM_MODEL}")
                _llm_pipeline = pipeline(
                    "text2text-generation",
                    model=settings.LLM_MODEL,
                    device=0 if settings.DEVICE == "cuda" else -1,
                    max_length=settings.LLM_MAX_LENGTH,
                )
                logger.info("LLM loaded successfully.")
            except Exception as exc:
                logger.warning(f"Failed to pre-load LLM: {exc}. Responses will use fallback templates.")
                _llm_pipeline = None
    return _llm_pipeline


def _get_loaded_llm():
    """Return the LLM only if already loaded; do not trigger load on request path."""
    return _llm_pipeline if _TRANSFORMERS_AVAILABLE else None


# ---------------------------------------------------------------------------
# Text chunking utilities
# ---------------------------------------------------------------------------


def _split_text(text: str, chunk_size: int = 512, overlap: int = 64) -> List[str]:
    """Split text into overlapping chunks on sentence boundaries."""
    if not text:
        return []

    text = text.strip()
    if len(text) <= chunk_size:
        return [text]

    # Split into sentences (naive but multilingual-safe)
    sentences = re.split(r'(?<=[.!?\n])\s+', text)
    chunks = []
    current = ""
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        if len(current) + len(sentence) + 1 <= chunk_size:
            current = f"{current} {sentence}".strip() if current else sentence
        else:
            if current:
                chunks.append(current)
            current = sentence
            # Handle single sentence longer than chunk_size
            while len(current) > chunk_size:
                chunks.append(current[:chunk_size])
                current = current[chunk_size - overlap:]
    if current:
        chunks.append(current)

    # Add overlap
    if overlap > 0 and len(chunks) > 1:
        overlapped = [chunks[0]]
        for i in range(1, len(chunks)):
            prev_tail = chunks[i - 1][-overlap:]
            overlapped.append(f"{prev_tail} {chunks[i]}".strip())
        chunks = overlapped

    return chunks


# ---------------------------------------------------------------------------
# RAG Pipeline
# ---------------------------------------------------------------------------


class RAGPipeline:
    """
    Unified RAG pipeline for MAROC-LOC.
    """

    COLLECTION_NAME = "marocloc_kb"

    def __init__(self):
        self.model: Optional[SentenceTransformer] = None
        self.client: Optional[chromadb.Client] = None
        self.collection: Optional[chromadb.Collection] = None
        self.reranker = None
        self._initialized = False

    def initialize(self) -> bool:
        """Lazy init embeddings + ChromaDB. Returns True on success."""
        if self._initialized:
            return True
        try:
            logger.info(f"RAG loading embedding model: {settings.EMBEDDING_MODEL}")
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL, device=settings.DEVICE)

            chroma_path = os.path.abspath(settings.CHROMA_DB_PATH)
            os.makedirs(chroma_path, exist_ok=True)

            self.client = chromadb.PersistentClient(
                path=chroma_path,
                settings=chromadb.config.Settings(anonymized_telemetry=False),
            )

            self.collection = self.client.get_or_create_collection(
                name=self.COLLECTION_NAME,
                embedding_function=_EmbeddingAdapter(self.model),
                metadata={"hnsw:space": "cosine"},
            )

            self.reranker = None  # loaded lazily only when use_rerank=True
            self._initialized = True
            logger.info("RAGPipeline initialized successfully.")
            return True
        except Exception as exc:
            logger.error(f"RAGPipeline initialization failed: {exc}")
            return False

    def _ensure_initialized(self):
        if not self._initialized:
            self.initialize()

    # -----------------------------------------------------------------------
    # Ingestion
    # -----------------------------------------------------------------------

    def ingest_documents(self, documents: List[Dict[str, Any]]) -> int:
        """
        Chunk and upsert documents into ChromaDB.
        documents: [{"id": str, "text": str, "metadata": dict, ...}]
        Returns number of chunks indexed.
        """
        self._ensure_initialized()
        if not documents:
            return 0

        ids, texts, metadatas = [], [], []
        for doc in documents:
            base_id = str(doc.get("id", ""))
            text = doc.get("text", "")
            meta = doc.get("metadata", {}) or {}
            if not base_id or not text:
                continue

            chunks = _split_text(text, chunk_size=512, overlap=64)
            for i, chunk in enumerate(chunks):
                ids.append(f"{base_id}_chunk_{i}")
                texts.append(chunk)
                chunk_meta = dict(meta)
                chunk_meta["doc_id"] = base_id
                chunk_meta["chunk_index"] = i
                chunk_meta["total_chunks"] = len(chunks)
                metadatas.append(chunk_meta)

        if not ids:
            return 0

        try:
            self.collection.upsert(ids=ids, documents=texts, metadatas=metadatas)
            logger.info(f"RAG ingested {len(ids)} chunks from {len(documents)} documents.")
            return len(ids)
        except Exception as exc:
            logger.error(f"RAG ingestion failed: {exc}")
            return 0

    def is_collection_empty(self) -> bool:
        self._ensure_initialized()
        try:
            return self.collection.count() == 0
        except Exception:
            return True

    def count(self) -> int:
        self._ensure_initialized()
        try:
            return self.collection.count()
        except Exception:
            return 0

    # -----------------------------------------------------------------------
    # Retrieval
    # -----------------------------------------------------------------------

    def _build_where_clause(self, filters: Optional[Dict[str, Any]]) -> Optional[Dict]:
        if not filters:
            return None
        clauses = []
        for key, value in filters.items():
            if value is None:
                continue
            if key.endswith("_min"):
                actual = key.replace("_min", "")
                clauses.append({actual: {"$gte": float(value)}})
            elif key.endswith("_max"):
                actual = key.replace("_max", "")
                clauses.append({actual: {"$lte": float(value)}})
            elif isinstance(value, dict):
                # Pass through ChromaDB operators such as {"$ne": ...} or {"$in": ...}
                clauses.append({key: value})
            else:
                clauses.append({key: {"$eq": value}})
        if not clauses:
            return None
        if len(clauses) == 1:
            return clauses[0]
        return {"$and": clauses}

    def _chunk_similarity_scores(
        self,
        query: str,
        chunks: List[str],
    ) -> np.ndarray:
        """Compute cosine similarities between query and chunk texts."""
        if not chunks:
            return np.array([])
        embeddings = self.model.encode(chunks, convert_to_numpy=True, show_progress_bar=False)
        query_embedding = self.model.encode([query], convert_to_numpy=True, show_progress_bar=False)
        # normalize
        embeddings = embeddings / (np.linalg.norm(embeddings, axis=1, keepdims=True) + 1e-9)
        query_embedding = query_embedding / (np.linalg.norm(query_embedding) + 1e-9)
        return embeddings @ query_embedding[0]

    def search(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
        use_mmr: bool = False,
        use_rerank: bool = False,
        mmr_lambda: float = 0.25,
        fetch_k: int = 50,
        min_score: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks.
        If use_mmr=True, apply Maximal Marginal Relevance diversity on embeddings.
        """
        self._ensure_initialized()
        if not query or not query.strip():
            return []

        where = self._build_where_clause(filters)
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=max(fetch_k, top_k),
                where=where,
                include=["metadatas", "documents", "distances"],
            )
        except Exception as exc:
            logger.error(f"RAG vector search failed: {exc}")
            return []

        items = []
        if results and results.get("ids"):
            ids = results["ids"][0]
            docs = results["documents"][0] if results.get("documents") else []
            metas = results["metadatas"][0] if results.get("metadatas") else []
            dists = results["distances"][0] if results.get("distances") else []
            for i, doc_id in enumerate(ids):
                distance = dists[i] if i < len(dists) else 2.0
                similarity = max(0.0, 1.0 - (distance / 2.0))
                if min_score is not None and similarity < min_score:
                    continue
                items.append({
                    "id": doc_id,
                    "text": docs[i] if i < len(docs) else "",
                    "metadata": metas[i] if i < len(metas) else {},
                    "score": round(float(similarity), 4),
                })

        # Optional cross-encoder re-ranking for better ordering
        if use_rerank and items:
            if self.reranker is None:
                try:
                    from rag.rerank.cross_encoder_reranker import get_reranker
                    self.reranker = get_reranker()
                except Exception as exc:
                    logger.warning(f"Cross-encoder reranker not available: {exc}")
            if self.reranker is not None:
                try:
                    candidates = [
                        {"property_id": it["id"], "text": it["text"], "metadata": it["metadata"], "source": it["metadata"].get("source", "unknown")}
                        for it in items
                    ]
                    reranked = self.reranker.rerank(query, candidates, top_k=len(candidates))
                    score_map = {r.property_id: r.score for r in reranked}
                    for it in items:
                        if it["id"] in score_map:
                            it["score"] = round(float(score_map[it["id"]]), 4)
                    items.sort(key=lambda x: x["score"], reverse=True)
                except Exception as exc:
                    logger.warning(f"Cross-encoder reranking failed: {exc}")

        # Group by parent document so a single document does not monopolize top-k
        docs_by_id = {}
        for it in items:
            doc_id = it["metadata"].get("doc_id", it["id"])
            if doc_id not in docs_by_id or it["score"] > docs_by_id[doc_id]["score"]:
                docs_by_id[doc_id] = it

        items = sorted(docs_by_id.values(), key=lambda x: x["score"], reverse=True)

        if not use_mmr:
            return items[:top_k]

        # MMR diversity re-ranking at document level
        if len(items) <= top_k:
            return items

        texts = [it["text"] for it in items]
        sims = self._chunk_similarity_scores(query, texts)

        selected_indices = [int(np.argmax(sims))]
        remaining = set(range(len(items))) - {selected_indices[0]}

        embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        embeddings = embeddings / (np.linalg.norm(embeddings, axis=1, keepdims=True) + 1e-9)
        pair_sims = embeddings @ embeddings.T

        while len(selected_indices) < top_k and remaining:
            best_idx = -1
            best_mmr = -float("inf")
            for idx in remaining:
                max_sim_selected = max(pair_sims[idx][sel] for sel in selected_indices)
                mmr = (1 - mmr_lambda) * sims[idx] - mmr_lambda * max_sim_selected
                if mmr > best_mmr:
                    best_mmr = mmr
                    best_idx = idx
            if best_idx >= 0:
                selected_indices.append(best_idx)
                remaining.remove(best_idx)

        return [items[i] for i in selected_indices]

    # -----------------------------------------------------------------------
    # Generation
    # -----------------------------------------------------------------------

    def _build_prompt(
        self,
        query: str,
        context: str,
        lang: str,
        intent: str,
    ) -> str:
        lang_instruction = {
            "darija": "Respond in Darija (Moroccan Arabic) using Arabic script.",
            "arabic": "Respond in Modern Standard Arabic.",
            "french": "Respond in French.",
            "english": "Respond in English.",
        }.get(lang, "Respond in the same language as the user.")

        return f"""You are MAROC-LOC AI, a helpful Moroccan real estate assistant.
{lang_instruction}

User intent: {intent}

Relevant information from our database:
{context}

User question: {query}

Provide a helpful, concise, and accurate answer. Mention specific properties, prices, or procedures when relevant. Do not invent facts not present in the information above.
Answer:"""

    def _format_source_for_prompt(self, source: Dict[str, Any]) -> str:
        """Format a retrieved source for context injection."""
        meta = source.get("metadata", {})
        source_type = meta.get("source", "doc").lower()
        text = source.get("text", "").strip()
        # Keep enough text for the LLM to answer, but leave room for the prompt.
        max_text_len = 300
        if len(text) > max_text_len:
            text = text[:max_text_len].rsplit(" ", 1)[0] + "..."

        if source_type == "property":
            return (
                f"- PROPERTY: {meta.get('title', 'Annonce')} in {meta.get('city', '')} "
                f"({meta.get('type', '')} {meta.get('category', '')}) "
                f"— {meta.get('price', 0)} DH, {meta.get('surface', 0)} m², "
                f"{meta.get('bedrooms', 0)} ch. | {text}"
            )
        if source_type == "faq":
            return f"- FAQ: {meta.get('title', '')} | {text}"
        if source_type == "city":
            return f"- CITY: {meta.get('title', '')} | {text}"
        return f"- {source_type.upper()}: {meta.get('title', '')} | {text}"

    def _fallback_answer(self, query: str, lang: str, intent: str, sources: List[Dict]) -> str:
        """Deterministic fallback when LLM is unavailable or no context."""
        prop_titles = [
            s["metadata"].get("title", s["metadata"].get("doc_id", ""))
            for s in sources[:3]
            if s.get("metadata", {}).get("source") == "property"
        ]
        if lang in ["french", "fr"]:
            if prop_titles:
                return f"J'ai trouvé des biens pertinents : {', '.join(prop_titles)}. Souhaitez-vous plus de détails ?"
            return "Je peux vous aider à trouver un bien au Maroc. Précisez ville, budget et type."
        if lang in ["arabic", "ar"]:
            if prop_titles:
                return f"وجدت عقارات مناسبة: {', '.join(prop_titles)}. هل تريد المزيد من التفاصيل؟"
            return "يمكنني مساعدتك في العثور على عقار في المغرب. حدد المدينة والميزانية والنوع."
        if lang in ["darija", "dar"]:
            if prop_titles:
                return f"لقيت شي عقارات: {', '.join(prop_titles)}. بغيتي تفاصيل أكثر؟"
            return "نقدر نعاونك تلقى عقار فالمغرب. قوليا المدينة والبودجيت والنوع."
        if prop_titles:
            return f"I found relevant listings: {', '.join(prop_titles)}. Would you like more details?"
        return "I can help you find a property in Morocco. Please specify city, budget, and type."

    def generate(
        self,
        query: str,
        sources: List[Dict[str, Any]],
        lang: str,
        intent: str,
    ) -> str:
        """Generate a grounded answer. Falls back to template if LLM fails."""
        if not sources:
            return self._fallback_answer(query, lang, intent, [])

        context = "\n\n".join(
            self._format_source_for_prompt(s)
            for s in sources[:3]
        )

        llm = _get_loaded_llm()
        if llm is None:
            return self._fallback_answer(query, lang, intent, sources)

        prompt = self._build_prompt(query, context, lang, intent)
        try:
            output = llm(
                prompt,
                max_length=256,
                do_sample=False,
                truncation=True,
            )
            text = output[0]["generated_text"] if output else ""
            text = text.strip()
            if text:
                return text
        except Exception as exc:
            logger.warning(f"RAG LLM generation failed: {exc}")

        return self._fallback_answer(query, lang, intent, sources)

    # -----------------------------------------------------------------------
    # High-level answer
    # -----------------------------------------------------------------------

    def answer(
        self,
        query: str,
        lang: str = "french",
        intent: str = "SEARCH",
        entities: Optional[Dict[str, Any]] = None,
        use_mmr: bool = True,
        top_k: int = 5,
    ) -> Dict[str, Any]:
        """
        End-to-end RAG answer.
        Returns {"response": str, "sources": [...], "properties": [...]}.
        """
        self._ensure_initialized()
        entities = entities or {}

        # For knowledge/support intents, focus on FAQ/city/process docs instead of property ads.
        knowledge_intents = {"SUPPORT", "GENERAL", "NEIGHBORHOOD_INFO"}

        if intent in knowledge_intents:
            filters = {"source": {"$ne": "property"}}
        else:
            filters = {}
            if entities.get("city"):
                filters["city"] = entities["city"]
            if entities.get("property_type"):
                filters["category"] = entities["property_type"].upper()
            if entities.get("transaction_type"):
                filters["type"] = entities["transaction_type"].upper()
            if entities.get("max_price"):
                filters["price_max"] = float(entities["max_price"])
            if entities.get("min_price"):
                filters["price_min"] = float(entities["min_price"])
            if entities.get("bedrooms"):
                filters["bedrooms"] = int(entities["bedrooms"])

        sources = self.search(
            query=query,
            top_k=top_k,
            filters=filters if filters else None,
            use_mmr=use_mmr,
            fetch_k=max(top_k * 8, 50),
            min_score=settings.MIN_VECTOR_SCORE,
        )

        response_text = self.generate(query, sources, lang, intent)

        # Extract property cards from sources
        properties = []
        seen_ids = set()
        for s in sources:
            meta = s.get("metadata", {})
            if meta.get("source") != "property":
                continue
            pid = str(meta.get("property_id") or meta.get("doc_id", ""))
            if not pid or pid in seen_ids:
                continue
            seen_ids.add(pid)
            properties.append({
                "id": pid,
                "title": meta.get("title", "Propriété"),
                "city": meta.get("city", ""),
                "category": meta.get("category", ""),
                "type": meta.get("type", ""),
                "price": float(meta.get("price", 0) or 0),
                "surface": float(meta.get("surface", 0) or 0),
                "bedrooms": int(meta.get("bedrooms", 0) or 0),
                "is_verified": bool(meta.get("is_verified", False)),
            })

        return {
            "response": response_text,
            "sources": sources,
            "properties": properties,
        }


# Singleton
_rag_pipeline: Optional[RAGPipeline] = None
_rag_lock = threading.Lock()


def get_rag_pipeline() -> RAGPipeline:
    global _rag_pipeline
    if _rag_pipeline is None:
        with _rag_lock:
            if _rag_pipeline is None:
                _rag_pipeline = RAGPipeline()
    return _rag_pipeline
