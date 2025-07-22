import os
import subprocess
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT / "osarebito-frontend"


def main() -> None:
    """Start the Next.js development server."""
    # Find npm (or npm.cmd on Windows) in PATH
    npm = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm:
        sys.stderr.write("npm was not found. Please install Node.js and ensure npm is available in PATH.\n")
        sys.exit(1)

    subprocess.run([npm, "run", "dev"], cwd=FRONTEND_DIR)


if __name__ == "__main__":
    main()
