from fastapi import APIRouter, HTTPException, Request
from core.limiter import limiter
from schemas.models import SearchRequest, SearchResponse
from services.vector_store import vector_store
from services.nlp_engine import nlp_engine
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/search", response_model=SearchResponse)
@limiter.limit("30/minute")
async def search_endpoint(request: Request, search_request: SearchRequest):
    try:
        query = nlp_engine.preprocess_query(search_request.query)
        filters = {
            "city": nlp_engine.extract_city(search_request.query),
            "transaction_type": nlp_engine.extract_transaction_type(search_request.query),
            "property_type": nlp_engine.extract_property_type(search_request.query),
            "amenities": nlp_engine.extract_amenities(search_request.query),
            "bedrooms": nlp_engine.extract_quantity(search_request.query),
        }
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}

        if search_request.filters:
            filters.update(search_request.filters)

        results = vector_store.search(
            query=query,
            top_k=search_request.top_k,
            filters=filters if filters else None
        )

        return SearchResponse(results=results, total=len(results))
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
