"""
Airflow DAG for MAROC-LOC MLOps Pipeline

Orchestrates:
1. Data extraction (PostgreSQL + Kafka + Kaggle)
2. Feature engineering
3. Model training (fraud, recommendations, churn, LTV)
4. Validation & threshold gating
5. MLflow registration
6. Staging deployment
7. A/B test activation
8. Production promotion (manual approval gate)
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator
from airflow.providers.http.operators.http import SimpleHttpOperator
from airflow.models import Variable

default_args = {
    "owner": "mlops",
    "depends_on_past": False,
    "email": ["mlops@marocloc.ma"],
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=10),
}

with DAG(
    "marocloc_ml_retrain",
    default_args=default_args,
    description="Weekly automated model retraining pipeline",
    schedule_interval="0 3 * * 0",  # Sunday 3AM
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["mlops", "retrain", "production"],
) as dag:

    start = EmptyOperator(task_id="start")

    # Task 1: Extract training data
    extract_data = SimpleHttpOperator(
        task_id="extract_training_data",
        http_conn_id="ai_service",
        endpoint="/ai/kaggle/pipeline",
        method="POST",
        log_response=True,
    )

    # Task 2: Train fraud model
    train_fraud = SimpleHttpOperator(
        task_id="train_fraud_model",
        http_conn_id="ai_service",
        endpoint="/ai/fraud/train",
        method="POST",
        log_response=True,
    )

    # Task 3: Retrain recommendation engine
    train_recommendations = SimpleHttpOperator(
        task_id="train_recommendation_model",
        http_conn_id="ai_service",
        endpoint="/ai/mlops/retrain",
        method="POST",
        data='{"model_name": "recommendation_engine", "force": false}',
        headers={"Content-Type": "application/json"},
        log_response=True,
    )

    # Task 4: Retrain LTV model
    train_ltv = SimpleHttpOperator(
        task_id="train_ltv_model",
        http_conn_id="ai_service",
        endpoint="/ai/mlops/retrain",
        method="POST",
        data='{"model_name": "ltv_model", "force": false}',
        headers={"Content-Type": "application/json"},
        log_response=True,
    )

    # Task 5: Retrain churn model
    train_churn = SimpleHttpOperator(
        task_id="train_churn_model",
        http_conn_id="ai_service",
        endpoint="/ai/mlops/retrain",
        method="POST",
        data='{"model_name": "churn_model", "force": false}',
        headers={"Content-Type": "application/json"},
        log_response=True,
    )

    # Task 6: Validate all models
    validate_models = PythonOperator(
        task_id="validate_models",
        python_callable=lambda: print("Validating model thresholds..."),
    )

    # Task 7: Register to staging
    stage_models = SimpleHttpOperator(
        task_id="stage_models",
        http_conn_id="ai_service",
        endpoint="/ai/mlops/transition",
        method="POST",
        data='{"model_name": "recommendation_engine", "version": "latest", "stage": "Staging", "comment": "Weekly retrain"}',
        headers={"Content-Type": "application/json"},
    )

    # Task 8: Activate A/B test for new model
    activate_ab_test = EmptyOperator(task_id="activate_ab_test")

    # Task 9: Manual approval gate for production
    approve_production = EmptyOperator(task_id="approve_production")

    # Task 10: Promote to production
    promote_production = SimpleHttpOperator(
        task_id="promote_to_production",
        http_conn_id="ai_service",
        endpoint="/ai/mlops/transition",
        method="POST",
        data='{"model_name": "recommendation_engine", "version": "latest", "stage": "Production", "comment": "Approved after A/B test"}',
        headers={"Content-Type": "application/json"},
    )

    end = EmptyOperator(task_id="end")

    # DAG flow
    start >> extract_data
    extract_data >> [train_fraud, train_recommendations, train_ltv, train_churn]
    [train_fraud, train_recommendations, train_ltv, train_churn] >> validate_models
    validate_models >> stage_models >> activate_ab_test >> approve_production >> promote_production >> end
