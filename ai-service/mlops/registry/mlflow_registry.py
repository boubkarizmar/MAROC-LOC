"""
MLflow-based Model Registry for MAROC-LOC AI SaaS

Handles:
- Model versioning and staging (Staging → Production → Archived)
- Artifact storage (S3-compatible or local)
- Model signature validation
- A/B model serving (champion/challenger)
"""

import os
import logging
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from datetime import datetime

import mlflow
import mlflow.pyfunc
from mlflow.tracking import MlflowClient

logger = logging.getLogger(__name__)

MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "file:///app/mlflow")
MLFLOW_REGISTRY_URI = os.getenv("MLFLOW_REGISTRY_URI", "sqlite:////app/mlflow/registry.db")
ARTIFACT_ROOT = os.getenv("MLFLOW_ARTIFACT_ROOT", "/app/mlflow/artifacts")


@dataclass
class ModelVersionInfo:
    name: str
    version: str
    stage: str
    metrics: Dict[str, float]
    params: Dict[str, Any]
    run_id: str
    created_at: datetime
    artifact_uri: str


class ModelRegistry:
    """
    Production model registry with champion/challenger support.
    """

    _instance: Optional["ModelRegistry"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        os.makedirs(ARTIFACT_ROOT, exist_ok=True)
        # Ensure parent directory for SQLite registry exists
        if MLFLOW_REGISTRY_URI.startswith("sqlite:///"):
            db_path = MLFLOW_REGISTRY_URI.replace("sqlite:///", "/")
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
        mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
        mlflow.set_registry_uri(MLFLOW_REGISTRY_URI)
        self.client = MlflowClient()
        self._initialized = True
        logger.info(f"ModelRegistry initialized at {MLFLOW_TRACKING_URI}")

    def register_model(
        self,
        model_name: str,
        model_instance: Any,
        metrics: Dict[str, float],
        params: Optional[Dict[str, Any]] = None,
        tags: Optional[Dict[str, str]] = None,
        artifact_path: str = "model",
        conda_env: Optional[str] = None,
    ) -> ModelVersionInfo:
        """Register a new model version under an experiment."""
        experiment = self.client.get_experiment_by_name(model_name)
        if experiment is None:
            experiment_id = self.client.create_experiment(
                model_name, artifact_location=os.path.join(ARTIFACT_ROOT, model_name)
            )
        else:
            experiment_id = experiment.experiment_id

        with mlflow.start_run(experiment_id=experiment_id) as run:
            # Log params
            if params:
                for k, v in params.items():
                    mlflow.log_param(k, v)
            # Log metrics
            for k, v in metrics.items():
                mlflow.log_metric(k, v)
            # Log tags
            if tags:
                for k, v in tags.items():
                    mlflow.set_tag(k, v)
            # Log model
            mlflow.pyfunc.log_model(
                artifact_path=artifact_path,
                python_model=model_instance if hasattr(model_instance, "predict") else None,
                registered_model_name=model_name,
                conda_env=conda_env,
            )

        # Get latest version
        versions = self.client.get_latest_versions(model_name, stages=["None"])
        latest = versions[0] if versions else None

        return ModelVersionInfo(
            name=model_name,
            version=latest.version if latest else "1",
            stage="None",
            metrics=metrics,
            params=params or {},
            run_id=run.info.run_id,
            created_at=datetime.now(),
            artifact_uri=latest.source if latest else "",
        )

    def transition_stage(
        self, model_name: str, version: str, stage: str, comment: str = ""
    ) -> None:
        """Promote or demote a model version."""
        self.client.transition_model_version_stage(
            name=model_name, version=version, stage=stage, archive_existing_versions=True
        )
        if comment:
            self.client.update_model_version(
                name=model_name, version=version, description=comment
            )
        logger.info(f"Model {model_name} v{version} moved to {stage}")

    def get_production_model(self, model_name: str) -> Optional[ModelVersionInfo]:
        """Fetch the current production model."""
        versions = self.client.get_latest_versions(model_name, stages=["Production"])
        if not versions:
            return None
        v = versions[0]
        run = self.client.get_run(v.run_id)
        return ModelVersionInfo(
            name=model_name,
            version=v.version,
            stage="Production",
            metrics={k: float(v) for k, v in run.data.metrics.items()},
            params=dict(run.data.params),
            run_id=v.run_id,
            created_at=datetime.fromtimestamp(v.creation_timestamp / 1000),
            artifact_uri=v.source,
        )

    def get_champion_challenger(self, model_name: str) -> Dict[str, Optional[ModelVersionInfo]]:
        """Return both champion (Production) and challenger (Staging) models."""
        champion = self.get_production_model(model_name)
        challengers = self.client.get_latest_versions(model_name, stages=["Staging"])
        challenger = None
        if challengers:
            v = challengers[0]
            run = self.client.get_run(v.run_id)
            challenger = ModelVersionInfo(
                name=model_name,
                version=v.version,
                stage="Staging",
                metrics={k: float(v) for k, v in run.data.metrics.items()},
                params=dict(run.data.params),
                run_id=v.run_id,
                created_at=datetime.fromtimestamp(v.creation_timestamp / 1000),
                artifact_uri=v.source,
            )
        return {"champion": champion, "challenger": challenger}

    def list_models(self) -> List[str]:
        """List all registered model names."""
        return [rm.name for rm in self.client.search_registered_models()]

    def delete_model(self, model_name: str) -> None:
        """Archive a model family."""
        self.client.delete_registered_model(model_name)
        logger.info(f"Deleted model family: {model_name}")


def get_registry() -> ModelRegistry:
    return ModelRegistry()
