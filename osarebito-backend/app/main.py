from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
import json
from pathlib import Path

app = FastAPI()

DATA_FILE = Path(__file__).resolve().parent / "users.json"

ALLOWED_ROLES = {"推され人", "推し人", "お仕事人"}


class User(BaseModel):
    email: EmailStr
    user_id: str
    username: str
    password: str
    role: str


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
    if user.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    users = load_users()
    if any(u["user_id"] == user.user_id for u in users):
        raise HTTPException(status_code=400, detail="User ID already exists")
    users.append({**user.dict(), "profile": {}})
    save_users(users)
    return {"message": "registered"}


class LoginInput(BaseModel):
    user_id: str
    password: str


@app.post("/login")
def login(data: LoginInput):
    users = load_users()
    for u in users:
        if u["user_id"] == data.user_id and u["password"] == data.password:
            return {"message": "logged in"}
    raise HTTPException(status_code=401, detail="Invalid credentials")


class Profile(BaseModel):
    profile_image: str | None = None
    bio: str | None = None
    activity: str | None = None
    sns_links: dict | None = None
    visibility: str = "public"


class ProfileUpdate(BaseModel):
    profile_image: str | None = None
    bio: str | None = None
    activity: str | None = None
    sns_links: dict | None = None
    visibility: str | None = None


def remove_password(user: dict) -> dict:
    u = user.copy()
    u.pop("password", None)
    return u


@app.get("/users/{user_id}")
def get_user(user_id: str):
    users = load_users()
    for u in users:
        if u["user_id"] == user_id:
            return remove_password(u)
    raise HTTPException(status_code=404, detail="User not found")


@app.get("/users/search")
def search_users(query: str):
    users = load_users()
    query_lower = query.lower()
    result = [remove_password(u) for u in users if query_lower in u["user_id"].lower() or query_lower in u["username"].lower()]
    return result


@app.put("/users/{user_id}/profile")
def update_profile(user_id: str, profile: ProfileUpdate):
    users = load_users()
    for u in users:
        if u["user_id"] == user_id:
            prof = u.get("profile", {})
            data = profile.dict(exclude_unset=True)
            prof.update({k: v for k, v in data.items() if v is not None})
            u["profile"] = prof
            save_users(users)
            return {"message": "updated"}
    raise HTTPException(status_code=404, detail="User not found")
