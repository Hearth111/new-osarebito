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


def generate_schedule_image(events: list[dict]) -> str:
    """Create a simple schedule image and return it as base64 string."""
    from PIL import Image, ImageDraw, ImageFont
    import io, base64

    events_sorted = sorted(events, key=lambda e: e.get("date", ""))
    width = 600
    height = 40 + 20 * len(events_sorted)
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    y = 10
    draw.text((10, y), "Schedule", fill="black", font=font)
    y += 30
    for ev in events_sorted:
        text = f"{ev.get('date', '')} - {ev.get('title', '')}"
        draw.text((10, y), text, fill="black", font=font)
        y += 20
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()
