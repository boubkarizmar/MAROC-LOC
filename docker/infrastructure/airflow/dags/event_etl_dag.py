"""
Airflow DAG for Event ETL: PostgreSQL → ClickHouse

Runs hourly to sync event data for analytics dashboards.
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.clickhouse.hooks.clickhouse import ClickHouseHook
from airflow.operators.python import PythonOperator

def sync_events_to_clickhouse():
    pg = PostgresHook(postgres_conn_id="marocloc_postgres")
    ch = ClickHouseHook(clickhouse_conn_id="marocloc_clickhouse")

    # Extract last hour of events from PostgreSQL
    sql = """
        SELECT event_id, event_type, event_version, user_id, session_id,
               device_fingerprint, ip_address::text, user_agent, device_type,
               os, browser, country, city, payload,
               client_timestamp, server_timestamp, source, processed::int
        FROM event_log
        WHERE server_timestamp >= NOW() - INTERVAL '1 hour'
          AND server_timestamp < NOW()
    """
    records = pg.get_records(sql)

    if not records:
        return 0

    # Insert into ClickHouse
    ch.execute("""
        INSERT INTO events (
            event_id, event_type, event_version, user_id, session_id,
            device_fingerprint, ip_address, user_agent, device_type,
            os, browser, country, city, payload,
            client_timestamp, server_timestamp, source, processed
        ) VALUES
    """, records)

    return len(records)

def sync_revenue_to_clickhouse():
    pg = PostgresHook(postgres_conn_id="marocloc_postgres")
    ch = ClickHouseHook(clickhouse_conn_id="marocloc_clickhouse")

    sql = """
        SELECT
            CURRENT_DATE as event_date,
            tier,
            COUNT(*) FILTER (WHERE status = 'ACTIVE' AND created_at >= CURRENT_DATE) as new_subs,
            COUNT(*) FILTER (WHERE status = 'CANCELLED' AND updated_at >= CURRENT_DATE) as churned_subs,
            COALESCE(SUM(amount), 0) as total_revenue,
            COALESCE(SUM(mrr_contribution), 0) as mrr
        FROM user_subscription
        WHERE created_at >= CURRENT_DATE OR updated_at >= CURRENT_DATE
        GROUP BY tier
    """
    records = pg.get_records(sql)

    if records:
        ch.execute("""
            INSERT INTO revenue_daily (
                event_date, tier, new_subscriptions,
                churned_subscriptions, total_revenue, mrr_contribution
            ) VALUES
        """, records)

    return len(records) if records else 0

with DAG(
    "marocloc_event_etl",
    default_args={
        "owner": "analytics",
        "depends_on_past": False,
        "retries": 3,
        "retry_delay": timedelta(minutes=5),
    },
    description="Hourly ETL from PostgreSQL to ClickHouse",
    schedule_interval="@hourly",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["etl", "analytics", "clickhouse"],
) as dag:

    sync_events = PythonOperator(
        task_id="sync_events",
        python_callable=sync_events_to_clickhouse,
    )

    sync_revenue = PythonOperator(
        task_id="sync_revenue",
        python_callable=sync_revenue_to_clickhouse,
    )

    sync_events >> sync_revenue
