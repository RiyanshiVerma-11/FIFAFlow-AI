import pytest
from app.core.security import get_password_hash, verify_password, create_access_token, decode_token

def test_password_hashing():
    password = "secret_password_123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_generation_and_decoding():
    subject = "test_user"
    token = create_access_token(subject)
    decoded = decode_token(token)
    assert decoded["sub"] == subject
    assert decoded["type"] == "access"
