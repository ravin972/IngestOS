# IngestOS — Deterministic Engineering & QA Harness Rules (ECC Standard)

## 1. Core Execution Loop (Strictly Enforced)
You MUST follow the ECC deterministic loop for every feature:
`PLAN -> WRITE QA TESTS (RED) -> IMPLEMENT CODE (GREEN) -> REFACTOR & SECURITY SCAN -> VERIFY`
- **NEVER** write implementation code before writing or updating the corresponding `pytest` / `vitest` test cases from our QA Matrix.
- **NEVER** hallucinate libraries outside the approved tech stack.

## 2. Locked Tech Stack & Architecture
- **Brand & Namespace:** Strictly `IngestOS` (Never use legacy names like Voxly OSS or QuarantineOS).
- **Backend API (`apps/api-core`):** Python 3.11+, FastAPI, SQLAlchemy 2.0 (Async/Sync), Pydantic v2, Alembic.
- **Authentication:** Argon2id password hashing (`passlib`/`argon2-cffi`), JWT Access Tokens + `HttpOnly` Refresh Cookies, Redis sliding-window rate limiting.
- **Data Engine (`apps/etl-worker`):** Polars (`polars` Rust-backed DataFrame engine) + Celery + Redis Broker.
- **Database:** PostgreSQL 15 (`JSONB` for AST schema rules and quarantine payloads).
- **Frontend (`apps/web`):** Next.js (App Router), TypeScript, Tailwind CSS.
  - Design Tokens: `#090D16` (Canvas), `#111827` (Surface Cards), `#1F2937` (1px Borders), `#6366F1` (Primary Indigo), `#10B981` (Emerald Valid), `#EF4444` (Coral Quarantine).
  - Typography: `Inter` (UI & Uppercase Table Headers with `tracking-wider`), `JetBrains Mono` (Data cells, AST rules, telemetry).

## 3. Architectural Invariants (The "Zero-Retention RAM" Law)
1. **Clean Rows Never Touch Disk:** Validated clean records must stream directly in memory (Polars/Redis) to the export sink or webhook. Never persist clean customer rows in PostgreSQL.
2. **Quarantined Rows (DLQ) Ephemeral TTL:** Only broken rows failing AST contracts are written to `quarantine_records` in PostgreSQL/Redis with an explicit `expires_at` timestamp (**60-minute strict TTL**) for interactive triage, after which a background worker purges them (`0x00` wipe).