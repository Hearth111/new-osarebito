import os
from sqlalchemy import (
    create_engine,
    MetaData,
    Table,
    Column,
    Integer,
    String,
    JSON,
    select,
    insert,
    delete,
    update,
)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///osarebito.db")
engine = create_engine(DATABASE_URL)
metadata = MetaData()

users_table = Table(
    "users",
    metadata,
    Column("user_id", String, primary_key=True),
    Column("data", JSON, nullable=False),
)

posts_table = Table(
    "posts",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

comments_table = Table(
    "comments",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

messages_table = Table(
    "messages",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

reports_table = Table(
    "reports",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

jobs_table = Table(
    "jobs",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

groups_table = Table(
    "groups",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

group_messages_table = Table(
    "group_messages",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

fan_posts_table = Table(
    "fan_posts",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

appeals_table = Table(
    "appeals",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

materials_table = Table(
    "materials",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

polls_table = Table(
    "polls",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

schedules_table = Table(
    "schedules",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

approval_calendars_table = Table(
    "approval_calendars",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("data", JSON, nullable=False),
)

metadata.create_all(engine)


def load_table(table):
    with engine.connect() as conn:
        return [row.data for row in conn.execute(select(table))]


def save_table(table, items, key):
    with engine.begin() as conn:
        conn.execute(delete(table))
        records = [{key: item[key], "data": item} for item in items]
        if records:
            conn.execute(insert(table), records)


def get_item(table, key_field, key_value):
    """Return a single item from a table by key or None."""
    stmt = select(table.c.data).where(table.c[key_field] == key_value)
    with engine.connect() as conn:
        row = conn.execute(stmt).fetchone()
        return row.data if row else None


def update_item(table, key_field, key_value, item):
    """Update a single item in a table."""
    stmt = update(table).where(table.c[key_field] == key_value).values(data=item)
    with engine.begin() as conn:
        conn.execute(stmt)

