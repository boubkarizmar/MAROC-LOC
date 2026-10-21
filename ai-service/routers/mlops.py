"""
MLOps API endpoints for model management.
"""

from typing import List, Dict, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel

from core.limiter import limiter
from mlops.registry.mlflow_registry import get_registry
from mlops.orchestrator.retrain_pipeline import get_orchestrator

router = APIRouter(prefix="/mlops", tags=["mlops"])


class ModelInfoResponse(BaseModel):
    name: str
    version: str
    stage: str
    metrics: Dict[str, float]
    run_id: str
    artifact_uri: str


class RetrainRequest(BaseModel):
    model_name: Optional[str] = None  # None = all models
    force: bool = False


class StageTransitionRequest(BaseModel):
    model_name: str
    version: str
    stage: str  # Staging, Production, Archived
    comment: str = ""


@router.get("/models", response_model=List[str])
async def list_models():
    return get_registry().list_models()


@router.get("/models/{model_name}/production", response_model=Optional[ModelInfoResponse])
async def get_production_model(model_name: str):
    info = get_registry().get_production_model(model_name)
    if info is None:
        raise HTTPException(status_code=404, detail="No production model found")
    return ModelInfoResponse(
        name=info.name,
        version=info.version,
        stage=info.stage,
        metrics=info.metrics,
        run_id=info.run_id,
        artifact_uri=info.artifact_uri,
    )


@router.get("/models/{model_name}/champion-challenger")
async def get_champion_challenger(model_name: str):
    result = get_registry().get_champion_challenger(model_name)
    return {
        "champion": result["champion"].__dict__ if result["champion"] else None,
        "challenger": result["challenger"].__dict__ if result["challenger"] else None,
    }


@router.post("/retrain")
@limiter.limit("3/minute")
async def trigger_retrain(request: Request, retrain_request: RetrainRequest, background_tasks: BackgroundTasks):
    orchestrator = get_orchestrator()
    if retrain_request.model_name:
        fn = orchestrator.models.get(retrain_request.model_name)
        if not fn:
            raise HTTPException(status_code=404, detail="Unknown model")
        background_tasks.add_task(
            orchestrator.run_single, retrain_request.model_name, fn, retrain_request.force
        )
        return {"status": "started", "model": retrain_request.model_name}
    else:
        background_tasks.add_task(orchestrator.run_all, retrain_request.force)
        return {"status": "started", "model": "all"}


@router.post("/transition")
@limiter.limit("10/minute")
async def transition_stage(request: Request, stage_request: StageTransitionRequest):
    get_registry().transition_stage(
        stage_request.model_name, stage_request.version, stage_request.stage, stage_request.comment
    )
    return {"status": "success", "model": stage_request.model_name, "stage": stage_request.stage}


@router.get("/health")
async def mlops_health():
    registry = get_registry()
    models = registry.list_models()
    return {
        "status": "healthy",
        "registered_models": models,
        "tracking_uri": registry.client.tracking_uri,
    }
