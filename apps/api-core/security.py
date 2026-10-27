"""Security and Cryptography Primitives for IngestOS API Core.

Features:
- Argon2id password hashing and verification
- Password entropy & complexity validation (>= 12 chars, special symbol, uppercase, digit)
- JWT Access and Refresh token generation & verification
- HMAC-SHA256 signature generator for Webhook sinks
- Sliding-window in-memory rate limiter for brute-force attack mitigation
"""

import hashlib
import hmac
import os
import re
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

import jwt
from argon2 import PasswordHasher, exceptions as argon2_exceptions
from fastapi import HTTPException, status

# Argon2id password hasher (RFC 9106 compliant)
ph = PasswordHasher(
    time_cost=2,
    memory_cost=19456,
    parallelism=1,
    hash_len=32,
)

# JWT configuration
JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "ingestos_deterministic_super_secret_signing_key_at_least_64_bytes_long_2026",
)
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    """Hash password using Argon2id."""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (argon2_exceptions.VerifyMismatchError, argon2_exceptions.VerificationError, argon2_exceptions.InvalidHashError):
        return False


def validate_password_entropy(password: str) -> None:
    r"""Ensure password meets strict IngestOS enterprise security requirements.

    Requirements:
    - Minimum length >= 12 characters
    - At least one special symbol (!@#$%^&*()_+-=[]{}|;:,.<>?/~`"'\)
    - At least one uppercase letter
    - At least one digit
    """
    if len(password) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 12 characters long.",
        )

    # Check for special characters
    special_char_pattern = re.compile(r"[\W_]")
    if not special_char_pattern.search(password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special symbol (e.g. !@#$%^&*).",
        )

    # Check for uppercase character
    if not any(c.isupper() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter.",
        )

    # Check for digit
    if not any(c.isdigit() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one numeric digit.",
        )


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create signed JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


def generate_hmac_secret() -> str:
    """Generate cryptographically secure HMAC secret for Webhook sinks."""
    return f"whsec_{secrets.token_hex(24)}"


def sign_webhook_payload(payload: str | bytes, secret: str) -> str:
    """Compute HMAC-SHA256 signature for webhook outbound payloads."""
    if isinstance(payload, str):
        payload_bytes = payload.encode("utf-8")
    else:
        payload_bytes = payload

    secret_bytes = secret.encode("utf-8")
    signature = hmac.new(secret_bytes, payload_bytes, hashlib.sha256).hexdigest()
    return f"sha256={signature}"


def verify_webhook_signature(payload: str | bytes, secret: str, signature: str) -> bool:
    """Verify that an HMAC-SHA256 signature matches expected digest."""
    expected = sign_webhook_payload(payload, secret)
    return hmac.compare_digest(expected, signature)


class SlidingWindowRateLimiter:
    """In-memory sliding window rate limiter for brute force protection.

    Tracks failed authentication attempts. Limits to 5 failed attempts per 60-second window.
    """

    def __init__(self, max_attempts: int = 5, window_seconds: int = 60):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._attempts: Dict[str, List[float]] = {}

    def is_rate_limited(self, key: str) -> bool:
        """Check if key has reached or exceeded max failed attempts within window."""
        now = time.time()
        window_start = now - self.window_seconds
        attempts = [t for t in self._attempts.get(key, []) if t > window_start]
        self._attempts[key] = attempts
        return len(attempts) >= self.max_attempts

    def record_failure(self, key: str) -> None:
        """Record a failed attempt."""
        now = time.time()
        window_start = now - self.window_seconds
        attempts = [t for t in self._attempts.get(key, []) if t > window_start]
        attempts.append(now)
        self._attempts[key] = attempts

    def reset_key(self, key: str) -> None:
        """Reset failed attempts for a specific key upon successful login."""
        if key in self._attempts:
            del self._attempts[key]

    def reset(self) -> None:
        """Reset all rate limiter state (useful for test isolation)."""
        self._attempts.clear()


# Global rate limiter instance
rate_limiter = SlidingWindowRateLimiter(max_attempts=5, window_seconds=60)
