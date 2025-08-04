import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

def test_openapi(tmp_path):
    db_file = tmp_path / "test.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_file}"
    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from app.main import app
    client = TestClient(app)
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
