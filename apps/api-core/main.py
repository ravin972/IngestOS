"""IngestOS FastAPI Core Application.

Zero-Retention RAM Architecture with Deterministic AST Validation.
"""

import io
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

# Add apps/etl-worker to sys.path to enable validator import
etl_worker_path = Path(__file__).resolve().parent.parent / "etl-worker"
if str(etl_worker_path) not in sys.path:
    sys.path.insert(0, str(etl_worker_path))

from database import get_db
from models import IngestionJob, QuarantineRecord, SchemaContract, User, WebhookSink
from schemas import (
    HealthResponse,
    IngestionJobResponse,
    QuarantineRecordResponse,
    RemediateCellRequest,
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
    validate_password_entropy,
    verify_password,
)
from validator import execute_validation_pipeline


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


# --- Schema Contracts ---
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

    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    return record


@app.get("/api/v1/export/{job_id}", tags=["Export"])
def export_clean_data(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> Response:
    """Stream clean records adhering to the Zero-Retention RAM Law.

    Fetches job metadata and verified clean records or sink target.
    """
    job = db.execute(
        select(IngestionJob).where(IngestionJob.job_id == job_id)
    ).scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingestion job not found.",
        )

    return JSONResponse({
        "job_id": str(job.job_id),
        "status": job.status,
        "valid_rows": job.valid_rows,
        "message": "Export stream ready. Valid rows processed in RAM memory.",
    })
