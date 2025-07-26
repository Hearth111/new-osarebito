import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main() -> None:
    pgdata = Path(os.environ.get("PGDATA", ROOT / "postgres_data"))
    port = os.environ.get("POSTGRES_PORT", "5432")

    if not pgdata.exists():
        print(f"Initializing database at {pgdata}...")
        subprocess.run(["initdb", "-D", str(pgdata)], check=True)

    log_file = ROOT / "postgres.log"
    subprocess.run([
        "pg_ctl",
        "-D",
        str(pgdata),
        "-l",
        str(log_file),
        "-o",
        f"-p {port}",
        "start",
    ], check=True)


if __name__ == "__main__":
    main()
