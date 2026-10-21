import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from prometheus_fastapi_instrumentator import Instrumentator
from core.limiter import limiter
from api.routes import chat, search, voice, sentiment
from routers import recommendations, fraud, kaggle, mlops, ltv, rag_chat, owner_assistant, smart_chat, analytics
from core.config import settings
from services.rag_service import get_rag_pipeline, preload_llm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI backend for MAROC-LOC real estate platform. "
                "Supports Darija, Arabic, French, and English.",
    version="2.0.0-ai-saas"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Prometheus metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(chat.router)
app.include_router(search.router)
app.include_router(voice.router)
app.include_router(sentiment.router)
app.include_router(recommendations.router)
app.include_router(fraud.router)
app.include_router(kaggle.router)
app.include_router(mlops.router)
app.include_router(ltv.router)
app.include_router(rag_chat.router)
app.include_router(owner_assistant.router)
app.include_router(smart_chat.router)
app.include_router(analytics.router)

# Redirect legacy API paths to smart chat
@app.post("/v1/ai/chat")
async def redirect_v1_ai_chat(request: Request):
    return RedirectResponse(url="/smart/chat", status_code=307)

@app.post("/chat")
async def redirect_legacy_chat(request: Request):
    return RedirectResponse(url="/smart/chat", status_code=307)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "2.0.0-ai-saas",
        "features": ["chat", "search", "voice", "sentiment", "recommendations", "fraud", "kaggle", "mlops", "ltv", "rag", "tts", "analytics"]
    }

# Thread pool for blocking ML operations
executor = ThreadPoolExecutor(max_workers=2)

@app.on_event("startup")
async def startup_event():
    logger.info(f"🚀 {settings.APP_NAME} started on {settings.DEVICE.upper()}")

    # Pre-load heavy ML models in background to avoid blocking first request
    loop = asyncio.get_event_loop()

    def _preload_models():
        try:
            logger.info("Pre-loading embedding model...")
            from rag.retrieval.vector_retriever import get_vector_retriever
            get_vector_retriever()
            logger.info("Embedding model loaded successfully.")
        except Exception as e:
            logger.warning(f"Model pre-loading skipped or failed: {e}")

        # Build RAG knowledge base if ChromaDB collection is empty
        try:
            logger.info("Checking RAG knowledge base...")
            rag = get_rag_pipeline()
            if rag.initialize() and rag.is_collection_empty():
                logger.info("RAG knowledge base empty; building from PostgreSQL...")
                from scripts.build_rag_knowledge_base import main as build_kb
                build_kb()
            else:
                logger.info(f"RAG knowledge base ready with {rag.count()} chunks.")

            # Pre-load LLM in background so RAG generation is ready without blocking requests
            try:
                preload_llm()
            except Exception as e:
                logger.warning(f"LLM pre-loading skipped: {e}")
        except Exception as e:
            logger.warning(f"RAG knowledge base sync skipped or failed: {e}")

    # Run pre-loading in background thread
    loop.run_in_executor(executor, _preload_models)
