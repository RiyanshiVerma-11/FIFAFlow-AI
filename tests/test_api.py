import time
import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import get_db


def test_api_auth_register(client):
    # Register a new volunteer account with isolated credentials
    unique_suffix = int(time.time())
    username = f"testapi_vol_{unique_suffix}"
    email = f"testapi_{unique_suffix}@fifaflow.com"
    response = client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "api_password_123",
            "role": "volunteer"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == username
    assert data["email"] == email
    assert data["role"] == "volunteer"

def test_api_auth_login(client):
    # Authenticate with credentials
    response = client.post(
        "/api/auth/login",
        data={
            "username": "organizer",
            "password": "organizer123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "organizer"
    assert data["token_type"] == "bearer"

def test_api_get_twin_nodes(client):
    # Retrieve stadium nodes list
    response = client.get("/api/twin/nodes")
    assert response.status_code == 200
    nodes = response.json()
    assert len(nodes) > 0
    # Confirm Gate 3 and Concessions are present
    node_names = [n["name"] for n in nodes]
    assert any("Gate 1" in name for name in node_names)
    assert any("Concessions" in name for name in node_names)

def test_api_navigation_route_accessible(client):
    # Optimize a path from Gate 1 to Restrooms North
    response = client.post(
        "/api/navigation/route",
        json={
            "start_lat": 34.0522,
            "start_lng": -118.2437, # Gate 1
            "end_lat": 34.0558,
            "end_lng": -118.2462, # Restrooms North
            "require_accessible": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "path" in data
    assert len(data["path"]) > 0
    assert data["distance_meters"] > 0
    assert data["accessibility_flag"] is True

def test_api_report_incident(client):
    # Simulate logging in to get token
    login_res = client.post(
        "/api/auth/login",
        data={
            "username": "organizer",
            "password": "organizer123"
        }
    )
    token = login_res.json()["access_token"]
    
    # Submit incident ticket
    response = client.post(
        "/api/incidents",
        json={
            "type": "medical",
            "severity": "High",
            "description": "Spectator heat exhaustion next to Gate 1 access lanes.",
            "location_json": {"lat": 34.0522, "lng": -118.2437}
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "medical"
    assert data["severity"] == "High"
    assert "confidence_score" in data
    assert "ai_response_recommendation" in data
