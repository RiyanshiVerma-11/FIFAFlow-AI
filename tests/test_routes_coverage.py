"""Comprehensive route coverage tests for FIFAFlow AI.

Covers translation, copilot what-if, copilot chat, volunteer CRUD,
sustainability analytics, transport intelligence, navigation routing,
and edge cases (404s, bad payloads, unauthorised access).
"""

import time
import pytest
from fastapi.testclient import TestClient


class TestTranslation:
    """Tests for the multilingual translation endpoints."""

    def test_translate_text(self, client):
        """Translate a simple phrase from English to Spanish."""
        response = client.post(
            "/api/translate",
            json={
                "text": "Hello, can you help me find Gate 5 please",
                "source_lang": "en",
                "target_lang": "es",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "translated_text" in data
        assert len(data["translated_text"]) > 0

    def test_translate_text_with_pronunciation(self, client):
        """Verify pronunciation field is present in translation response."""
        response = client.post(
            "/api/translate",
            json={
                "text": "hello",
                "source_lang": "en",
                "target_lang": "fr",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "pronunciation_text" in data


class TestCopilot:
    """Tests for the AI Operations Copilot endpoints."""

    def test_what_if_simulation(self, client, auth_headers):
        """Run a gate closure what-if simulation as organizer."""
        response = client.post(
            "/api/copilot/what-if",
            json={"scenario": "gate_3_close"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "impact_description" in data
        assert "risk_level" in data
        assert "estimated_wait_time_impact_min" in data
        assert "confidence_score" in data
        assert data["confidence_score"] > 0

    def test_copilot_chat(self, client, auth_headers):
        """Send a natural-language query to the copilot."""
        response = client.post(
            "/api/copilot/chat",
            json={"message": "What is the current crowd status at Gate 3?"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert len(data["reply"]) > 0

    def test_copilot_chat_as_fan(self, client, fan_auth_headers):
        """Verify fans can also use the copilot chat endpoint."""
        response = client.post(
            "/api/copilot/chat",
            json={"message": "Where is the nearest restroom?"},
            headers=fan_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data

    def test_get_briefing(self, client):
        """Retrieve the latest operational briefing."""
        response = client.get("/api/copilot/briefing")
        assert response.status_code == 200
        data = response.json()
        assert "briefing" in data
        assert "timestamp" in data

    def test_what_if_requires_auth(self, client):
        """Verify what-if simulation rejects unauthenticated requests."""
        response = client.post(
            "/api/copilot/what-if",
            json={"scenario": "gate_3_close"},
        )
        assert response.status_code == 401


class TestVolunteers:
    """Tests for the volunteer roster endpoints."""

    def test_get_shifts(self, client):
        """Retrieve all volunteer shifts."""
        response = client.get("/api/volunteer/shifts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_create_shift_requires_organizer(self, client, fan_auth_headers):
        """Verify non-organizer users cannot create shifts."""
        response = client.post(
            "/api/volunteer/shifts",
            json={
                "username": "volunteer1",
                "shift_start": "2026-07-17T10:00:00",
                "shift_end": "2026-07-17T18:00:00",
                "status": "active",
                "assigned_zone": "Zone C",
            },
            headers=fan_auth_headers,
        )
        assert response.status_code == 403


class TestSustainability:
    """Tests for the sustainability analytics endpoint."""

    def test_get_sustainability_logs(self, client):
        """Retrieve sustainability metrics."""
        response = client.get("/api/sustainability")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify structure
        first = data[0]
        assert "energy_kwh" in first
        assert "water_liters" in first
        assert "waste_kg" in first
        assert "carbon_kg" in first
        assert "ai_recommendation" in first


class TestTransport:
    """Tests for the transportation intelligence endpoint."""

    def test_get_transport_status(self, client):
        """Retrieve transport status including parking, shuttles, and metro."""
        response = client.get("/api/transport/status")
        assert response.status_code == 200
        data = response.json()
        assert "parking" in data
        assert "shuttles" in data
        assert "metro" in data
        assert "predictions" in data
        assert len(data["parking"]) > 0
        assert len(data["shuttles"]) > 0


class TestNavigation:
    """Tests for the navigation routing endpoint."""

    def test_route_standard(self, client):
        """Calculate a standard route between two points."""
        response = client.post(
            "/api/navigation/route",
            json={
                "start_lat": 34.0522,
                "start_lng": -118.2437,
                "end_lat": 34.0548,
                "end_lng": -118.2452,
                "require_accessible": False,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["path"]) > 0
        assert data["distance_meters"] > 0

    def test_route_accessible(self, client):
        """Calculate an accessible route avoiding stairs."""
        response = client.post(
            "/api/navigation/route",
            json={
                "start_lat": 34.0522,
                "start_lng": -118.2437,
                "end_lat": 34.0558,
                "end_lng": -118.2462,
                "require_accessible": True,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["accessibility_flag"] is True
        assert len(data["path"]) > 0


class TestEdgeCases:
    """Edge case and error handling tests."""

    def test_invalid_incident_missing_description(self, client, auth_headers):
        """Submitting an incident with a too-short description should fail validation."""
        response = client.post(
            "/api/incidents",
            json={
                "type": "medical",
                "severity": "High",
                "description": "short",
                "location_json": {"lat": 34.05, "lng": -118.24},
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_invalid_incident_bad_severity(self, client, auth_headers):
        """Submitting an incident with invalid severity should fail validation."""
        response = client.post(
            "/api/incidents",
            json={
                "type": "medical",
                "severity": "EXTREME",
                "description": "A spectator has collapsed near Gate 1 entrance lane.",
                "location_json": {"lat": 34.05, "lng": -118.24},
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_invalid_incident_bad_type(self, client, auth_headers):
        """Submitting an incident with invalid type should fail validation."""
        response = client.post(
            "/api/incidents",
            json={
                "type": "earthquake",
                "severity": "High",
                "description": "A spectator has collapsed near Gate 1 entrance lane.",
                "location_json": {"lat": 34.05, "lng": -118.24},
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_register_short_password(self, client):
        """Registration with a password shorter than 8 characters should fail."""
        unique = int(time.time())
        response = client.post(
            "/api/auth/register",
            json={
                "username": f"test_short_{unique}",
                "email": f"short_{unique}@test.com",
                "password": "abc",
                "role": "fan",
            },
        )
        assert response.status_code == 422

    def test_register_invalid_role(self, client):
        """Registration with an invalid role should fail validation."""
        unique = int(time.time())
        response = client.post(
            "/api/auth/register",
            json={
                "username": f"test_role_{unique}",
                "email": f"role_{unique}@test.com",
                "password": "validpassword123",
                "role": "superadmin",
            },
        )
        assert response.status_code == 422

    def test_login_wrong_password(self, client):
        """Login with incorrect password should return 401."""
        response = client.post(
            "/api/auth/login",
            data={"username": "organizer", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    def test_protected_endpoint_no_token(self, client):
        """Accessing a protected endpoint without token should return 401."""
        response = client.get("/api/metrics")
        assert response.status_code == 401

    def test_health_endpoint(self, client):
        """Health check should return system status."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data
        assert "redis" in data
        assert "timestamp" in data

    def test_twin_node_not_found(self, client, auth_headers):
        """Updating a non-existent node should return 404."""
        response = client.put(
            "/api/twin/nodes/99999",
            json={
                "type": "gate",
                "name": "Ghost Gate",
                "location_json": {"lat": 0, "lng": 0},
                "occupancy": 50,
                "status": "active",
                "queue_length_minutes": 5,
                "capacity_limit": 100,
            },
            headers=auth_headers,
        )
        assert response.status_code == 404
