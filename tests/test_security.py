from fastapi.testclient import TestClient
from app.core.security import verify_password, get_password_hash, create_access_token
from main import app


def test_password_hashing():
    pwd = "supersecretpassword"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_create_access_token():
    token = create_access_token(subject="testuser")
    assert isinstance(token, str)
    assert len(token) > 0

def test_security_headers(client):
    response = client.get("/api/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
