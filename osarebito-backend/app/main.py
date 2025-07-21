from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
import json
from pathlib import Path

app = FastAPI()

DATA_FILE = Path(__file__).resolve().parent / "users.json"

class User(BaseModel):
    email: EmailStr
    user_id: str
    username: str
    password: str


def load_users():
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_users(users):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)


@app.post("/register")
def register(user: User):
    users = load_users()
    if any(u["user_id"] == user.user_id for u in users):
        raise HTTPException(status_code=400, detail="User ID already exists")
    users.append(user.dict())
    save_users(users)
    return {"message": "registered"}
