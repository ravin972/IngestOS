# ADR 0003: Phase 5 — Next.js 14+ App Router Frontend & Design Token Architecture

## Status
Accepted and Implemented

## Context
IngestOS requires a high-performance, developer-centric frontend interface operating alongside our FastAPI and Polars backend (`apps/api-core` and `apps/etl-worker`). The user interface must enforce strict design system tokens extracted from Stitch reference project `projects/8040416824175268808`, maintain brand consistency as `IngestOS`, and support live interactions with backend endpoints while providing zero-friction fallbacks for offline or preview deployments.

## Decision

### 1. Technology Selection
- **Framework:** Next.js 14+ (App Router, React 18, TypeScript) located in `apps/web`.
- **Styling:** Tailwind CSS with custom theme extensions enforcing the IngestOS Stitch design tokens.
- **Iconography:** Lucide React (`lucide-react`) for clean, utilitarian interface iconography.
- **Fonts:** Next.js Google Fonts (`Inter` for UI chrome, headings, buttons, and all table header rows; `JetBrains Mono` for tabular data cells, row indices, AST validation rules, SQL/CSV syntax, and telemetry pills).

### 2. Design System Token Specifications
- **Canvas Backdrop:** `#090D16` (`#0c1322` sub-elements).
- **Surface Cards:** `#111827` / `#0D1117`.
- **Structural Dividers:** Hairline `1px solid #1F2937`.
- **Primary Accent:** `#6366F1` (Indigo).
- **Valid / Nominal Token:** `#10B981` (Emerald).
- **Quarantine Alert Token:** `#EF4444` (Coral Red).
- **Warning / Review Token:** `#F59E0B` (Amber).

### 3. Screen Structure & Routing
1. **`/` (Developer Landing Page):** Hero value proposition, live split-screen terminal diff, benchmark throughput bar (`1.48M rows/s`, `3.12ms`), and pricing tiers.
2. **`/sandbox` (Zero-Login Sandbox):** 4 contract presets, CSV/JSON drag-and-drop dropzone, Polars micro-terminal feed, 1-click synthetic simulation (`⌘ + S`), and live triage preview.
3. **`/workspace/[jobId]` (Quarantine Studio Workspace):** 3-pane high-density IDE workbench with schema contract rules, filter streams, virtualized spreadsheet table, keyboard navigation (`J`/`K`), heuristic auto-fix trigger, and contextual cell inspector.
4. **`ExportModal` (Modal Component):** 4 export destination cards (Clean CSV, PostgreSQL Batch INSERT, JSON Stream, Custom Webhook URL), downloadable streams, HMAC-SHA256 signature toggle, and immediate Zero-Retention RAM purge.
5. **`/auth` (Secure Enterprise Auth Gateway):** Sign In / Sign Up modes, GitHub & Google Workspace SSO, Argon2id security footer, and live password entropy calculation bar.
6. **`/privacy` (Enterprise Legal & Compliance Center):** Architectural documentation of Zero-Retention RAM Law, 60-Minute DLQ TTL, Firecracker microVM isolation, and global regulatory compliance mapping (GDPR, SOC2, DPDP, HIPAA).

### 4. API Client Strategy (`apps/web/src/lib/api.ts`)
The API helper connects to `NEXT_PUBLIC_API_URL` (`http://localhost:8000`) with native `fetch` methods for all FastAPI endpoints (`/health`, `/api/v1/schemas/presets`, `/api/v1/sandbox/simulate`, `/api/v1/ingest`, `/api/v1/jobs/{id}`, `/api/v1/jobs/{id}/auto-fix`, `/api/v1/jobs/{id}/export`, `/api/v1/webhooks`, `/api/v1/jobs/{id}/dispatch-webhook`, `/api/v1/jobs/{id}/purge`, `/api/v1/auth/signup`, `/api/v1/auth/login`). When the API backend is unreachable during static builds or standalone preview, deterministic fallback mocks ensure all UI states remain fully interactive without throwing unhandled exceptions.

## Consequences
- Fast developer iteration: Next.js App Router provides zero-config static site generation (`SSG`) and server-side rendering (`SSR`).
- Strict brand unification: Only `IngestOS` is referenced across the codebase.
- Zero-Retention compliance: The frontend visualizes the RAM-only guarantee and exposes 1-click immediate memory purging.
