import logging
import os
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.api.types import EmbeddingFunction
from sentence_transformers import SentenceTransformer

from core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingFunctionAdapter(EmbeddingFunction):
    """Adapter to make SentenceTransformer compatible with ChromaDB's EmbeddingFunction interface."""

    def __init__(self, model: SentenceTransformer):
        self.model = model

    def __call__(self, input: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(input, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.tolist()


class VectorStore:
    """
    ChromaDB-based vector store for property semantic search.
    Uses sentence-transformers for multilingual embeddings.
    """

    def __init__(self):
        self.model: Optional[SentenceTransformer] = None
        self.client: Optional[chromadb.Client] = None
        self.collection: Optional[chromadb.Collection] = None
        self._initialized = False

    def initialize(self):
        """Lazy initialization of model and ChromaDB client."""
        if self._initialized:
            return

        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL, device=settings.DEVICE)

        embedding_fn = EmbeddingFunctionAdapter(self.model)

        chroma_path = os.path.abspath(settings.CHROMA_DB_PATH)
        os.makedirs(chroma_path, exist_ok=True)

        self.client = chromadb.PersistentClient(
            path=chroma_path,
            settings=chromadb.config.Settings(anonymized_telemetry=False),
        )

        self.collection = self.client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            embedding_function=embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

        self._initialized = True
        logger.info("VectorStore initialized successfully.")

    def _ensure_initialized(self):
        if not self._initialized:
            self.initialize()

    def add_properties(self, properties: List[Dict[str, Any]]) -> bool:
        """Add or update properties in the vector store."""
        self._ensure_initialized()
        if not properties:
            return True

        ids = []
        documents = []
        metadatas = []

        for prop in properties:
            prop_id = str(prop.get("id", ""))
            if not prop_id:
                continue

            # Build searchable text from property fields
            text_parts = [
                prop.get("title", ""),
                prop.get("description", ""),
                prop.get("city", ""),
                prop.get("category", ""),
                prop.get("type", ""),
                f"{prop.get('surface', '')} m²",
                f"{prop.get('rooms', '')} rooms",
                f"{prop.get('bedrooms', '')} bedrooms",
            ]
            document = " | ".join(filter(None, text_parts))

            ids.append(prop_id)
            documents.append(document)
            metadatas.append({
                "id": prop_id,
                "title": prop.get("title", ""),
                "city": prop.get("city", ""),
                "price": float(prop.get("price", 0)),
                "category": prop.get("category", ""),
                "type": prop.get("type", ""),
                "surface": float(prop.get("surface", 0) or 0),
                "rooms": int(prop.get("rooms", 0) or 0),
                "bedrooms": int(prop.get("bedrooms", 0) or 0),
                "status": prop.get("status", ""),
            })

        try:
            self.collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
            logger.info(f"Upserted {len(ids)} properties into vector store.")
            return True
        except Exception as e:
            logger.error(f"Failed to upsert properties: {e}")
            return False

    def search(
        self,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        min_score: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Semantic search over properties with optional metadata filters."""
        self._ensure_initialized()

        where_clause = self._build_where_clause(filters) if filters else None
        n_results = max(top_k * 3, 20)  # Fetch extra for filtering

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_clause,
                include=["metadatas", "documents", "distances"],
            )
        except Exception as e:
            logger.error(f"Vector search query failed: {e}")
            return []

        output = []
        if results and results.get("ids"):
            ids_list = results["ids"][0]
            metadatas_list = results["metadatas"][0] if results.get("metadatas") else []
            distances_list = results["distances"][0] if results.get("distances") else []

            for i, doc_id in enumerate(ids_list):
                metadata = metadatas_list[i] if i < len(metadatas_list) else {}
                distance = distances_list[i] if i < len(distances_list) else 1.0
                # ChromaDB cosine distance: 0 = identical, 2 = opposite
                # Convert to similarity score (0-1)
                similarity = max(0.0, 1.0 - (distance / 2.0))

                if min_score is not None and similarity < min_score:
                    continue

                output.append({
                    "id": doc_id,
                    "metadata": metadata,
                    "score": round(similarity, 4),
                })

        # Sort by score descending and limit
        output.sort(key=lambda x: x["score"], reverse=True)
        return output[:top_k]

    def delete_property(self, property_id: str) -> bool:
        """Remove a property from the vector store."""
        self._ensure_initialized()
        try:
            self.collection.delete(ids=[str(property_id)])
            return True
        except Exception as e:
            logger.error(f"Failed to delete property {property_id}: {e}")
            return False

    def search_by_city(self, city: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Search for properties in a specific city."""
        return self.search(
            query=city,
            top_k=top_k,
            filters={"city": city},
        )

    def get_all_cities(self) -> List[str]:
        """Retrieve all distinct cities from the vector store metadata."""
        self._ensure_initialized()
        try:
            results = self.collection.get(include=["metadatas"])
            cities = set()
            for metadata in results.get("metadatas", []):
                if metadata and metadata.get("city"):
                    cities.add(metadata.get("city"))
            return sorted(list(cities))
        except Exception as e:
            logger.error(f"Error getting cities: {e}")
            return []

    def _build_where_clause(self, filters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Build ChromaDB where clause from filter dict."""
        conditions = {}
        for key, value in filters.items():
            if value is None:
                continue
            if key in ("price_min", "price_max"):
                continue  # Handle numeric ranges separately if needed
            if key == "city" and isinstance(value, str):
                conditions["city"] = {"$eq": value}
            elif key == "category" and isinstance(value, str):
                conditions["category"] = {"$eq": value}
            elif key == "type" and isinstance(value, str):
                conditions["type"] = {"$eq": value}
            elif key == "status" and isinstance(value, str):
                conditions["status"] = {"$eq": value}
        return conditions if conditions else None


# Global singleton instance
vector_store = VectorStore()
