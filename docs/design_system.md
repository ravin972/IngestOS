# IngestOS — UI/UX Design System Specification (Stitch Reference)

> **Source Project:** Stitch `projects/8040416824175268808`

## 1. Design Aesthetics & Engineering Tenets
- **Utilitarian & High-Density:** Designed specifically for data engineers, platform architects, and analytics teams. Zero ambient blur or ornamental gradients; visual order is enforced via structural 1px `#1F2937` hairline borders.
- **Bifurcated Typography:**
  - `Inter`: All operational interface chrome, labels, tabs, buttons, and navigation.
  - `JetBrains Mono`: All customer data cells, schema contracts, regex patterns, raw payloads, and telemetry metrics (`tnum` tabular numerals).
- **Core Dark Color Palette:**
  - **Base Canvas:** `#090D16` / `#0c1322`
  - **Panels & Headers:** `#111827` / `#141b2b`
  - **Data Rows & Inputs:** `#0F172A` / `#070e1d`
  - **Hairline Borders:** `#1F2937` / `#464554`
  - **Primary Interactive:** `#6366F1` (Hover `#4F46E5`)
  - **Valid (Passing AST):** `#10B981` / `#4edea3`
  - **Quarantine (DLQ / Violation):** `#EF4444` / `#ffb4ab`
  - **Warning (Review / Coercion):** `#F59E0B` / `#ffb3ad`

---

## 2. Core UI Screens & Modules

### Screen 1: Data Validation & Quarantine Studio (`46181208b50b40358c43da660548a3f2`)
- **Top Header Bar (`h-14`):**
  - Brand identity & version pill (`IngestOS v0.1 Sandbox`).
  - Active run breadcrumbs (`pipeline_runs / run_20261027_0941 / quarantine active`).
  - Realtime telemetry counters (`Total Rows`, `Valid Rows`, `Quarantined Rows`, `Parse Time`).
  - Quick action CTA: `Auto-Fix Common Errors` and `Export Clean Data`.
- **Asymmetric 3-Column Studio:**
  1. **Left Filter & Schema Pane (260px):**
     - Target schema contract rules tree with column types and constraints.
     - Filter stream selectors: `All Rows`, `Needs Fix (Quarantine DLQ)`, `Clean Rows` with hotkeys `[1, 2, 3]`.
     - Realtime quarantine ratio meter & rule drift gauge.
  2. **Center High-Density Virtualized Spreadsheet Grid (`flex-1`):**
     - Sticky table header (`# ROW`, `order_id`, `customer_phone`, `gst_number`, `order_date`, `amount`, `STATUS`).
     - Distinct cell error states with inline contextual pills (`Invalid Phone`, `Auto-convert`, `Duplicate Key`, `-$45.00 [Min > 0]`, `Bad Checksum`, `<NULL> [Required]`).
     - Fast row navigation (`J`/`K` keys to jump, `Enter` to inspect).
  3. **Right Contextual Cell Inspector Drawer (320px):**
     - Live context display (`Row #14: customer_phone`).
     - Current raw value box with `SYNTAX_VIOLATION` badge.
     - Violated Contract AST diagnostic card (Rule ID, failure reason, regex snippet).
     - Remediation action suite (`Smart Fill`, `Strip Non-Digits`, manual override input).
     - Primary button: `Mark Row Valid & Release [↵]`.

### Screen 2: Zero-Login Sandbox & Dropzone (`e4f179df8f6542b8be48d1b34d768c65`)
- Throughput telemetry banner (`1.48M rows/s`, `3.12ms` latency, `512MB RAM` ceiling).
- Step 1: 2x2 preset selector cards (`E-Commerce Orders`, `GST / Invoices`, `CRM Leads & Accs`, `Custom AST`).
- Step 2: Drag-and-drop file dropzone + 1-click `Simulate Ingestion` button with sample corrupted corpus.
- Lower: Embedded high-speed triage preview table.

### Screen 3: Clean Export & Webhook Sinks Modal (`7961839d83a3417da7113384588b6e33`)
- Top compliance banner confirming 100% AST compliance and zero disk leakage.
- 4 destination cards: Clean CSV, PostgreSQL Batch INSERT, Snowflake S3 Parquet, Custom Webhook URL.
- Outbound Webhook configuration panel: URL endpoint, test ping, HMAC-SHA256 signature toggle with `whsec_...` key copy, retry policy (5x), and DLQ partition.
- Action buttons: `Download Clean File` & `Dispatch Webhook Stream`.

### Screen 4: Enterprise Authentication (`e627c6feb1fa483eb888b3088acf39e3`)
- Centered authentication card with IngestOS security shield.
- Sign In / Create Account tabs with GitHub & Google Workspace SSO.
- Credentials form with dynamic segmented entropy bar (Strong 78.4 bits, >=12 chars, 1 special symbol, zero leak match).
- Zero-Retention DPA compliance footer.
