"""
FastAPI router for Kaggle dataset management and training pipeline.
"""

from typing import Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel, Field

from core.limiter import limiter
from services.kaggle_pipeline import get_kaggle_pipeline, RECOMMENDED_DATASETS

router = APIRouter(prefix="/kaggle", tags=["kaggle"])


class PipelineRequest(BaseModel):
    force_download: bool = False
    datasets: Optional[list] = None


@router.post("/pipeline")
@limiter.limit("3/minute")
async def run_pipeline(request: Request, pipeline_request: PipelineRequest, background_tasks: BackgroundTasks):
    """Run Kaggle data ingestion pipeline."""
    pipeline = get_kaggle_pipeline()
    results = pipeline.run_full_pipeline()
    return {"status": "completed", "results": results}


@router.get("/datasets")
async def list_datasets():
    """List recommended Kaggle datasets."""
    return [
        {
            "name": d.name,
            "kaggle_ref": d.kaggle_ref,
            "purpose": d.purpose,
            "refresh_days": d.refresh_days
        } for d in RECOMMENDED_DATASETS
    ]


@router.post("/synthetic-fraud")
@limiter.limit("5/minute")
async def generate_synthetic_fraud(request: Request, n_legit: int = 5000, n_fraud: int = 500):
    """Generate synthetic fraud training data."""
    pipeline = get_kaggle_pipeline()
    df = pipeline.generate_synthetic_fraud_labels(n_legit=n_legit, n_fraud=n_fraud)
    out_path = f"/tmp/synthetic_fraud_{len(df)}.parquet"
    df.to_parquet(out_path, index=False)
    return {
        "status": "generated",
        "total_rows": len(df),
        "fraud_ratio": df["label"].mean(),
        "output_path": out_path
    }
