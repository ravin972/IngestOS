# Contributing to IngestOS

Thank you for your interest in contributing to **IngestOS**! We are building the next-generation, high-throughput B2B data ingestion and triage platform powered by a strict **Zero-Retention RAM Law**.

All contributors, maintainers, and automated agents operate under the **ECC (Deterministic Execution & QA Harness)** standard defined in [`CLAUDE.md`](./CLAUDE.md).

---

## 1. Core Engineering Principles (The ECC Loop)

Every bug fix, schema addition, and pipeline feature must follow our deterministic execution loop:

```
PLAN ➔ WRITE QA TESTS (RED) ➔ IMPLEMENT CODE (GREEN) ➔ REFACTOR & SECURITY SCAN ➔ VERIFY
```

### Mandatory Invariants:
1. **Never write implementation code before tests:** Always define or update the corresponding `pytest` or frontend test cases first.
2. **The "Zero-Retention RAM" Law:** Valid customer records must stream strictly in ephemeral memory (`Polars` DataFrame buffers and Redis channels). **Never insert clean customer rows into persistent PostgreSQL storage.**
3. **Ephemeral DLQ TTL:** Malformed records written to `quarantine_records` must enforce a strict **60-minute time-to-live (`expires_at`)**, after which they undergo memory zeroization (`0x00` wipe).
4. **Zero Unapproved Dependencies:** Do not add third-party libraries outside our locked technology stack without maintainer review.

---

## 2. Monorepo Architecture

```
ingestos/
├── apps/
│   ├── api-core/       # FastAPI application, SQLAlchemy models, Pydantic v2 schemas, auth & test suite
│   ├── etl-worker/     # Polars Rust-backed vectorized AST validation engine, heuristic repair, exporters
│   └── web/            # Next.js 14+ App Router frontend, Tailwind CSS, Stitch design tokens
├── docs/
│   ├── adr/            # Architecture Decision Records (ADR 0001, 0002, 0003)
│   ├── qa/             # Automated test verification reports & execution matrices
│   └── design_system.md# Stitch UI/UX design tokens & layout guidelines
├── docker-compose.yml  # Local infrastructure (PostgreSQL 15 on port 5434, Redis 7 on port 6379)
└── CLAUDE.md           # Deterministic engineering rules & locked stack specification
```

---

## 3. Local Development Setup

### Prerequisites
- **Git**
- **Docker & Docker Desktop**
- **Python 3.11+** (Python 3.12 recommended)
- **Node.js 18+** & **npm 10+**

### Step 1: Clone Repository
```bash
git clone https://github.com/ravin972/IngestOS.git
cd IngestOS
```

### Step 2: Spin Up Infrastructure Containers
IngestOS maps PostgreSQL to host port **5434** to prevent port collisions with native host PostgreSQL installations:
```bash
docker compose up -d
```
Verify containers are healthy:
```bash
docker ps --filter "name=ingestos"
```

### Step 3: Initialize Database Schema
Run SQLAlchemy schema generation against the PostgreSQL instance:
```bash
python -c "import sys; sys.path.insert(0, 'apps/api-core'); from database import engine; from models import Base; Base.metadata.create_all(bind=engine); print('Postgres tables created successfully!')"
```

### Step 4: Run Backend API Dev Server
```bash
cd apps/api-core
# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic polars passlib argon2-cffi python-jose pytest
# Launch FastAPI with auto-reload
python -m uvicorn main:app --reload --port 8000
```
- API Documentation (Swagger): `http://localhost:8000/docs`
- Health Telemetry: `http://localhost:8000/health`

### Step 5: Run Frontend Dev Server
```bash
cd ../web
# Install dependencies
npm install
# Launch Next.js dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Coding & Design Standards

### Backend Guidelines (`apps/api-core` & `apps/etl-worker`)
- **Formatting:** Adhere to PEP 8. Use `black` and `ruff` for linting.
- **Type Annotations:** Strictly type all function parameters and returns (`typing` and Pydantic v2 models).
- **ORM Models:** Use SQLAlchemy 2.0 `Mapped[...]` and `mapped_column(...)` syntax.
- **Security:**
  - Password hashing: **Argon2id** (`passlib.hash.argon2`).
  - Webhook signatures: **HMAC-SHA256** (`hashlib.sha256`) with `X-IngestOS-Signature` header.
  - SQL sanitization: Escape inputs and parameterize batch queries.

### Frontend Guidelines (`apps/web`)
- **Design Token Compliance:** Strictly adhere to our Stitch design tokens:
  - **Canvas Backdrop:** `#090D16` (`#0c1322` sub-elements)
  - **Surface Cards:** `#111827` / `#0D1117`
  - **Structural Dividers:** Hairline `1px solid #1F2937`
  - **Primary Accent:** `#6366F1` (Indigo)
  - **Valid / Nominal:** `#10B981` (Emerald)
  - **Quarantine Alert:** `#EF4444` (Coral Red)
  - **Warning / Review:** `#F59E0B` (Amber)
- **Typography Role Enforcement:**
  - `Inter` (`font-sans`): UI controls, buttons, navigation, and **all data table header rows** (`uppercase text-xs font-semibold tracking-wider text-slate-400`).
  - `JetBrains Mono` (`font-mono`): Data cells, row indices, AST validation rules, SQL/CSV syntax, and telemetry counters (`1.48M rows/s`, `3.12ms`, `0 Bytes`).

---

## 5. Testing & Verification Checklist

Before opening a pull request, run the verification suite locally:

```bash
# 1. Run all backend pytest integration tests (must be 100% GREEN)
pytest apps/api-core/tests -v

# 2. Run Next.js production build verification (must compile with 0 errors)
cd apps/web
npm run build
```

---

## 6. Pull Request Submission Workflow

1. **Create a Feature Branch:**
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
2. **Follow Conventional Commits:**
   - `feat(scope): add feature`
   - `fix(scope): patch bug`
   - `docs(scope): update documentation`
   - `test(scope): add pytest scenario`
   - `refactor(scope): internal structural improvement`
3. **Open Pull Request:**
   - Fill out the PR description with context, test results, and ADR references.
   - Ensure CI checks pass.

Thank you for helping keep enterprise ingestion clean, deterministic, and safe!
