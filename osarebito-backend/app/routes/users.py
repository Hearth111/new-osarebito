from fastapi import APIRouter, HTTPException
from datetime import datetime
from ..models import (
    User,
    LoginInput,
    ProfileUpdate,
    CollabProfileUpdate,
    CreatorProfileUpdate,
    FollowRequest,
    InterestRequest,
    BlockRequest,
)
from ..crud import (
    load_users,
    save_users,
    load_posts,
    save_posts,
)
from ..utils import (
    ALLOWED_ROLES,
    remove_sensitive_fields,
)

router = APIRouter()


@router.post("/register")
def register(user: User):
    if user.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    users = load_users()
    if any(u["user_id"] == user.user_id for u in users):
        raise HTTPException(status_code=400, detail="User ID already exists")
    users.append(
        {
            **user.dict(),
            "created_at": datetime.utcnow().isoformat(),
            "profile": {},
            "collab_profile": {},
            "creator_profile": {},
            "followers": [],
            "following": [],
            "interested": [],
            "bookmarks": [],
            "notifications": [],
            "achievements": [],
            "report_points": 0,
            "semiban_until": None,
            "blocks": [],
        }
    )
    save_users(users)
    return {"message": "registered"}


@router.post("/login")
def login(data: LoginInput):
    users = load_users()
    for u in users:
        if u["user_id"] == data.user_id and u["password"] == data.password:
            return {"message": "logged in"}
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.get("/users/{user_id}")
def get_user(user_id: str, viewer_id: str | None = None):
    users = load_users()
    for u in users:
        if u["user_id"] == user_id:
            result = remove_sensitive_fields(u)
            profile = result.get("profile", {})
            vis = profile.get("visibility", "public")
            if viewer_id != user_id:
                if vis == "private" or (
                    vis == "followers" and viewer_id not in u.get("followers", [])
                ):
                    result["profile"] = {}
            return result
    raise HTTPException(status_code=404, detail="User not found")


@router.post("/users/{target_id}/follow")
def follow_user(target_id: str, data: FollowRequest):
    if target_id == data.follower_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    users = load_users()
    target = next((u for u in users if u["user_id"] == target_id), None)
    follower = next((u for u in users if u["user_id"] == data.follower_id), None)
    if not target or not follower:
        raise HTTPException(status_code=404, detail="User not found")
    if target_id in follower.get("blocks", []) or data.follower_id in target.get("blocks", []):
        raise HTTPException(status_code=403, detail="Blocked")
    followers = target.setdefault("followers", [])
    following = follower.setdefault("following", [])
    new = False
    if data.follower_id not in followers:
        followers.append(data.follower_id)
        new = True
    if target_id not in following:
        following.append(target_id)
    if new:
        notes = target.setdefault("notifications", [])
        notes.append(
            {
                "type": "follow",
                "from": data.follower_id,
                "created_at": datetime.utcnow().isoformat(),
            }
        )
    save_users(users)
    return {"message": "followed"}


@router.post("/users/{target_id}/unfollow")
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


@router.post("/users/{target_id}/interest")
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


@router.post("/users/{target_id}/uninterest")
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


@router.post("/users/{target_id}/block")
def block_user(target_id: str, req: BlockRequest):
    if target_id == req.user_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    users = load_users()
    target = next((u for u in users if u["user_id"] == target_id), None)
    me = next((u for u in users if u["user_id"] == req.user_id), None)
    if not target or not me:
        raise HTTPException(status_code=404, detail="User not found")
    blocks = me.setdefault("blocks", [])
    if target_id not in blocks:
        blocks.append(target_id)
        if target_id in me.get("following", []):
            me["following"].remove(target_id)
        if req.user_id in target.get("followers", []):
            target["followers"].remove(req.user_id)
        save_users(users)
    return {"message": "blocked"}


@router.post("/users/{target_id}/unblock")
def unblock_user(target_id: str, req: BlockRequest):
    users = load_users()
    me = next((u for u in users if u["user_id"] == req.user_id), None)
    if not me:
        raise HTTPException(status_code=404, detail="User not found")
    blocks = me.setdefault("blocks", [])
    if target_id in blocks:
        blocks.remove(target_id)
        save_users(users)
    return {"message": "unblocked"}


@router.get("/users/{user_id}/mutual_followers")
def mutual_followers(user_id: str, my_id: str):
    users = load_users()
    target = next((u for u in users if u["user_id"] == user_id), None)
    me = next((u for u in users if u["user_id"] == my_id), None)
    if not target or not me:
        raise HTTPException(status_code=404, detail="User not found")
    mutual = set(target.get("followers", [])) & set(me.get("following", []))
    result = [remove_sensitive_fields(u) for u in users if u["user_id"] in mutual]
    return result


@router.get("/users/{user_id}/followers")
def list_followers(user_id: str):
    users = load_users()
    target = next((u for u in users if u["user_id"] == user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    follower_ids = target.get("followers", [])
    result = [remove_sensitive_fields(u) for u in users if u["user_id"] in follower_ids]
    return result


@router.get("/users/{user_id}/following")
def list_following(user_id: str):
    users = load_users()
    target = next((u for u in users if u["user_id"] == user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    following_ids = target.get("following", [])
    result = [remove_sensitive_fields(u) for u in users if u["user_id"] in following_ids]
    return result


@router.get("/users/{user_id}/bookmarks")
def list_bookmarks(user_id: str):
    users = load_users()
    user = next((u for u in users if u["user_id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    posts = load_posts()
    ids = set(user.get("bookmarks", []))
    result = []
    for p in posts:
        if p["id"] in ids:
            item = p.copy()
            if item.get("anonymous"):
                item["author_id"] = "匿名"
            result.append(item)
    result.sort(key=lambda x: x["id"], reverse=True)
    return {"posts": result}


@router.get("/users/search")
def search_users(query: str):
    users = load_users()
    query_lower = query.lower()
    result = [
        remove_sensitive_fields(u)
        for u in users
        if query_lower in u["user_id"].lower() or query_lower in u["username"].lower()
    ]
    return result


@router.put("/users/{user_id}/profile")
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


@router.get("/users/{user_id}/collab_profile")
def get_collab_profile(user_id: str):
    users = load_users()
    for u in users:
        if u["user_id"] == user_id:
            return u.get("collab_profile", {})
    raise HTTPException(status_code=404, detail="User not found")


@router.put("/users/{user_id}/collab_profile")
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


@router.get("/users/{user_id}/creator_profile")
def get_creator_profile(user_id: str, viewer_id: str | None = None):
    users = load_users()
    for u in users:
        if u["user_id"] == user_id:
            prof = u.get("creator_profile", {})
            vis = prof.get("visibility", "public")
            if viewer_id != user_id and vis != "public":
                return {}
            return prof
    raise HTTPException(status_code=404, detail="User not found")


@router.put("/users/{user_id}/creator_profile")
def update_creator_profile(user_id: str, profile: CreatorProfileUpdate):
    users = load_users()
    for u in users:
        if u["user_id"] == user_id:
            prof = u.get("creator_profile", {})
            data = profile.dict(exclude_unset=True)
            prof.update({k: v for k, v in data.items() if v is not None})
            u["creator_profile"] = prof
            save_users(users)
            return {"message": "updated"}
    raise HTTPException(status_code=404, detail="User not found")


@router.get("/creator_profiles/search")
def search_creator_profiles(keyword: str):
    users = load_users()
    kw = keyword.lower()
    result = []
    for u in users:
        prof = u.get("creator_profile", {})
        if prof.get("visibility", "public") != "public":
            continue
        texts = " ".join(prof.get("skills", []) or []) + " " + " ".join(prof.get("equipment", []) or []) + " " + " ".join(prof.get("software", []) or [])
        if kw in texts.lower():
            item = remove_sensitive_fields(u)
            item["creator_profile"] = prof
            result.append(item)
    return result
