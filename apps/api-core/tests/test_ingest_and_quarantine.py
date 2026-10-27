"""QA Test Suite: Ingestion Core, Polars AST Quarantine Isolation & Remediation.

Test Cases:
- test_health_check_telemetry: Verifies /health returns engine "FastAPI + Polars" and runtime "Nominal".
- test_ingest_invalid_mime_type: TC-ING-02: .exe or .pdf upload returns 400 Bad Request.
- test_polars_ast_quarantine_isolation: TC-VAL-01 & TC-VAL-02: 5-row CSV with malformed phone and negative amount.
- test_inline_cell_remediation: TC-FIX-01: PATCH /api/v1/jobs/{job_id}/rows/{record_id} fixes phone, marks is_resolved=True, increments valid_rows.
- test_sql_injection_sanitization: TC-SEC-01: SQL injection payload is safely treated as literal text.
"""

import io
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from models import IngestionJob, QuarantineRecord, User


def test_health_check_telemetry(client: TestClient):
    """Verifies /health returns engine 'FastAPI + Polars' and runtime 'Nominal'."""
    response = client.get("/health")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data.get("status") == "healthy"
    assert data.get("engine") == "FastAPI + Polars"
    assert data.get("runtime") == "Nominal"
    assert "timestamp" in data


def test_ingest_invalid_mime_type(client: TestClient):
    """TC-ING-02: .exe or .pdf upload returns 400 Bad Request."""
    # Test .exe upload
    exe_file = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00BinaryExeContent")
    res_exe = client.post(
        "/api/v1/ingest",
        files={"file": ("malware.exe", exe_file, "application/x-msdownload")},
    )
    assert res_exe.status_code == 400, res_exe.text
    assert "unsupported" in res_exe.json().get("detail", "").lower() or "csv" in res_exe.json().get("detail", "").lower()

    # Test .pdf upload
    pdf_file = io.BytesIO(b"%PDF-1.4\n%FakePDFContent")
    res_pdf = client.post(
        "/api/v1/ingest",
        files={"file": ("document.pdf", pdf_file, "application/pdf")},
    )
    assert res_pdf.status_code == 400, res_pdf.text
    assert "unsupported" in res_pdf.json().get("detail", "").lower() or "csv" in res_pdf.json().get("detail", "").lower()


def test_polars_ast_quarantine_isolation(client: TestClient, db_session: Session):
    """TC-VAL-01 & TC-VAL-02: Feed 5-row CSV with 1 malformed phone and 1 negative amount.

    Assert:
    - 3 valid rows counted in memory
    - 2 rows written to quarantine_records DLQ with exact AST violation codes
    - 60-minute expires_at TTL is set
    """
    # 1. Register a Schema Contract with AST validation rules
    contract_payload = {
        "name": "Order Ingestion Contract",
        "version": "v1.0",
        "rules_json": {
            "columns": {
                "id": {"type": "integer", "required": True},
                "name": {"type": "string", "required": True},
                "phone": {
                    "type": "string",
                    "required": True,
                    "regex": r"^\d{10}$",
                    "error_code": "ERR_PHONE_FORMAT",
                    "error_message": "Phone number must be exactly 10 digits",
                },
                "amount": {
                    "type": "float",
                    "required": True,
                    "min": 0.0,
                    "error_code": "ERR_AMOUNT_NON_NEGATIVE",
                    "error_message": "Amount must be greater than or equal to 0.0",
                },
            }
        },
    }
    contract_res = client.post("/api/v1/schemas", json=contract_payload)
    assert contract_res.status_code == 201, contract_res.text
    contract_id = contract_res.json()["contract_id"]

    # 2. Sample 5-row CSV:
    # Row 1: Valid
    # Row 2: Malformed phone (98112-abc01)
    # Row 3: Negative amount (-180.00)
    # Row 4: Valid
    # Row 5: Valid
    csv_content = (
        "id,name,phone,amount\n"
        "1,Alice,9811200001,100.50\n"
        "2,Bob,98112-abc01,250.00\n"
        "3,Charlie,9811200003,-180.00\n"
        "4,David,9811200004,75.25\n"
        "5,Eve,9811200005,320.10\n"
    )

    csv_file = io.BytesIO(csv_content.encode("utf-8"))
    ingest_res = client.post(
        "/api/v1/ingest",
        data={"contract_id": contract_id},
        files={"file": ("orders.csv", csv_file, "text/csv")},
    )
    assert ingest_res.status_code == 201, ingest_res.text
    job_data = ingest_res.json()
    job_id = job_data["job_id"]

    # Assert row counts
    assert job_data["total_rows"] == 5
    assert job_data["valid_rows"] == 3
    assert job_data["quarantined_rows"] == 2
    assert job_data["status"] == "COMPLETED"

    # Assert 60-minute expires_at TTL
    def parse_iso_utc(dt_str: str) -> datetime:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt

    job_expires_at = parse_iso_utc(job_data["expires_at"])
    now_utc = datetime.now(timezone.utc)
    delta_minutes = (job_expires_at - now_utc).total_seconds() / 60
    assert 55 <= delta_minutes <= 65, f"Expected ~60 min TTL, got {delta_minutes} min"

    # 3. Query Quarantine Records for this Job
    quarantine_res = client.get(f"/api/v1/jobs/{job_id}/quarantine")
    assert quarantine_res.status_code == 200, quarantine_res.text
    quarantine_items = quarantine_res.json()
    assert len(quarantine_items) == 2

    # Map records by row_index
    rec_by_index = {item["row_index"]: item for item in quarantine_items}
    assert 2 in rec_by_index
    assert 3 in rec_by_index

    # Verify Bob's phone format violation
    bob_rec = rec_by_index[2]
    assert bob_rec["raw_payload"]["phone"] == "98112-abc01"
    assert any(err["rule_id"] == "ERR_PHONE_FORMAT" for err in bob_rec["validation_errors"])
    bob_expires_at = parse_iso_utc(bob_rec["expires_at"])
    assert 55 <= (bob_expires_at - now_utc).total_seconds() / 60 <= 65

    # Verify Charlie's negative amount violation
    charlie_rec = rec_by_index[3]
    assert float(charlie_rec["raw_payload"]["amount"]) == -180.00
    assert any(err["rule_id"] == "ERR_AMOUNT_NON_NEGATIVE" for err in charlie_rec["validation_errors"])


def test_inline_cell_remediation(client: TestClient):
    """TC-FIX-01: PATCH /api/v1/jobs/{job_id}/rows/{record_id} with fixed phone 9811200001 marks is_resolved=True and increments valid_rows."""
    # Create schema contract
    contract_res = client.post(
        "/api/v1/schemas",
        json={
            "name": "Remediation Contract",
            "version": "v1.0",
            "rules_json": {
                "columns": {
                    "phone": {
                        "type": "string",
                        "regex": r"^\d{10}$",
                        "error_code": "ERR_PHONE_FORMAT",
                    }
                }
            },
        },
    )
    contract_id = contract_res.json()["contract_id"]

    # Ingest 1 bad row
    csv_file = io.BytesIO(b"phone\n98112-abc01\n")
    ingest_res = client.post(
        "/api/v1/ingest",
        data={"contract_id": contract_id},
        files={"file": ("fix_test.csv", csv_file, "text/csv")},
    )
    job_id = ingest_res.json()["job_id"]
    assert ingest_res.json()["valid_rows"] == 0
    assert ingest_res.json()["quarantined_rows"] == 1

    # Fetch quarantine record
    quarantine_res = client.get(f"/api/v1/jobs/{job_id}/quarantine")
    records = quarantine_res.json()
    assert len(records) == 1
    record_id = records[0]["record_id"]
    assert records[0]["is_resolved"] is False

    # Apply remediation PATCH
    patch_res = client.patch(
        f"/api/v1/jobs/{job_id}/rows/{record_id}",
        json={"field": "phone", "value": "9811200001"},
    )
    assert patch_res.status_code == 200, patch_res.text
    patched = patch_res.json()
    assert patched["is_resolved"] is True
    assert patched["resolved_value"]["phone"] == "9811200001"

    # Verify parent job valid_rows incremented
    job_check = client.get(f"/api/v1/jobs/{job_id}")
    assert job_check.status_code == 200
    assert job_check.json()["valid_rows"] == 1


def test_sql_injection_sanitization(client: TestClient, db_session: Session):
    """TC-SEC-01: Payload containing "'; DROP TABLE users; --" is safely stored/processed as literal text without DB execution."""
    # First ensure at least one user exists
    client.post(
        "/api/v1/auth/signup",
        json={"email": "sqli_canary@ingestos.io", "password": "SecurePassword123#!"},
    )

    injection_str = "'; DROP TABLE users; --"
    csv_content = f"id,name,phone\n1,{injection_str},9811200001\n"
    csv_file = io.BytesIO(csv_content.encode("utf-8"))

    # Ingest CSV with default/loose contract or strict
    ingest_res = client.post(
        "/api/v1/ingest",
        files={"file": ("sqli_test.csv", csv_file, "text/csv")},
    )
    assert ingest_res.status_code in [200, 201]

    # Verify that the users table was NOT dropped and canary user still exists
    user_check = db_session.execute(
        select(User).where(User.email == "sqli_canary@ingestos.io")
    ).scalar_one_or_none()
    assert user_check is not None
    assert user_check.email == "sqli_canary@ingestos.io"
