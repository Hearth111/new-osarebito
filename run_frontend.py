import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT / "osarebito-frontend"


def main() -> None:
    """Start the Next.js development server."""
    cmd = ["npm", "run", "dev"]
    if os.name == "nt":
        cmd[0] = "npm.cmd"  # Ensure Windows finds npm
    subprocess.run(cmd, cwd=FRONTEND_DIR)


if __name__ == "__main__":
    main()
