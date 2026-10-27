"""IngestOS FastAPI Core Application.

Zero-Retention RAM Architecture with Deterministic AST Validation.
Phase 4: Presets, Heuristic Auto-Fix, Multi-Format Clean Exporter, HMAC Webhooks, TTL Purge.
"""

import io
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

# Add apps/etl-worker to sys.path to enable validator import
etl_worker_path = Path(__file__).resolve().parent.parent / "etl-worker"
if str(etl_worker_path) not in sys.path:
    sys.path.insert(0, str(etl_worker_path))

from database import get_db
from models import IngestionJob, QuarantineRecord, SchemaContract, User, WebhookSink
from schemas import (
    AutoFixResponse,
    DispatchWebhookRequest,
    DispatchWebhookResponse,
    HealthResponse,
    IngestionJobResponse,
    PresetResponse,
    PurgeJobResponse,
    QuarantineRecordResponse,
    RemediateCellRequest,
    SandboxSimulateRequest,
    SchemaContractCreate,
    SchemaContractResponse,
    TokenResponse,
    UserLoginRequest,
    UserResponse,
    UserSignupRequest,
    WebhookSinkCreate,
    WebhookSinkResponse,
)
from security import (
    create_access_token,
    create_refresh_token,
    generate_hmac_secret,
    hash_password,
    rate_limiter,
    sign_webhook_payload,
    validate_password_entropy,
    verify_password,
    verify_webhook_signature,
)
from validator import (
    SANDBOX_PRESETS,
    execute_validation_pipeline,
    generate_sample_corpus,
    heuristic_repair_record,
    to_clean_csv,
    to_clean_jsonl,
    to_postgres_batch_sql,
)

# Ephemeral in-memory store for valid clean rows (Adheres to Zero-Retention RAM invariant)
job_clean_memory_store: Dict[uuid.UUID, List[Dict[str, Any]]] = {}


def create_app() -> FastAPI:
    """Factory creating configured IngestOS FastAPI application."""
    application = FastAPI(
        title="IngestOS Core API",
        version="1.0.0",
        description="Deterministic High-Performance Ingestion Engine with Ephemeral DLQ",
    )

    # CORS configuration
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return application


app = create_app()


# --- Telemetry & Health ---
@app.get("/health", response_model=HealthResponse, tags=["Telemetry"])
def health_check() -> HealthResponse:
    """Health & Telemetry endpoint."""
    return HealthResponse(
        status="healthy",
        engine="FastAPI + Polars",
        runtime="Nominal",
        timestamp=datetime.now(timezone.utc),
    )


# --- Authentication Endpoints ---
@app.post(
    "/api/v1/auth/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Auth"],
)
def signup(req: UserSignupRequest, db: Session = Depends(get_db)) -> UserResponse:
    """Register a new user with Argon2id password hashing and entropy validation."""
    validate_password_entropy(req.password)

    # Check for existing email
    existing_user = db.execute(select(User).where(User.email == req.email)).scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Argon2id Hash
    argon2_hash = hash_password(req.password)

    new_user = User(
        email=req.email,
        password_hash=argon2_hash,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/api/v1/auth/login", response_model=TokenResponse, tags=["Auth"])
def login(
    req: UserLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate user, set HttpOnly refresh cookie, and return Access JWT.

    Applies sliding-window rate limiting (max 5 failed attempts within 60s).
    """
    if rate_limiter.is_rate_limited(req.email):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too Many Requests: Rate limit exceeded. Try again in 60 seconds.",
        )

    user = db.execute(select(User).where(User.email == req.email)).scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        rate_limiter.record_failure(req.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reset rate limit counter upon successful authentication
    rate_limiter.reset_key(req.email)

    # Generate JWTs
    access_token = create_access_token(
        data={"sub": str(user.user_id), "email": user.email}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.user_id), "email": user.email}
    )

    # Set HttpOnly refresh cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in HTTPS production
        samesite="lax",
        max_age=7 * 24 * 3600,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=3600,
    )


# --- Schema Contracts & Presets ---
@app.get("/api/v1/schemas/presets", response_model=List[PresetResponse], tags=["Schemas"])
def get_schema_presets() -> List[PresetResponse]:
    """Retrieve the 4 official IngestOS Sandbox AST presets."""
    return [
        PresetResponse(
            name=preset["name"],
            version=preset["version"],
            description=preset["description"],
            rules_json=preset["rules_json"],
        )
        for preset in SANDBOX_PRESETS
    ]


@app.post(
    "/api/v1/schemas",
    response_model=SchemaContractResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Schemas"],
)
def create_schema_contract(
    req: SchemaContractCreate,
    db: Session = Depends(get_db),
) -> SchemaContractResponse:
    """Register a new AST Schema Contract."""
    contract = SchemaContract(
        name=req.name,
        version=req.version,
        rules_json=req.rules_json,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@app.get(
    "/api/v1/schemas/{contract_id}",
    response_model=SchemaContractResponse,
    tags=["Schemas"],
)
def get_schema_contract(
    contract_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> SchemaContractResponse:
    """Retrieve an AST Schema Contract."""
    contract = db.execute(
        select(SchemaContract).where(SchemaContract.contract_id == contract_id)
    ).scalar_one_or_none()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schema contract not found.",
        )
    return contract


# --- Ingestion & Quarantine Core ---
ALLOWED_MIME_TYPES = {
    "text/csv",
    "text/plain",
    "application/csv",
    "application/vnd.ms-excel",
    "text/x-csv",
    "application/octet-stream",
}

DISALLOWED_EXTENSIONS = {
    ".exe", ".pdf", ".bin", ".sh", ".bat", ".cmd", ".dll", ".so", ".py", ".js"
}


@app.post(
    "/api/v1/ingest",
    response_model=IngestionJobResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Ingestion"],
)
async def ingest_dataset(
    file: UploadFile = File(...),
    contract_id: Optional[uuid.UUID] = Form(None),
    db: Session = Depends(get_db),
) -> IngestionJobResponse:
    """Ingest CSV dataset using Polars AST validation engine.

    Enforces:
    - TC-ING-02: MIME type and extension validation
    - Zero-Retention RAM rule: Valid rows stream in memory
    - 60-Minute DLQ TTL: Only malformed rows persist to quarantine_records
    """
    filename = file.filename or "uploaded.csv"
    file_ext = Path(filename).suffix.lower()

    if file_ext in DISALLOWED_EXTENSIONS or (
        file.content_type and file.content_type not in ALLOWED_MIME_TYPES and not filename.endswith((".csv", ".txt"))
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Only valid CSV files are permitted.",
        )

    # Read buffer in memory
    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Fetch schema rules if contract provided
    rules_json: Optional[Dict[str, Any]] = None
    if contract_id:
        contract = db.execute(
            select(SchemaContract).where(SchemaContract.contract_id == contract_id)
        ).scalar_one_or_none()
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SchemaContract with ID {contract_id} not found.",
            )
        rules_json = contract.rules_json

    # Execute Polars AST evaluation engine
    val_result = execute_validation_pipeline(raw_bytes, rules_json)

    # Persist Ingestion Job metadata (no clean customer rows in DB!)
    job = IngestionJob(
        filename=filename,
        contract_id=contract_id,
        total_rows=val_result.total_rows,
        valid_rows=val_result.valid_rows_count,
        quarantined_rows=val_result.quarantined_rows_count,
        parse_time_ms=val_result.parse_time_ms,
        status="COMPLETED",
    )
    db.add(job)
    db.flush()

    # Store clean rows in-memory (Zero-Retention RAM invariant)
    job_clean_memory_store[job.job_id] = val_result.valid_rows

    # Ephemeral Quarantine DLQ: Write quarantined records with 60-min TTL
    for q_item in val_result.quarantine_records:
        record = QuarantineRecord(
            job_id=job.job_id,
            row_index=q_item["row_index"],
            raw_payload=q_item["raw_payload"],
            validation_errors=q_item["validation_errors"],
            is_resolved=False,
            expires_at=job.expires_at,
        )
        db.add(record)

    db.commit()
    db.refresh(job)
    return job


@app.post(
    "/api/v1/sandbox/simulate",
    response_model=IngestionJobResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Sandbox"],
)
def simulate_sandbox(
    req: SandboxSimulateRequest = SandboxSimulateRequest(),
    db: Session = Depends(get_db),
) -> IngestionJobResponse:
    """TC-SBX-01: Generate and execute simulated dataset ingestion with intentional corruption."""
    preset = next(
        (p for p in SANDBOX_PRESETS if p["name"] == req.preset_name),
        SANDBOX_PRESETS[0],
    )

    # Upsert or fetch Schema Contract for preset
    contract = db.execute(
        select(SchemaContract).where(SchemaContract.name == preset["name"])
    ).scalar_one_or_none()
    if not contract:
        contract = SchemaContract(
            name=preset["name"],
            version=preset["version"],
            rules_json=preset["rules_json"],
        )
        db.add(contract)
        db.flush()

    # Generate sample corpus
    raw_bytes = generate_sample_corpus(preset["name"])
    val_result = execute_validation_pipeline(raw_bytes, preset["rules_json"])

    job = IngestionJob(
        filename=f"sandbox_{preset['name'].lower().replace(' ', '_')}.csv",
        contract_id=contract.contract_id,
        total_rows=val_result.total_rows,
        valid_rows=val_result.valid_rows_count,
        quarantined_rows=val_result.quarantined_rows_count,
        parse_time_ms=val_result.parse_time_ms,
        status="COMPLETED",
    )
    db.add(job)
    db.flush()

    # In-memory clean stream retention
    job_clean_memory_store[job.job_id] = val_result.valid_rows

    # Write quarantine DLQ
    for q_item in val_result.quarantine_records:
        record = QuarantineRecord(
            job_id=job.job_id,
            row_index=q_item["row_index"],
            raw_payload=q_item["raw_payload"],
            validation_errors=q_item["validation_errors"],
            is_resolved=False,
            expires_at=job.expires_at,
        )
        db.add(record)

    db.commit()
    db.refresh(job)
    return job


@app.get(
    "/api/v1/jobs/{job_id}",
    response_model=IngestionJobResponse,
    tags=["Ingestion"],
)
def get_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> IngestionJobResponse:
    """Retrieve ingestion job status and telemetry."""
    job = db.execute(
        select(IngestionJob).where(IngestionJob.job_id == job_id)
    ).scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingestion job not found.",
        )
    return job


@app.get(
    "/api/v1/jobs/{job_id}/quarantine",
    response_model=List[QuarantineRecordResponse],
    tags=["Quarantine"],
)
def get_quarantine_records(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> List[QuarantineRecordResponse]:
    """Retrieve isolated quarantine records for interactive triage."""
    records = db.execute(
        select(QuarantineRecord)
        .where(QuarantineRecord.job_id == job_id)
        .order_by(QuarantineRecord.row_index.asc())
    ).scalars().all()
    return list(records)


@app.patch(
    "/api/v1/jobs/{job_id}/rows/{record_id}",
    response_model=QuarantineRecordResponse,
    tags=["Quarantine"],
)
def remediate_cell(
    job_id: uuid.UUID,
    record_id: uuid.UUID,
    req: RemediateCellRequest,
    db: Session = Depends(get_db),
) -> QuarantineRecordResponse:
    """TC-FIX-01: Inline cell remediation.

    Updates resolved value, sets is_resolved=True, and increments valid_rows count on job.
    """
    record = db.execute(
        select(QuarantineRecord).where(
            QuarantineRecord.record_id == record_id,
            QuarantineRecord.job_id == job_id,
        )
    ).scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quarantine record not found for this job.",
        )

    # Build resolved dictionary
    updated_payload = dict(record.raw_payload)
    if req.field and req.value is not None:
        updated_payload[req.field] = req.value
    elif req.resolved_value:
        updated_payload.update(req.resolved_value)

    record.resolved_value = updated_payload

    # If transitioning from unresolved to resolved, increment valid rows
    if not record.is_resolved:
        record.is_resolved = True
        job = db.execute(
            select(IngestionJob).where(IngestionJob.job_id == job_id)
        ).scalar_one_or_none()
        if job:
            job.valid_rows += 1
            if job.quarantined_rows > 0:
                job.quarantined_rows -= 1

        if job_id not in job_clean_memory_store:
            job_clean_memory_store[job_id] = []
        job_clean_memory_store[job_id].append(updated_payload)

    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    return record


@app.post(
    "/api/v1/jobs/{job_id}/auto-fix",
    response_model=AutoFixResponse,
    tags=["Quarantine"],
)
def bulk_auto_fix(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> AutoFixResponse:
    """TC-FIX-02: Bulk heuristic auto-fix for recoverable violations."""
    job = db.execute(
        select(IngestionJob).where(IngestionJob.job_id == job_id)
    ).scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingestion job not found.",
        )

    columns_spec = {}
    if job.contract_id:
        contract = db.execute(
            select(SchemaContract).where(SchemaContract.contract_id == job.contract_id)
        ).scalar_one_or_none()
        if contract and "columns" in contract.rules_json:
            columns_spec = contract.rules_json["columns"]
        elif contract and isinstance(contract.rules_json, dict):
            columns_spec = contract.rules_json

    unresolved_records = db.execute(
        select(QuarantineRecord).where(
            QuarantineRecord.job_id == job_id,
            QuarantineRecord.is_resolved == False,
        )
    ).scalars().all()

    remediated_count = 0
    for rec in unresolved_records:
        fixed, repaired_payload = heuristic_repair_record(
            rec.raw_payload,
            rec.validation_errors,
            columns_spec,
        )
        if fixed and repaired_payload:
            rec.is_resolved = True
            rec.resolved_value = repaired_payload
            rec.updated_at = datetime.now(timezone.utc)
            job.valid_rows += 1
            job.quarantined_rows -= 1
            remediated_count += 1

            if job_id not in job_clean_memory_store:
                job_clean_memory_store[job_id] = []
            job_clean_memory_store[job_id].append(repaired_payload)

    db.commit()

    remaining_quarantined = len(
        db.execute(
            select(QuarantineRecord).where(
                QuarantineRecord.job_id == job_id,
                QuarantineRecord.is_resolved == False,
            )
        ).scalars().all()
    )

    return AutoFixResponse(
        remediated_count=remediated_count,
        remaining_quarantined=remaining_quarantined,
    )


# --- Multi-Format Clean Exporter ---
@app.get("/api/v1/jobs/{job_id}/export", tags=["Export"])
@app.get("/api/v1/export/{job_id}", tags=["Export"])
def export_clean_data(
    job_id: uuid.UUID,
    format: str = "csv",
    db: Session = Depends(get_db),
) -> Response:
    """TC-EXP-01 & TC-EXP-02: Stream clean records adhering to Zero-Retention RAM Law.

    Ensures ZERO leakage of unresolved quarantined records into exported datasets.
    """
    job = db.execute(
        select(IngestionJob).where(IngestionJob.job_id == job_id)
    ).scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingestion job not found.",
        )

    # Collect clean valid in-memory rows
    clean_rows = list(job_clean_memory_store.get(job_id, []))

    # Also include any remediated/resolved records that might not be in cache
    resolved_records = db.execute(
        select(QuarantineRecord).where(
            QuarantineRecord.job_id == job_id,
            QuarantineRecord.is_resolved == True,
        )
    ).scalars().all()
    for rec in resolved_records:
        if rec.resolved_value and rec.resolved_value not in clean_rows:
            clean_rows.append(rec.resolved_value)

    format_lower = format.lower()
    if format_lower == "sql":
        sql_content = to_postgres_batch_sql(clean_rows, table_name="clean_records")
        return Response(content=sql_content, media_type="application/sql")
    elif format_lower in ("json", "jsonl", "ndjson"):
        jsonl_content = to_clean_jsonl(clean_rows)
        return PlainTextResponse(content=jsonl_content, media_type="application/x-ndjson")
    else:
        csv_content = to_clean_csv(clean_rows)
        return Response(content=csv_content, media_type="text/csv")


# --- Webhooks & Dispatcher ---
@app.post(
    "/api/v1/webhooks",
    response_model=WebhookSinkResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Webhooks"],
)
def create_webhook(
    req: WebhookSinkCreate,
    db: Session = Depends(get_db),
) -> WebhookSinkResponse:
    """TC-WHK-01: Provision Webhook sink with cryptographic HMAC secret."""
    user_id = req.user_id
    if user_id is not None and (
        str(user_id) == "00000000-0000-0000-0000-000000000000"
        or user_id == uuid.UUID("00000000-0000-0000-0000-000000000000")
    ):
        user_id = None

    hmac_secret = generate_hmac_secret()
    sink = WebhookSink(
        user_id=user_id,
        target_url=req.target_url,
        hmac_secret=hmac_secret,
        retry_policy=req.retry_policy,
        dlq_enabled=req.dlq_enabled,
    )
    db.add(sink)
    db.commit()
    db.refresh(sink)
    return sink


@app.post(
    "/api/v1/jobs/{job_id}/dispatch-webhook",
    response_model=DispatchWebhookResponse,
    tags=["Webhooks"],
)
def dispatch_webhook(
    job_id: uuid.UUID,
    req: DispatchWebhookRequest,
    db: Session = Depends(get_db),
) -> DispatchWebhookResponse:
    """TC-WHK-01: Dispatch clean dataset event with HMAC-SHA256 signature."""
    job = db.execute(
        select(IngestionJob).where(IngestionJob.job_id == job_id)
    ).scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingestion job not found.",
        )

    sink = db.execute(
        select(WebhookSink).where(WebhookSink.sink_id == req.sink_id)
    ).scalar_one_or_none()
    if not sink:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook sink not found.",
        )

    clean_rows = list(job_clean_memory_store.get(job_id, []))
    resolved_records = db.execute(
        select(QuarantineRecord).where(
            QuarantineRecord.job_id == job_id,
            QuarantineRecord.is_resolved == True,
        )
    ).scalars().all()
    for rec in resolved_records:
        if rec.resolved_value and rec.resolved_value not in clean_rows:
            clean_rows.append(rec.resolved_value)

    payload_dict = {
        "event": "ingest.job.completed",
        "job_id": str(job.job_id),
        "filename": job.filename,
        "valid_rows_count": len(clean_rows),
        "rows": clean_rows,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    payload_raw = json.dumps(payload_dict, default=str)
    signature = sign_webhook_payload(payload_raw, sink.hmac_secret)

    return DispatchWebhookResponse(
        status="DISPATCHED",
        signature=signature,
        payload_raw=payload_raw,
    )


# --- Zero-Retention TTL Purge Engine ---
@app.post(
    "/api/v1/jobs/{job_id}/purge",
    response_model=PurgeJobResponse,
    tags=["Quarantine"],
)
def purge_job_quarantine(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> PurgeJobResponse:
    """TC-SEC-02: Explicit Zero-Retention purge of quarantine records for a job."""
    job = db.execute(
        select(IngestionJob).where(IngestionJob.job_id == job_id)
    ).scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingestion job not found.",
        )

    records = db.execute(
        select(QuarantineRecord).where(QuarantineRecord.job_id == job_id)
    ).scalars().all()
    purged_count = len(records)
    for rec in records:
        db.delete(rec)

    job.status = "PURGED"
    job.quarantined_rows = 0
    job_clean_memory_store.pop(job_id, None)

    db.commit()
    return PurgeJobResponse(
        status="PURGED",
        purged_records_count=purged_count,
    )


def purge_expired_quarantine_jobs(db: Session) -> int:
    """Zero-retention purge task: deletes quarantine records for jobs past their TTL."""
    now = datetime.now(timezone.utc)
    expired_jobs = db.execute(
        select(IngestionJob).where(
            IngestionJob.expires_at <= now,
            IngestionJob.status != "PURGED",
        )
    ).scalars().all()

    total_purged = 0
    for job in expired_jobs:
        records = db.execute(
            select(QuarantineRecord).where(QuarantineRecord.job_id == job.job_id)
        ).scalars().all()
        total_purged += len(records)
        for rec in records:
            db.delete(rec)
        job.status = "PURGED"
        job.quarantined_rows = 0
        job_clean_memory_store.pop(job.job_id, None)

    db.commit()
    return total_purged
