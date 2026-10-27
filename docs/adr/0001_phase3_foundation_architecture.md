# ADR 0001: Phase 3 Foundation Architecture & Zero-Retention RAM Ingestion

## Status
Accepted

## Context
IngestOS requires an ingestion engine capable of processing gigabyte-scale tabular datasets with deterministic AST validation rules, an interactive remediation DLQ, and compliance with the "Zero-Retention RAM Law".

## Decision
1. **Infrastructure:**
   - PostgreSQL 15 (`postgres:15-alpine`) as the metadata and quarantine DLQ store (`ingest_os_db`).
   - Redis 7 (`redis:7-alpine`) for rate limiting and Celery worker coordination.
2. **5-Table Schema:**
   - `users`: User identity and Argon2id hash storage.
   - `schema_contracts`: Versioned AST column rules in `JSONB`.
   - `ingestion_jobs`: Job telemetry and 60-minute DLQ TTL expiry (`expires_at`).
   - `quarantine_records`: Ephemeral isolated DLQ records for triage.
   - `webhook_sinks`: Outbound destinations with HMAC-SHA256 signature keys.
3. **Engine & Rules:**
   - Polars engine executes high-speed CSV parsing and regex/numeric AST validations.
   - Valid records stream in-memory; only violating records enter the quarantine DLQ.
   - Inline cell remediation updates quarantine state and dynamically increments job valid rows.
4. **Security:**
   - Argon2id password hashing via `argon2-cffi`.
   - Strict entropy rules (>=12 chars, special symbol, uppercase, digit).
   - Sliding-window rate limiter blocking brute-force attacks (>=5 failed attempts per 60s).
   - JWT access tokens + HttpOnly refresh cookies.
