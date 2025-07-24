from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
import json
from pathlib import Path
from datetime import datetime
from collections import Counter

app = FastAPI()

DATA_FILE = Path(__file__).resolve().parent / "users.json"
POSTS_FILE = Path(__file__).resolve().parent / "posts.json"

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


def load_posts():
    if POSTS_FILE.exists():
        with open(POSTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_posts(posts):
    with open(POSTS_FILE, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)


@app.post("/register")
def register(user: User):
    if user.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    users = load_users()
    if any(u["user_id"] == user.user_id for u in users):
        raise HTTPException(status_code=400, detail="User ID already exists")
    users.append({
        **user.dict(),
        "profile": {},
        "collab_profile": {},
        "followers": [],
        "following": [],
        "interested": [],
    })
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


class CollabProfile(BaseModel):
    interests: str | None = None
    looking_for: str | None = None
    availability: str | None = None
    visibility: str = "private"


class CollabProfileUpdate(BaseModel):
    interests: str | None = None
    looking_for: str | None = None
    availability: str | None = None
    visibility: str | None = None


class Post(BaseModel):
    id: int
    author_id: str
    content: str
    tags: list[str] = []
    created_at: str


class PostCreate(BaseModel):
    author_id: str
    content: str
    tags: list[str] | None = None


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


class FollowRequest(BaseModel):
    follower_id: str

class InterestRequest(BaseModel):
    user_id: str


@app.post("/users/{target_id}/follow")
def follow_user(target_id: str, data: FollowRequest):
    if target_id == data.follower_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    users = load_users()
    target = next((u for u in users if u["user_id"] == target_id), None)
    follower = next((u for u in users if u["user_id"] == data.follower_id), None)
    if not target or not follower:
        raise HTTPException(status_code=404, detail="User not found")
    followers = target.setdefault("followers", [])
    following = follower.setdefault("following", [])
    if data.follower_id not in followers:
        followers.append(data.follower_id)
    if target_id not in following:
        following.append(target_id)
    save_users(users)
    return {"message": "followed"}


@app.post("/users/{target_id}/unfollow")
def unfollow_user(target_id: str, data: FollowRequest):
    users = load_users()
    target = next((u for u in users if u["user_id"] == target_id), None)
    follower = next((u for u in users if u["user_id"] == data.follower_id), None)
    if not target or not follower:
        raise HTTPException(status_code=404, detail="User not found")
    followers = target.setdefault("followers", [])
    following = follower.setdefault("following", [])
    if data.follower_id in followers:
        followers.remove(data.follower_id)
    if target_id in following:
        following.remove(target_id)
    save_users(users)
    return {"message": "unfollowed"}


@app.post("/users/{target_id}/interest")
def add_interest(target_id: str, data: InterestRequest):
    if target_id == data.user_id:
        raise HTTPException(status_code=400, detail="Cannot interest yourself")
    users = load_users()
    target = next((u for u in users if u["user_id"] == target_id), None)
    requester = next((u for u in users if u["user_id"] == data.user_id), None)
    if not target or not requester:
        raise HTTPException(status_code=404, detail="User not found")
    lst = target.setdefault("interested", [])
    if data.user_id not in lst:
        lst.append(data.user_id)
        save_users(users)
    return {"message": "interested"}


@app.post("/users/{target_id}/uninterest")
def remove_interest(target_id: str, data: InterestRequest):
    users = load_users()
    target = next((u for u in users if u["user_id"] == target_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    lst = target.setdefault("interested", [])
    if data.user_id in lst:
        lst.remove(data.user_id)
        save_users(users)
    return {"message": "uninterested"}


@app.get("/users/{user_id}/mutual_followers")
def mutual_followers(user_id: str, my_id: str):
    users = load_users()
    target = next((u for u in users if u["user_id"] == user_id), None)
    me = next((u for u in users if u["user_id"] == my_id), None)
    if not target or not me:
        raise HTTPException(status_code=404, detail="User not found")
    mutual = set(target.get("followers", [])) & set(me.get("following", []))
    result = [remove_password(u) for u in users if u["user_id"] in mutual]
    return result


@app.get("/users/{user_id}/followers")
def list_followers(user_id: str):
    users = load_users()
    target = next((u for u in users if u["user_id"] == user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    follower_ids = target.get("followers", [])
    result = [remove_password(u) for u in users if u["user_id"] in follower_ids]
    return result


@app.get("/users/{user_id}/following")
def list_following(user_id: str):
    users = load_users()
    target = next((u for u in users if u["user_id"] == user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    following_ids = target.get("following", [])
    result = [remove_password(u) for u in users if u["user_id"] in following_ids]
    return result


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


@app.get("/users/{user_id}/collab_profile")
def get_collab_profile(user_id: str):
    users = load_users()
    for u in users:
        if u["user_id"] == user_id:
            return u.get("collab_profile", {})
    raise HTTPException(status_code=404, detail="User not found")


@app.put("/users/{user_id}/collab_profile")
def update_collab_profile(user_id: str, profile: CollabProfileUpdate):
    users = load_users()
    for u in users:
        if u["user_id"] == user_id:
            prof = u.get("collab_profile", {})
            data = profile.dict(exclude_unset=True)
            prof.update({k: v for k, v in data.items() if v is not None})
            u["collab_profile"] = prof
            save_users(users)
            return {"message": "updated"}
    raise HTTPException(status_code=404, detail="User not found")


# -------------------- Posts API --------------------


@app.post("/posts")
def create_post(post: PostCreate):
    users = load_users()
    if not any(u["user_id"] == post.author_id for u in users):
        raise HTTPException(status_code=404, detail="User not found")
    posts = load_posts()
    new_id = max([p["id"] for p in posts], default=0) + 1
    item = {
        "id": new_id,
        "author_id": post.author_id,
        "content": post.content,
        "tags": post.tags or [],
        "created_at": datetime.utcnow().isoformat(),
    }
    posts.append(item)
    save_posts(posts)
    return item


@app.get("/posts")
def list_posts(feed: str = "all", user_id: str | None = None):
    posts = load_posts()
    posts.sort(key=lambda x: x["id"], reverse=True)
    if feed == "following" and user_id:
        users = load_users()
        me = next((u for u in users if u["user_id"] == user_id), None)
        if not me:
            raise HTTPException(status_code=404, detail="User not found")
        follow = set(me.get("following", []))
        posts = [p for p in posts if p["author_id"] in follow or p["author_id"] == user_id]
    elif feed == "user" and user_id:
        posts = [p for p in posts if p["author_id"] == user_id]
    return {"posts": posts}


@app.get("/recommended_users")
def recommended_users():
    users = load_users()
    ranked = sorted(users, key=lambda u: len(u.get("followers", [])), reverse=True)
    return [remove_password(u) for u in ranked[:5]]


@app.get("/popular_tags")
def popular_tags():
    posts = load_posts()
    counter = Counter()
    for p in posts:
        for t in p.get("tags", []):
            counter[t] += 1
    return [{"name": t, "count": c} for t, c in counter.most_common(10)]
