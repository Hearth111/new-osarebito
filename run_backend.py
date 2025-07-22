import subprocess
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "osarebito-backend"
BACKEND_UVICORN = BACKEND_DIR / "venv" / "bin" / "uvicorn"


def main() -> None:
    """Start the FastAPI backend with Uvicorn."""
    if BACKEND_UVICORN.exists():
        cmd = [str(BACKEND_UVICORN), "app.main:app", "--reload"]
    else:
        cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--reload"]
    subprocess.run(cmd, cwd=BACKEND_DIR)


if __name__ == "__main__":
    main()
