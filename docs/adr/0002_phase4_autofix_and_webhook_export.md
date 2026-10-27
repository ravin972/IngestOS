# ADR 0002: Heuristic Auto-Fix Engine, Multi-Format Clean Exporter, and HMAC Webhook Dispatcher

## Status
Accepted

## Context
IngestOS Phase 4 introduces automated remediation of recoverable data formatting violations, multi-format export of verified datasets with strict zero-leakage guarantees, outbound authenticated webhook dispatching, and zero-retention quarantine record purges past the 60-minute TTL.

## Decisions

### 1. Preset Schema Contracts
- Four standardized presets are provisioned:
  - `E-Commerce Orders`: Order ID, customer, 10-digit phone, ISO-8601 date, non-negative total amount, status.
  - `GST / Invoices`: Invoice number, 15-character alphanumeric GSTIN, date, taxable value, CGST, SGST.
  - `CRM Leads & Accs`: Lead ID, company name, corporate email regex, contact phone, deal size.
  - `Custom AST`: Arbitrary customizable typing and regex AST rules.
- Supported by a deterministic dataset simulator (`/api/v1/sandbox/simulate`) generating realistic tabular streams with intentional edge-case corruptions.

### 2. Heuristic Auto-Fix Engine
- Rather than discarding recoverable typographical errors, deterministic rules sanitize:
  - **Phone Numbers:** Strips delimiters, hyphens, and alphabetical typos (`abc` -> `000`), trimming country codes when preserving a 10-digit standard.
  - **Dates:** Coerces `DD/MM/YYYY`, `DD-MM-YYYY`, and `MM/DD/YYYY` formats into ISO-8601 `YYYY-MM-DD`.
  - **Whitespace:** Strips leading/trailing extraneous padding.
- Irrecoverable semantic violations (such as negative financial values or missing critical keys) are preserved in quarantine for manual human review.

### 3. Clean Exporters (Zero-Leakage Enforcement)
- Clean rows are streamed exclusively in-memory adhering to the **Zero-Retention RAM Law**.
- Exports support CSV (`text/csv`) and PostgreSQL transaction scripts (`BEGIN; ... INSERT INTO clean_records ... COMMIT;` with SQL escaping).
- The pipeline guarantees that zero unapproved or uncorrected quarantine records can ever reach the export stream.

### 4. Outbound Webhook Dispatcher & HMAC-SHA256 Signing
- Sinks are registered with a secure secret format (`whsec_<48-hex-chars>`).
- Payloads are signed using `HMAC-SHA256`, attaching signature header `X-IngestOS-Signature: sha256=<hex_digest>`, allowing downstream consumers to verify integrity using `security.verify_webhook_signature`.

### 5. Zero-Retention TTL Purge
- All `quarantine_records` are strictly ephemeral with a 60-minute default TTL.
- The purge worker executes hard-deletions on records where `expires_at <= NOW()` (or upon immediate user trigger via `/api/v1/jobs/{job_id}/purge`), transitioning job state to `PURGED` and wiping in-memory buffers (`0x00` wipe semantics).
