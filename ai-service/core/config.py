from pydantic_settings import BaseSettings
from typing import List, Optional
import torch


class Settings(BaseSettings):
    APP_NAME: str = "MAROC-LOC AI Service"
    DEBUG: bool = False

    # CORS — production-safe defaults, override via env
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8080",
        "http://192.168.11.107:3000",
        "http://192.168.11.107:8080",
        "http://192.168.11.107:8000",
    ]

    # Database and session storage
    DATABASE_URL: Optional[str] = None
    SESSION_DB_URL: str = "sqlite:///./data/ai_sessions.db"
    SESSION_TTL_HOURS: int = 24

    # ChromaDB
    CHROMA_DB_PATH: str = "./chroma_db"
    CHROMA_COLLECTION_NAME: str = "properties"

    # Embeddings - Multilingual for Darija/Arabic/French/English
    EMBEDDING_MODEL: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

    # LLM
    LLM_MODEL: str = "google/flan-t5-base"
    LLM_MAX_LENGTH: int = 512

    # Whisper (Hugging Face)
    WHISPER_MODEL: str = "openai/whisper-base"

    # RAG
    RAG_TOP_K: int = 5
    RAG_SYNC_LIMIT: int = 10000
    MIN_VECTOR_SCORE: float = 0.15

    # Hardware
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"

    # Rate limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
