"""Test Suite for Live Cryptographic Webhook Receiver & Sink Tester."""

import hashlib
import hmac
import json
from fastapi.testclient import TestClient


def test_webhook_test_dispatch_loopback(client: TestClient):
    """Verify live cryptographic test dispatch with loopback verification."""
    secret = "whsec_test_secret_99887766554433221100"
    payload = {
        "target_url": "https://sink.ingestos.dev/v1/loopback-echo",
        "secret": secret,
        "sample_rows": [
            {
                "order_id": 999,
                "customer_name": "Test Client",
                "phone": "9998887770",
                "total_amount": 500.0,
            }
        ],
    }

    response = client.post("/api/v1/webhooks/test-dispatch", json=payload)
    assert response.status_code == 200, f"Dispatch failed: {response.text}"

    data = response.json()
    assert data["status_code"] == 200
    assert data["verified"] is True
    assert data["latency_ms"] > 0
    assert data["delivery_id"].startswith("dlv_")

    # Verify signature format
    sig_header = data["signature_header"]
    assert sig_header.startswith("t=")
    assert ",v1=" in sig_header

    # Extract timestamp and signature
    parts = dict(part.split("=") for part in sig_header.split(","))
    timestamp_str = parts["t"]
    sig_hash = parts["v1"]

    # Independent mathematical verification of HMAC-SHA256
    canonical_payload = json.dumps(data["payload_preview"], separators=(",", ":"), sort_keys=True)
    expected_hash = hmac.new(
        secret.encode("utf-8"),
        f"{timestamp_str}.{canonical_payload}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    assert hmac.compare_digest(sig_hash, expected_hash), "HMAC signature mismatch"

    # Check request headers
    req_headers = data["request_headers"]
    assert req_headers["X-IngestOS-Signature"] == sig_header
    assert req_headers["X-IngestOS-Delivery-Id"] == data["delivery_id"]
    assert req_headers["Content-Type"] == "application/json"

    # Check loopback echo response
    assert data["response_body"]["sink_mode"] == "loopback_echo"
    assert data["response_body"]["verified"] is True


def test_webhook_test_dispatch_default_rows(client: TestClient):
    """Verify that omitting sample_rows falls back to high-grade clean telemetry rows."""
    secret = "whsec_default_secret_12345"
    payload = {
        "target_url": "http://localhost:8080/echo",
        "secret": secret,
    }

    response = client.post("/api/v1/webhooks/test-dispatch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status_code"] == 200
    assert data["verified"] is True
    assert len(data["payload_preview"]["records"]) >= 1

