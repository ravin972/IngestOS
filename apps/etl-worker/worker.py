"""IngestOS Celery Worker for Asynchronous Background Ingestion.

Broker: Redis 7
Engine: Polars AST Validation
Invariants: Zero-Retention RAM Processing & 60-Minute Ephemeral DLQ
"""

import os
from celery import Celery
from validator import execute_validation_pipeline

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "ingestos_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(name="tasks.validate_dataset")
def validate_dataset_task(file_bytes_base64: str, rules_json: dict | None = None) -> dict:
    """Asynchronous Celery task for dataset validation."""
    import base64
    raw_bytes = base64.b64decode(file_bytes_base64)
    result = execute_validation_pipeline(raw_bytes, rules_json)
    return {
        "total_rows": result.total_rows,
        "valid_rows_count": result.valid_rows_count,
        "quarantined_rows_count": result.quarantined_rows_count,
        "quarantine_records": result.quarantine_records,
        "parse_time_ms": result.parse_time_ms,
    }
