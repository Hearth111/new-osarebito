import subprocess
from pathlib import Path
import sys
import os

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "osarebito-backend"
VENV_BIN = BACKEND_DIR / "venv" / ("Scripts" if os.name == "nt" else "bin")
BACKEND_PYTHON = VENV_BIN / ("python.exe" if os.name == "nt" else "python")
BACKEND_UVICORN = VENV_BIN / ("uvicorn.exe" if os.name == "nt" else "uvicorn")


def main() -> None:
    """Start the FastAPI backend with Uvicorn."""
    if BACKEND_PYTHON.exists():
        cmd = [str(BACKEND_PYTHON), "-m", "uvicorn", "app.main:app", "--reload"]
    elif BACKEND_UVICORN.exists():
        cmd = [str(BACKEND_UVICORN), "app.main:app", "--reload"]
    else:
        cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--reload"]
    subprocess.run(cmd, cwd=BACKEND_DIR)


if __name__ == "__main__":
    main()
