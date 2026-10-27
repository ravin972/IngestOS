"""QA Test Suite: Authentication, Argon2id, JWT & Rate Limiting.

Test Cases:
- TC-AUT-01: Strong password >= 12 chars + special symbol succeeds, stores hashed password.
- TC-AUT-02: Weak password returns 400.
- TC-AUT-03: Valid login returns Access JWT + HttpOnly refresh cookie.
- TC-AUT-04: 6th failed attempt within 60s returns 429 Too Many Requests.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import User


def test_signup_valid_argon2(client: TestClient, db_session: Session):
    """TC-AUT-01: Strong password >= 12 chars + special symbol succeeds, stores Argon2id hash."""
    email = "architect@ingestos.io"
    password = "SuperSecretPassword123!"

    response = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": password},
    )

    assert response.status_code == 201, response.text
    data = response.json()
    assert data["email"] == email
    assert "user_id" in data
    # Invariant: Password or hash must NEVER be exposed in response body
    assert "password" not in data
    assert "password_hash" not in data

    # Verify directly in DB that password was hashed with Argon2id ($argon2id$)
    user = db_session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    assert user is not None
    assert user.password_hash.startswith("$argon2id$")
    assert user.is_active is True


def test_signup_weak_password_rejected(client: TestClient):
    """TC-AUT-02: Weak password (<12 chars or missing special char) returns 400 Bad Request."""
    email = "weakuser@ingestos.io"

    # Case 1: Less than 12 characters
    res_short = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "Short1!"},
    )
    assert res_short.status_code == 400
    assert "at least 12 characters" in res_short.json().get("detail", "").lower()

    # Case 2: 12+ chars but missing special symbol
    res_no_symbol = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "LongPasswordWithoutSpecial123"},
    )
    assert res_no_symbol.status_code == 400
    assert "special" in res_no_symbol.json().get("detail", "").lower()


def test_login_sets_httponly_cookie(client: TestClient):
    """TC-AUT-03: Valid login returns Access JWT + HttpOnly refresh cookie."""
    email = "operator@ingestos.io"
    password = "SafeIngestPassword99#!"

    # Signup first
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": password},
    )
    assert signup_res.status_code == 201

    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200
    body = login_res.json()
    assert "access_token" in body
    assert body.get("token_type") == "bearer"

    # Verify HttpOnly refresh cookie in response
    assert "refresh_token" in login_res.cookies
    # Verify cookie attributes in headers
    set_cookie_header = login_res.headers.get("set-cookie", "")
    assert "refresh_token=" in set_cookie_header
    assert "httponly" in set_cookie_header.lower()


def test_login_rate_limit_brute_force(client: TestClient):
    """TC-AUT-04: 6th failed attempt within 60s returns 429 Too Many Requests."""
    email = "target@ingestos.io"
    password = "CorrectSecretKey2026!"

    # Register user
    reg = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": password},
    )
    assert reg.status_code == 201

    # Perform 5 failed login attempts
    for attempt in range(1, 6):
        res = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "WrongPassword123!"},
        )
        assert res.status_code == 401, f"Attempt {attempt} should return 401"

    # 6th attempt within window must be rate-limited
    res_rate_limited = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPassword123!"},
    )
    assert res_rate_limited.status_code == 429
    assert "too many" in res_rate_limited.json().get("detail", "").lower()
