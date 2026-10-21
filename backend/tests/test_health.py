from fastapi.testclient import TestClient


def test_liveness_health_endpoint(client: TestClient):
    """Verifies that /health liveness probe responds with 200 and application metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "app" in data
    assert "environment" in data


def test_readiness_endpoint(client: TestClient):
    """Verifies that /ready readiness probe executes SELECT 1 and verifies DB connectivity."""
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"


def test_root_entry_endpoint(client: TestClient):
    """Verifies that the root entry point returns service telemetry and API discovery links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["api_v1"] == "/api/v1"


def test_defensive_security_headers(client: TestClient):
    """Verifies that OWASP security headers are attached to API responses."""
    response = client.get("/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
