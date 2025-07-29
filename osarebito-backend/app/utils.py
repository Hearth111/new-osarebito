from typing import Set
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

# WebSocket connection management
connections: Set[WebSocket] = set()

async def broadcast(message: dict) -> None:
    """Send a JSON message to all connected WebSocket clients."""
    dead: list[WebSocket] = []
    for ws in list(connections):
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connections.discard(ws)

ALLOWED_ROLES = {"推され人", "推し人", "お仕事人"}
ROLE_REPORT_POINTS = {"推され人": 1, "推し人": 1, "お仕事人": 1}
REPORT_CATEGORIES = ["スパム・広告", "迷惑行為", "不適切なコンテンツ", "その他"]
TUTORIAL_TASKS = ["プロフィールを設定する", "最初の投稿をしてみよう", "他のユーザーをフォローしよう"]
FIRST_POST_ACHIEVEMENT = "初投稿"
FIRST_COMMENT_ACHIEVEMENT = "初コメント"

def add_achievement(user: dict, name: str) -> None:
    """Add an achievement to user if not already unlocked."""
    ach = user.setdefault("achievements", [])
    if name not in ach:
        ach.append(name)


def remove_sensitive_fields(user: dict) -> dict:
    u = user.copy()
    u.pop("password", None)
    u.pop("report_points", None)
    u.pop("semiban_until", None)
    return u


def is_semibanned(user: dict) -> bool:
    until = user.get("semiban_until")
    if until:
        try:
            return datetime.fromisoformat(until) > datetime.utcnow()
        except Exception:
            return False
    return False
