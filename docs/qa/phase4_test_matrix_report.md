# IngestOS Phase 4 — QA Test Execution & Traceability Matrix

## 1. Test Suite Summary
- **Test Framework:** `pytest 7.4.4` with `starlette.testclient.TestClient`
- **Execution Date:** 2026-10-27
- **Test Results:** 14 Passed, 0 Failed, 0 Skipped (100% GREEN)
- **Execution Time:** ~0.47s
- **Cumulative Coverage:** Phase 3 + Phase 4 End-to-End Pipeline

## 2. Traceability Matrix

| Test ID | Test Function | Module | Assertion / Target Verification | Status |
|---|---|---|---|---|
| **TC-AUT-01** | `test_signup_valid_argon2` | `tests/test_auth.py` | Password >= 12 chars + symbol passes entropy check, creates user, stores Argon2id (`$argon2id$`) hash. | **PASSED** |
| **TC-AUT-02** | `test_signup_weak_password_rejected` | `tests/test_auth.py` | Passwords < 12 characters or missing special characters return `400 Bad Request`. | **PASSED** |
| **TC-AUT-03** | `test_login_sets_httponly_cookie` | `tests/test_auth.py` | Successful login issues Access JWT in response body and sets `refresh_token` as an `HttpOnly` cookie. | **PASSED** |
| **TC-AUT-04** | `test_login_rate_limit_brute_force` | `tests/test_auth.py` | 5 failed attempts allowed; 6th attempt within 60s returns `429 Too Many Requests`. | **PASSED** |
| **TC-TEL-01** | `test_health_check_telemetry` | `tests/test_ingest_and_quarantine.py` | `/health` returns status `healthy`, engine `"FastAPI + Polars"`, and runtime `"Nominal"`. | **PASSED** |
| **TC-ING-02** | `test_ingest_invalid_mime_type` | `tests/test_ingest_and_quarantine.py` | Upload of binary `.exe` or document `.pdf` returns `400 Bad Request`. | **PASSED** |
| **TC-VAL-01 / TC-VAL-02** | `test_polars_ast_quarantine_isolation` | `tests/test_ingest_and_quarantine.py` | 5-row CSV validation: 3 valid rows stream into memory; 2 malformed rows (phone & negative amount) written to `quarantine_records` with exact AST codes (`ERR_PHONE_FORMAT`, `ERR_AMOUNT_NON_NEGATIVE`) and 60-min TTL. | **PASSED** |
| **TC-FIX-01** | `test_inline_cell_remediation` | `tests/test_ingest_and_quarantine.py` | `PATCH /api/v1/jobs/{job_id}/rows/{record_id}` applies fixed cell value, sets `is_resolved=True`, and increments job `valid_rows`. | **PASSED** |
| **TC-SEC-01** | `test_sql_injection_sanitization` | `tests/test_ingest_and_quarantine.py` | SQL injection string `'; DROP TABLE users; --` is safely treated as literal text; database integrity remains intact. | **PASSED** |
| **TC-SBX-01** | `test_sandbox_presets_and_sample_corpus` | `tests/test_phase4_pipeline.py` | `GET /api/v1/schemas/presets` returns the 4 official presets (`E-Commerce Orders`, `GST / Invoices`, `CRM Leads & Accs`, `Custom AST`); `POST /api/v1/sandbox/simulate` runs simulated corrupted ingestion. | **PASSED** |
| **TC-FIX-02** | `test_bulk_heuristic_auto_fix` | `tests/test_phase4_pipeline.py` | `POST /api/v1/jobs/{job_id}/auto-fix` applies deterministic Polars/regex sanitization (phone formatting & ISO-8601 date coercion), marks recoverable rows `is_resolved=True`, updates job counters, and preserves unfixable rows. | **PASSED** |
| **TC-EXP-01 / TC-EXP-02** | `test_clean_export_formats_zero_leakage` | `tests/test_phase4_pipeline.py` | `GET /api/v1/jobs/{job_id}/export?format=csv` and `?format=sql` return only verified clean rows; assert ZERO leakage of unresolved quarantined records in CSV and atomic `BEGIN; ... COMMIT;` SQL transactions. | **PASSED** |
| **TC-WHK-01** | `test_webhook_hmac_sha256_signature_dispatch` | `tests/test_phase4_pipeline.py` | Creates Webhook sink with `whsec_...` secret, dispatches job clean dataset with `X-IngestOS-Signature: sha256=...`, verified by `verify_webhook_signature`. | **PASSED** |
| **TC-SEC-02** | `test_zero_retention_ttl_purge` | `tests/test_phase4_pipeline.py` | Zero-retention TTL purge wipes all quarantine records for expired jobs from the database and updates status to `PURGED`. | **PASSED** |
