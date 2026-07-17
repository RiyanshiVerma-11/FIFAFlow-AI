"""JWT and password hashing security utilities.

Provides helpers for creating access/refresh JWT tokens (HS256),
bcrypt password hashing, and token decoding with error handling.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Union, Optional

from jose import jwt
from jose.exceptions import JWTError
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a short-lived JWT access token for the given subject."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a long-lived JWT refresh token for the given subject."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Return the bcrypt hash of the given plaintext password."""
    return pwd_context.hash(password)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token, returning the payload or empty dict on failure."""
    try:
        decoded_payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        return decoded_payload
    except JWTError:
        return {}
