import argparse
import subprocess
from pathlib import Path
import sys
import os

ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT / "osarebito-frontend"
BACKEND_DIR = ROOT / "osarebito-backend"
VENV_BIN = BACKEND_DIR / "venv" / ("Scripts" if os.name == "nt" else "bin")
BACKEND_PYTHON = VENV_BIN / ("python.exe" if os.name == "nt" else "python")
BACKEND_UVICORN = VENV_BIN / ("uvicorn.exe" if os.name == "nt" else "uvicorn")


def run_frontend():
    subprocess.run(["npm", "run", "dev"], cwd=FRONTEND_DIR)


def run_backend():
    if BACKEND_PYTHON.exists():
        cmd = [str(BACKEND_PYTHON), "-m", "uvicorn", "app.main:app", "--reload"]
    elif BACKEND_UVICORN.exists():
        cmd = [str(BACKEND_UVICORN), "app.main:app", "--reload"]
    else:
        cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--reload"]
    subprocess.run(cmd, cwd=BACKEND_DIR)


def run_both():
    front_proc = subprocess.Popen(["npm", "run", "dev"], cwd=FRONTEND_DIR)
    if BACKEND_PYTHON.exists():
        back_cmd = [str(BACKEND_PYTHON), "-m", "uvicorn", "app.main:app", "--reload"]
    elif BACKEND_UVICORN.exists():
        back_cmd = [str(BACKEND_UVICORN), "app.main:app", "--reload"]
    else:
        back_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--reload"]
    back_proc = subprocess.Popen(back_cmd, cwd=BACKEND_DIR)
    front_proc.wait()
    back_proc.wait()


def main():
    parser = argparse.ArgumentParser(description="Run frontend and/or backend")
    parser.add_argument(
        "target",
        choices=["frontend", "backend", "both"],
        nargs="?",
        default="both",
        help="Component to run (default: both)",
    )
    args = parser.parse_args()

    if args.target == "frontend":
        run_frontend()
    elif args.target == "backend":
        run_backend()
    else:
        run_both()


if __name__ == "__main__":
    main()
