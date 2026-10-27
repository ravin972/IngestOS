"""Pydantic v2 Schemas for IngestOS API Core."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Base Schema with common configuration
class IngestOSBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# --- Authentication Schemas ---
class UserSignupRequest(IngestOSBaseModel):
    email: EmailStr
    password: str


class UserLoginRequest(IngestOSBaseModel):
    email: str
    password: str


class UserResponse(IngestOSBaseModel):
    user_id: uuid.UUID
    email: str
    oauth_provider: Optional[str] = None
    is_active: bool
    created_at: datetime


class TokenResponse(IngestOSBaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600


# --- Schema Contract Schemas ---
class SchemaContractCreate(IngestOSBaseModel):
    name: str = Field(..., max_length=255)
    version: str = Field(default="v1.0", max_length=50)
    rules_json: Dict[str, Any]


class SchemaContractResponse(IngestOSBaseModel):
    contract_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    name: str
    version: str
    rules_json: Dict[str, Any]
    created_at: datetime


# --- Ingestion Job Schemas ---
class IngestionJobResponse(IngestOSBaseModel):
    job_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    contract_id: Optional[uuid.UUID] = None
    filename: str
    total_rows: int
    valid_rows: int
    quarantined_rows: int
    parse_time_ms: float
    status: str
    expires_at: datetime
    created_at: datetime


# --- Quarantine Record Schemas ---
class QuarantineRecordResponse(IngestOSBaseModel):
    record_id: uuid.UUID
    job_id: uuid.UUID
    row_index: int
    raw_payload: Dict[str, Any]
    validation_errors: List[Dict[str, Any]]
    is_resolved: bool
    resolved_value: Optional[Dict[str, Any]] = None
    expires_at: datetime
    updated_at: datetime


class RemediateCellRequest(IngestOSBaseModel):
    field: Optional[str] = None
    value: Optional[Any] = None
    resolved_value: Optional[Dict[str, Any]] = None


# --- Webhook Sink Schemas ---
class WebhookSinkCreate(IngestOSBaseModel):
    user_id: Optional[uuid.UUID] = None
    target_url: str = Field(..., max_length=1024)
    retry_policy: str = Field(default="EXPONENTIAL_5X", max_length=50)
    dlq_enabled: bool = True


class WebhookSinkResponse(IngestOSBaseModel):
    sink_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    target_url: str
    hmac_secret: str
    retry_policy: str
    dlq_enabled: bool
    created_at: datetime


# --- Telemetry & Health ---
class HealthResponse(IngestOSBaseModel):
    status: str = "healthy"
    engine: str = "FastAPI + Polars"
    runtime: str = "Nominal"
    timestamp: datetime


# --- Phase 4 Advanced Pipeline Schemas ---
class PresetResponse(IngestOSBaseModel):
    name: str
    version: str
    description: str
    rules_json: Dict[str, Any]


class SandboxSimulateRequest(IngestOSBaseModel):
    preset_name: str = "E-Commerce Orders"


class AutoFixResponse(IngestOSBaseModel):
    remediated_count: int
    remaining_quarantined: int


class DispatchWebhookRequest(IngestOSBaseModel):
    sink_id: uuid.UUID


class DispatchWebhookResponse(IngestOSBaseModel):
    status: str
    signature: str
    payload_raw: str


class PurgeJobResponse(IngestOSBaseModel):
    status: str
    purged_records_count: int
