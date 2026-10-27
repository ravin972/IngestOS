"""IngestOS SQLAlchemy Database Models.

5 Core Production Tables:
- users
- schema_contracts
- ingestion_jobs
- quarantine_records
- webhook_sinks
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base declarative model."""
    pass


def get_default_expiry(minutes: int = 60) -> datetime:
    """Return default TTL expiry timestamp (UTC)."""
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)


def get_current_utc() -> datetime:
    """Return current UTC timestamp."""
    return datetime.now(timezone.utc)


# JSON type supporting both PostgreSQL JSONB and SQLite JSON
JSONB_TYPE = sa.JSON().with_variant(postgresql.JSONB, "postgresql")


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid, primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        sa.String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(
        sa.String(255), nullable=False
    )
    oauth_provider: Mapped[Optional[str]] = mapped_column(
        sa.String(50), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        sa.Boolean, default=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), default=get_current_utc, nullable=False
    )

    # Relationships
    contracts: Mapped[List["SchemaContract"]] = relationship(
        "SchemaContract", back_populates="user", cascade="all, delete-orphan"
    )
    jobs: Mapped[List["IngestionJob"]] = relationship(
        "IngestionJob", back_populates="user"
    )
    webhook_sinks: Mapped[List["WebhookSink"]] = relationship(
        "WebhookSink", back_populates="user", cascade="all, delete-orphan"
    )


class SchemaContract(Base):
    __tablename__ = "schema_contracts"

    contract_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid, sa.ForeignKey("users.user_id"), nullable=True
    )
    name: Mapped[str] = mapped_column(
        sa.String(255), nullable=False
    )
    version: Mapped[str] = mapped_column(
        sa.String(50), default="v1.0", nullable=False
    )
    rules_json: Mapped[Dict[str, Any]] = mapped_column(
        JSONB_TYPE, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), default=get_current_utc, nullable=False
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="contracts"
    )
    jobs: Mapped[List["IngestionJob"]] = relationship(
        "IngestionJob", back_populates="contract"
    )


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    job_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid, sa.ForeignKey("users.user_id"), nullable=True
    )
    contract_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid, sa.ForeignKey("schema_contracts.contract_id"), nullable=True
    )
    filename: Mapped[str] = mapped_column(
        sa.String(255), nullable=False
    )
    total_rows: Mapped[int] = mapped_column(
        sa.Integer, default=0, nullable=False
    )
    valid_rows: Mapped[int] = mapped_column(
        sa.Integer, default=0, nullable=False
    )
    quarantined_rows: Mapped[int] = mapped_column(
        sa.Integer, default=0, nullable=False
    )
    parse_time_ms: Mapped[float] = mapped_column(
        sa.Float, default=0.0, nullable=False
    )
    status: Mapped[str] = mapped_column(
        sa.String(50), default="PROCESSING", nullable=False
    )  # PROCESSING, COMPLETED, FAILED, PURGED
    expires_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), default=get_default_expiry, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), default=get_current_utc, nullable=False
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="jobs"
    )
    contract: Mapped[Optional["SchemaContract"]] = relationship(
        "SchemaContract", back_populates="jobs"
    )
    quarantine_records: Mapped[List["QuarantineRecord"]] = relationship(
        "QuarantineRecord", back_populates="job", cascade="all, delete-orphan"
    )


class QuarantineRecord(Base):
    __tablename__ = "quarantine_records"

    record_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid, primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid, sa.ForeignKey("ingestion_jobs.job_id", ondelete="CASCADE"), nullable=False
    )
    row_index: Mapped[int] = mapped_column(
        sa.Integer, nullable=False
    )
    raw_payload: Mapped[Dict[str, Any]] = mapped_column(
        JSONB_TYPE, nullable=False
    )
    validation_errors: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB_TYPE, nullable=False
    )
    is_resolved: Mapped[bool] = mapped_column(
        sa.Boolean, default=False, nullable=False
    )
    resolved_value: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB_TYPE, nullable=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), default=get_default_expiry, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), default=get_current_utc, onupdate=get_current_utc, nullable=False
    )

    # Relationships
    job: Mapped["IngestionJob"] = relationship(
        "IngestionJob", back_populates="quarantine_records"
    )


class WebhookSink(Base):
    __tablename__ = "webhook_sinks"

    sink_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid, sa.ForeignKey("users.user_id"), nullable=True
    )
    target_url: Mapped[str] = mapped_column(
        sa.String(1024), nullable=False
    )
    hmac_secret: Mapped[str] = mapped_column(
        sa.String(255), nullable=False
    )
    retry_policy: Mapped[str] = mapped_column(
        sa.String(50), default="EXPONENTIAL_5X", nullable=False
    )
    dlq_enabled: Mapped[bool] = mapped_column(
        sa.Boolean, default=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), default=get_current_utc, nullable=False
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="webhook_sinks"
    )
