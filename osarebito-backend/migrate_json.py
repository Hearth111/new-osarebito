import json
from pathlib import Path
from sqlalchemy import insert, delete

from app.db import (
    engine,
    users_table,
    posts_table,
    comments_table,
    messages_table,
    reports_table,
    jobs_table,
    groups_table,
    group_messages_table,
    schedules_table,
)

DATA_DIR = Path(__file__).resolve().parent / "app"
TABLES = {
    "users.json": (users_table, "user_id"),
    "posts.json": (posts_table, "id"),
    "comments.json": (comments_table, "id"),
    "messages.json": (messages_table, "id"),
    "reports.json": (reports_table, "id"),
    "jobs.json": (jobs_table, "id"),
    "groups.json": (groups_table, "id"),
    "group_messages.json": (group_messages_table, "id"),
    "schedules.json": (schedules_table, "id"),
}

def load_json(path: Path):
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        return json.load(f)

def migrate() -> None:
    with engine.begin() as conn:
        for name, (table, key) in TABLES.items():
            items = load_json(DATA_DIR / name)
            if not items:
                continue
            conn.execute(delete(table))
            conn.execute(
                insert(table),
                [{key: item.get(key), "data": item} for item in items],
            )

if __name__ == "__main__":
    migrate()
    print("Migration complete.")
