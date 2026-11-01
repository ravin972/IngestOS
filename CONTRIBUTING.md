# Contributing to IngestOS

Thank you for your interest in contributing to **IngestOS**! We are building the next-generation, high-throughput B2B data ingestion and quarantine engine powered by our strict **Zero-Retention RAM Law**.

All contributors, maintainers, and automated agents operate under deterministic engineering and continuous integration standards.

---

## 1. Branching Strategy & Git Topology

IngestOS maintains a clean, multi-tier branching topology designed for continuous delivery and zero production regressions:

```
feature/* or fix/*  ──(PR)──>  dev  ──(PR)──>  staging  ──(PR)──>  main (Production)
                                │                 │                   │
                     Active Integration       Pre-Release QA      Live Vercel & Render
```

### Branch Responsibilities:
1. **`feature/*` / `fix/*` (Working Branches):**
   - Always cut from `dev`.
   - Dedicated to a single atomic feature, bug fix, or performance optimization.
   - PR targets `dev`.
2. **`dev` (Active Contributor Integration):**
   - The primary development trunk where new features, AST validation rules, and UI enhancements merge first.
   - Continually validated by automated GitHub Actions CI (`backend-ci` and `frontend-ci`).
3. **`staging` (Pre-Release QA & Benchmarking):**
   - Release candidates are promoted from `dev` into `staging` via Pull Request.
   - Used for end-to-end integration testing, throughput benchmarking (1.48M rows/sec), and staging deployments.
4. **`main` (Production Release):**
   - Strictly protected production trunk.
   - Powers the live platform at [ingest-os.vercel.app](https://ingest-os.vercel.app) and the production Render API engine.
   - Direct pushes to `main` are restricted; code only enters `main` through fast-forward merges or approved release PRs from `staging` (or emergency hotfixes).

---

## 2. Core Architectural Invariant: The Zero-Retention RAM Law

Before contributing code, every engineer must understand our strict privacy and data protection mandate:

> **The Zero-Retention RAM Law:**  
> Clean, validated customer records must live **strictly in ephemeral memory buffers** (`io.BytesIO`, Polars vectorized DataFrames, and in-memory clean stores).  
> **Under no circumstances may clean customer records be persisted to relational disk tables, local file paths, or staging cloud storage buckets.**

- **Ephemeral DLQ TTL:** Corrupted rows routed to quarantine must carry an immutable `expires_at = created_at + 60 minutes`.
- **Memory Zeroization:** When a job completes, purges, or TTL lapses, memory references must be wiped (`0x00` zeroization).

---

## 3. Local Development Setup

### Prerequisites
- **Git**
- **Docker & Docker Desktop** (for local PostgreSQL 15 & Redis 7)
- **Python 3.11+** (Python 3.12 recommended)
- **Node.js 20+** & **npm 10+**

### Step 1: Clone Repository & Check Out `dev`
```bash
git clone https://github.com/ravin972/IngestOS.git
cd IngestOS
git checkout dev
```

### Step 2: Spin Up Infrastructure Containers
IngestOS binds PostgreSQL to host port **5434** to eliminate port collisions with local PostgreSQL instances:
```bash
docker compose up -d
```

### Step 3: Initialize Database Schema
```bash
python -c "import sys; sys.path.insert(0, 'apps/api-core'); from database import engine; from models import Base; Base.metadata.create_all(bind=engine); print('PostgreSQL initialized!')"
```

### Step 4: Run Backend API Dev Server
```bash
cd apps/api-core
pip install -r requirements.txt pytest httpx
python -m uvicorn main:app --reload --port 8000
```
- API Documentation (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Telemetry: [http://localhost:8000/health](http://localhost:8000/health)

### Step 5: Run Frontend Dev Server
In a separate terminal:
```bash
cd apps/web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Conventional Commits Standard

IngestOS enforces the [Conventional Commits](https://www.conventionalcommits.org/) specification for clean changelogs and semantic versioning:

```
<type>(<scope>): <short description in present tense>
```

### Standard Types & Scopes:
- `feat(engine)`: Vectorized AST validation rules, Polars transformations, schema inference.
- `feat(web)`: Frontend components, Quarantine Studio UI, modals, visualizations.
- `fix(api)`: Backend route handling, rate limiting, or session bug fixes.
- `fix(web)`: UI bug fixes, routing patches, state hydration corrections.
- `perf(etl)`: Vectorized parser throughput improvements.
- `docs(readme)`: Documentation, architecture diagrams, or ADR updates.
- `ci`: GitHub Actions workflows, lint configurations, or build scripts.
- `chore`: Dependency updates, formatting, or maintenance.

*Example:* `feat(webhooks): add live HMAC-SHA256 signature verification tester`

---

## 5. Local Pre-Flight Verification Checklist

Before opening any Pull Request, run the local verification quality gate:

```bash
# 1. Run the entire backend Pytest suite (Must be 100% GREEN)
pytest apps/api-core/tests -v

# 2. Run the frontend ESLint quality check (0 warnings, 0 errors)
npm --prefix apps/web run lint

# 3. Run the Next.js production build verification (Exit code: 0)
npm --prefix apps/web run build
```

---

## 6. Pull Request Lifecycle

1. **Branch from `dev`:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/my-vectorized-rule
   ```
2. **Implement & Test:**
   - Adhere to the Zero-Retention RAM Law.
   - Include automated tests for any new validation logic or API endpoints.
3. **Run Pre-Flight Checks:** Verify `pytest` and `npm run build` pass locally.
4. **Submit PR into `dev`:**
   - Use the provided Pull Request template.
   - Check all compliance, testing, and branch target boxes.
5. **CI Quality Gate:**
   - GitHub Actions will run `backend-ci` (Python 3.12) and `frontend-ci` (Node 20).
   - All status checks must be green before merging.

Thank you for contributing to high-speed, zero-retention data engineering!
