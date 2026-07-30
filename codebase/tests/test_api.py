from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_is_available():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_mock_analysis_has_valid_contract(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "mock")
    response = client.post("/api/analyze", json={"text": "Lan ch?t beta. Minh s? g?i thi?t k?. R?i ro: ch?a c? ng?n s?ch.", "question": "?i?u g? quan tr?ng?"})
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "mock"
    assert 0 <= data["confidence"] <= 1
    assert isinstance(data["evidence"], list)
