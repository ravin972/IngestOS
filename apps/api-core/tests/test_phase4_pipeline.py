"""QA Test Suite: Phase 4 Advanced IngestOS Pipeline.

Test Cases:
- TC-SBX-01: Sandbox presets & simulated corrupted dataset execution.
- TC-FIX-02: Bulk heuristic auto-fix engine for recoverable violations (phone, date, whitespace).
- TC-EXP-01 & TC-EXP-02: Multi-format clean export (CSV, PostgreSQL SQL) ensuring ZERO leakage of quarantined rows.
- TC-WHK-01: HMAC-SHA256 webhook dispatcher with signature verification.
- TC-SEC-02: Zero-retention TTL purge engine with complete DLQ record wiping.
"""

import io
import json
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import IngestionJob, QuarantineRecord, WebhookSink
from security import verify_webhook_signature


def test_sandbox_presets_and_sample_corpus(client: TestClient):
    """TC-SBX-01: Fetch official sandbox presets and execute simulated dataset ingestion."""
    # 1. Verify GET /api/v1/schemas/presets returns the 4 official presets
    presets_res = client.get("/api/v1/schemas/presets")
    assert presets_res.status_code == 200, presets_res.text
    presets = presets_res.json()
    assert isinstance(presets, list)
    preset_names = [p["name"] for p in presets]
    assert "E-Commerce Orders" in preset_names
    assert "GST / Invoices" in preset_names
    assert "CRM Leads & Accs" in preset_names
    assert "Custom AST" in preset_names

    # 2. Simulate dataset ingestion via sandbox endpoint
    sim_res = client.post(
        "/api/v1/sandbox/simulate",
        json={"preset_name": "E-Commerce Orders"},
    )
    assert sim_res.status_code in [200, 201], sim_res.text
    sim_data = sim_res.json()
    assert "job_id" in sim_data
    assert sim_data["total_rows"] > 0
    assert sim_data["valid_rows"] > 0
    assert sim_data["quarantined_rows"] > 0
    assert sim_data["parse_time_ms"] >= 0
    assert sim_data["status"] == "COMPLETED"


def test_bulk_heuristic_auto_fix(client: TestClient, db_session: Session):
    """TC-FIX-02: Bulk heuristic auto-fix resolves recoverable rows and increments valid_rows."""
    # Register schema contract with phone and date rules
    contract_res = client.post(
        "/api/v1/schemas",
        json={
            "name": "AutoFix Schema Contract",
            "version": "v1.0",
            "rules_json": {
                "columns": {
                    "id": {"type": "integer", "required": True},
                    "phone": {
                        "type": "string",
                        "regex": r"^\d{10}$",
                        "error_code": "ERR_PHONE_FORMAT",
                    },
                    "order_date": {
                        "type": "string",
                        "regex": r"^\d{4}-\d{2}-\d{2}$",
                        "error_code": "ERR_DATE_ISO",
                    },
                    "amount": {
                        "type": "float",
                        "min": 0.0,
                        "error_code": "ERR_AMOUNT_NON_NEGATIVE",
                    },
                }
            },
        },
    )
    assert contract_res.status_code == 201
    contract_id = contract_res.json()["contract_id"]

    # Ingest 4 rows:
    # Row 1: Valid
    # Row 2: Fixable phone with hyphens/letters ("98112-abc01" -> normalized to 10 digits "9811200001")
    # Row 3: Fixable date in DD/MM/YYYY ("27/10/2026" -> normalized to "2026-10-27")
    # Row 4: Unfixable negative amount ("-250.00")
    csv_content = (
        "id,phone,order_date,amount\n"
        "1,9811200001,2026-10-27,150.00\n"
        "2,98112-abc01,2026-10-27,200.00\n"
        "3,9811200003,27/10/2026,300.00\n"
        "4,9811200004,2026-10-27,-250.00\n"
    )

    csv_file = io.BytesIO(csv_content.encode("utf-8"))
    ingest_res = client.post(
        "/api/v1/ingest",
        data={"contract_id": contract_id},
        files={"file": ("autofix_sample.csv", csv_file, "text/csv")},
    )
    assert ingest_res.status_code == 201
    job_id = ingest_res.json()["job_id"]
    assert ingest_res.json()["valid_rows"] == 1
    assert ingest_res.json()["quarantined_rows"] == 3

    # Trigger bulk auto-fix
    autofix_res = client.post(f"/api/v1/jobs/{job_id}/auto-fix")
    assert autofix_res.status_code == 200, autofix_res.text
    autofix_data = autofix_res.json()
    assert autofix_data["remediated_count"] == 2
    assert autofix_data["remaining_quarantined"] == 1

    # Verify updated job status and counters
    job_check = client.get(f"/api/v1/jobs/{job_id}")
    assert job_check.status_code == 200
    job_info = job_check.json()
    assert job_info["valid_rows"] == 3
    assert job_info["quarantined_rows"] == 1

    # Verify quarantine records in DB
    records_res = client.get(f"/api/v1/jobs/{job_id}/quarantine")
    records = records_res.json()
    rec_by_row = {r["row_index"]: r for r in records}

    # Row 2 (phone) and Row 3 (date) should now be resolved
    assert rec_by_row[2]["is_resolved"] is True
    assert rec_by_row[2]["resolved_value"]["phone"] == "9811200001"

    assert rec_by_row[3]["is_resolved"] is True
    assert rec_by_row[3]["resolved_value"]["order_date"] == "2026-10-27"

    # Row 4 (negative amount) must remain unfixable in quarantine
    assert rec_by_row[4]["is_resolved"] is False


def test_clean_export_formats_zero_leakage(client: TestClient):
    """TC-EXP-01 & TC-EXP-02: Export clean dataset in CSV and SQL format with zero DLQ leakage."""
    # Ingest dataset with 2 rows: 1 valid, 1 broken (unremediated)
    csv_content = (
        "id,name,phone\n"
        "1,Alice,9811200001\n"
        "2,BrokenRow,INVALID_PHONE\n"
    )
    contract_res = client.post(
        "/api/v1/schemas",
        json={
            "name": "Export Test Contract",
            "version": "v1.0",
            "rules_json": {
                "columns": {
                    "phone": {"type": "string", "regex": r"^\d{10}$"}
                }
            },
        },
    )
    contract_id = contract_res.json()["contract_id"]

    ingest_res = client.post(
        "/api/v1/ingest",
        data={"contract_id": contract_id},
        files={"file": ("export_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    job_id = ingest_res.json()["job_id"]
    assert ingest_res.json()["valid_rows"] == 1
    assert ingest_res.json()["quarantined_rows"] == 1

    # 1. Export as CSV (TC-EXP-01)
    csv_export_res = client.get(f"/api/v1/jobs/{job_id}/export?format=csv")
    assert csv_export_res.status_code == 200, csv_export_res.text
    csv_text = csv_export_res.text
    assert "Alice" in csv_text
    assert "9811200001" in csv_text
    # ZERO LEAKAGE ASSERTION: Broken row must NEVER appear in export
    assert "BrokenRow" not in csv_text
    assert "INVALID_PHONE" not in csv_text

    # 2. Export as PostgreSQL Transaction SQL (TC-EXP-02)
    sql_export_res = client.get(f"/api/v1/jobs/{job_id}/export?format=sql")
    assert sql_export_res.status_code == 200, sql_export_res.text
    sql_text = sql_export_res.text
    assert "BEGIN;" in sql_text
    assert "INSERT INTO" in sql_text
    assert "Alice" in sql_text
    assert "COMMIT;" in sql_text
    # ZERO LEAKAGE ASSERTION: Broken row must NEVER appear in SQL insert
    assert "BrokenRow" not in sql_text
    assert "INVALID_PHONE" not in sql_text

    # 3. Export as Newline-Delimited JSON (JSONL) (TC-EXP-03)
    json_export_res = client.get(f"/api/v1/jobs/{job_id}/export?format=json")
    assert json_export_res.status_code == 200, json_export_res.text
    json_lines = [json.loads(line) for line in json_export_res.text.strip().split("\n") if line]
    assert len(json_lines) == 1
    assert json_lines[0]["name"] == "Alice"
    assert json_lines[0]["phone"] == "9811200001"
    # ZERO LEAKAGE ASSERTION: Broken row must NEVER appear in JSONL
    assert "BrokenRow" not in json_export_res.text
    assert "INVALID_PHONE" not in json_export_res.text


def test_webhook_dummy_sandbox_user_id(client: TestClient):
    """TC-WHK-02: Ensure dummy sandbox user_id '00000000-0000-0000-0000-000000000000' converts to NULL without FK violation."""
    sink_res = client.post(
        "/api/v1/webhooks",
        json={
            "user_id": "00000000-0000-0000-0000-000000000000",
            "target_url": "https://api.sandbox-demo.com/sink",
            "retry_policy": "EXPONENTIAL_5X",
            "dlq_enabled": True,
        },
    )
    assert sink_res.status_code == 201, sink_res.text
    sink_data = sink_res.json()
    assert sink_data["user_id"] is None
    assert sink_data["hmac_secret"].startswith("whsec_")


def test_webhook_hmac_sha256_signature_dispatch(client: TestClient, db_session: Session):
    """TC-WHK-01: Provision webhook sink and dispatch HMAC-SHA256 signed event payload."""
    # 1. Create a user first for FK constraint
    user_res = client.post(
        "/api/v1/auth/signup",
        json={"email": "webhook_tester@ingestos.io", "password": "SecurePassword123#!"},
    )
    assert user_res.status_code == 201
    user_id = user_res.json()["user_id"]

    # 2. Create Webhook Sink
    sink_res = client.post(
        "/api/v1/webhooks",
        json={
            "user_id": user_id,
            "target_url": "https://api.external-sink.com/ingest-webhook",
            "retry_policy": "EXPONENTIAL_5X",
            "dlq_enabled": True,
        },
    )
    assert sink_res.status_code == 201, sink_res.text
    sink_data = sink_res.json()
    sink_id = sink_data["sink_id"]
    hmac_secret = sink_data["hmac_secret"]
    assert hmac_secret.startswith("whsec_")

    # 3. Ingest a job
    csv_content = "id,name\n101,WebhookPayloadItem\n"
    ingest_res = client.post(
        "/api/v1/ingest",
        files={"file": ("webhook_job.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    job_id = ingest_res.json()["job_id"]

    # 4. Dispatch Webhook
    dispatch_res = client.post(
        f"/api/v1/jobs/{job_id}/dispatch-webhook",
        json={"sink_id": sink_id},
    )
    assert dispatch_res.status_code == 200, dispatch_res.text
    dispatch_info = dispatch_res.json()
    assert dispatch_info["status"] == "DISPATCHED"
    signature_header = dispatch_info["signature"]
    assert signature_header.startswith("sha256=")

    # 5. Cryptographic signature verification using security module
    raw_payload_bytes = dispatch_info["payload_raw"].encode("utf-8")
    is_valid = verify_webhook_signature(
        payload=raw_payload_bytes,
        secret=hmac_secret,
        signature=signature_header,
    )
    assert is_valid is True, "Webhook signature verification failed!"


def test_zero_retention_ttl_purge(client: TestClient, db_session: Session):
    """TC-SEC-02: Zero-retention TTL purge engine wipes expired quarantine records from DB."""
    # 1. Create a job with 2 quarantined rows
    csv_content = "phone\nBAD_PHONE_1\nBAD_PHONE_2\n"
    contract_res = client.post(
        "/api/v1/schemas",
        json={
            "name": "TTL Contract",
            "rules_json": {"columns": {"phone": {"type": "string", "regex": r"^\d{10}$"}}},
        },
    )
    contract_id = contract_res.json()["contract_id"]

    ingest_res = client.post(
        "/api/v1/ingest",
        data={"contract_id": contract_id},
        files={"file": ("ttl_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    job_id = ingest_res.json()["job_id"]

    import uuid
    job_uuid = uuid.UUID(job_id)

    # Verify quarantine records exist in DB initially
    records = db_session.execute(
        select(QuarantineRecord).where(QuarantineRecord.job_id == job_uuid)
    ).scalars().all()
    assert len(records) == 2

    # 2. Trigger explicit TTL Purge on this job
    purge_res = client.post(f"/api/v1/jobs/{job_id}/purge")
    assert purge_res.status_code == 200, purge_res.text
    purge_data = purge_res.json()
    assert purge_data["purged_records_count"] == 2
    assert purge_data["status"] == "PURGED"

    # 3. Assert zero-retention: quarantine records are deleted from DB and job status is PURGED
    records_after = db_session.execute(
        select(QuarantineRecord).where(QuarantineRecord.job_id == job_uuid)
    ).scalars().all()
    assert len(records_after) == 0

    job_after = db_session.execute(
        select(IngestionJob).where(IngestionJob.job_id == job_uuid)
    ).scalar_one_or_none()
    assert job_after is not None
    assert job_after.status == "PURGED"
    assert job_after.quarantined_rows == 0
