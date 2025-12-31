from fastapi.testclient import TestClient
import importlib.util
from pathlib import Path

# Load the application module from src/app.py
app_path = Path(__file__).resolve().parents[1] / "src" / "app.py"
spec = importlib.util.spec_from_file_location("app_module", str(app_path))
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)
app = getattr(app_module, "app")

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Basketball" in data


def test_signup_and_unregister():
    activity = "Basketball"
    email = "testuser@example.com"

    # Ensure email is not already registered (cleanup if necessary)
    resp = client.get("/activities")
    participants = resp.json()[activity]["participants"]
    if email in participants:
        client.post(f"/activities/{activity}/unregister?email={email}")

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Verify participant present
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # Unregister
    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # Verify participant removed
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]
