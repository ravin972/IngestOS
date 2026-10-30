"""Test Suite for Auto-Discovery & Schema Inference Endpoint (POST /api/v1/schemas/infer)."""

import io
from fastapi.testclient import TestClient


def test_infer_schema_from_csv(client: TestClient):
    """Verify that a CSV stream correctly infers column types, nullability, and regex rules."""
    csv_content = (
        b"order_id,customer_name,contact_phone,total_amount,order_date,notes\n"
        b"1001,Acme Industrial,9876543210,1250.50,2026-10-28,Urgent delivery\n"
        b"1002,Global Logistics,9123456780,450.00,2026-10-29,\n"
        b"1003,Vertex Solutions,9988776655,890.25,2026-10-30,Follow up\n"
    )

    files = {"file": ("orders_batch.csv", io.BytesIO(csv_content), "text/csv")}
    response = client.post("/api/v1/schemas/infer", files=files)

    assert response.status_code == 200, f"Inference failed: {response.text}"
    data = response.json()

    assert data["filename"] == "orders_batch.csv"
    assert data["row_count"] == 3
    assert "fields" in data
    assert "rules_json" in data

    fields_by_name = {f["field_name"]: f for f in data["fields"]}

    # Verify column types
    assert fields_by_name["order_id"]["data_type"] == "integer"
    assert fields_by_name["order_id"]["nullable"] is False

    assert fields_by_name["customer_name"]["data_type"] == "string"
    assert fields_by_name["customer_name"]["nullable"] is False

    assert fields_by_name["contact_phone"]["data_type"] == "string"
    assert fields_by_name["contact_phone"]["regex"] == r"^\d{10}$"

    assert fields_by_name["total_amount"]["data_type"] == "float"
    assert fields_by_name["total_amount"]["min"] == 0.0

    assert fields_by_name["order_date"]["data_type"] == "datetime"
    assert fields_by_name["order_date"]["regex"] == r"^\d{4}-\d{2}-\d{2}$"

    assert fields_by_name["notes"]["nullable"] is True

    # Verify compiled rules_json format matches IngestOS AST
    columns_rule = data["rules_json"]["columns"]
    assert "order_id" in columns_rule
    assert columns_rule["order_id"]["type"] == "integer"
    assert columns_rule["order_id"]["required"] is True
    assert columns_rule["contact_phone"]["regex"] == r"^\d{10}$"


def test_infer_schema_from_json(client: TestClient):
    """Verify that a JSON stream correctly infers object arrays."""
    json_content = (
        b'[\n'
        b'  {"user_id": 1, "email": "alice@company.com", "active": true, "score": 92.4},\n'
        b'  {"user_id": 2, "email": "bob@enterprise.io", "active": false, "score": 88.0}\n'
        b']'
    )

    files = {"file": ("users.json", io.BytesIO(json_content), "application/json")}
    response = client.post("/api/v1/schemas/infer", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["row_count"] == 2

    fields_by_name = {f["field_name"]: f for f in data["fields"]}
    assert fields_by_name["user_id"]["data_type"] == "integer"
    assert fields_by_name["email"]["data_type"] == "string"
    assert fields_by_name["email"]["regex"] == r"^[\w\.-]+@[\w\.-]+\.\w+$"
    assert fields_by_name["active"]["data_type"] == "boolean"
    assert fields_by_name["score"]["data_type"] == "float"


def test_infer_empty_file_returns_400(client: TestClient):
    """Verify that empty uploads return 400 Bad Request."""
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    response = client.post("/api/v1/schemas/infer", files=files)
    assert response.status_code == 400
