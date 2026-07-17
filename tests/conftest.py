"""Shared test fixtures and path configuration for FIFAFlow AI test suite.

Configures ``sys.path`` so tests can import backend modules, and provides
a pre-configured ``TestClient`` fixture with authenticated headers for
streamlined API testing.
"""

import sys
import os

import pytest
from fastapi.testclient import TestClient

# Add the backend directory to sys.path so tests can import from it
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    """Provide a FastAPI TestClient instance for the test module."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def auth_headers(client):
    """Authenticate as the organizer and return authorisation headers."""
    response = client.post(
        "/api/auth/login",
        data={"username": "organizer", "password": "organizer123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def fan_auth_headers(client):
    """Authenticate as a fan and return authorisation headers."""
    response = client.post(
        "/api/auth/login",
        data={"username": "fan1", "password": "fan123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
