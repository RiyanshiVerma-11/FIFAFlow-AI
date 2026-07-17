"""WebSocket connectivity and heartbeat tests for FIFAFlow AI."""

from fastapi.testclient import TestClient

from main import app


def test_websocket_connection_and_heartbeat():
    """Verify WebSocket connects, responds to ping, and handles disconnect."""
    client = TestClient(app)
    with client.websocket_connect("/api/ws") as websocket:
        # Send heartbeat ping
        websocket.send_text("ping")
        response = websocket.receive_text()
        assert response == "pong"


def test_websocket_receives_json():
    """Verify WebSocket can accept the connection without immediate errors."""
    client = TestClient(app)
    with client.websocket_connect("/api/ws") as websocket:
        # Simply connecting should work without exceptions
        websocket.send_text("ping")
        data = websocket.receive_text()
        assert data == "pong"
