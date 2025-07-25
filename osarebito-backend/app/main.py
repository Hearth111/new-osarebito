from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from collections import Counter

from .db import (
    load_table,
    save_table,
    users_table,
    posts_table,
    comments_table,
    messages_table,
    reports_table,
    jobs_table,
    groups_table,
    group_messages_table,
)

app = FastAPI()

# WebSocket connection management
connections: set[WebSocket] = set()


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
# reporting point weight by reporter role
ROLE_REPORT_POINTS = {
    "推され人": 1,
    "推し人": 1,
    "お仕事人": 1,
}

TUTORIAL_TASKS = [
    "プロフィールを設定する",
    "最初の投稿をしてみよう",
    "他のユーザーをフォローしよう",
]

# Achievement names
FIRST_POST_ACHIEVEMENT = "初投稿"
FIRST_COMMENT_ACHIEVEMENT = "初コメント"


def add_achievement(user: dict, name: str) -> None:
    """Add an achievement to user if not already unlocked."""
    ach = user.setdefault("achievements", [])
    if name not in ach:
        ach.append(name)


class User(BaseModel):
    email: EmailStr
    user_id: str
    username: str
    password: str
    role: str


def load_users():
    return load_table(users_table)


def save_users(users):
    save_table(users_table, users, "user_id")


def load_posts():
    return load_table(posts_table)


def save_posts(posts):
    save_table(posts_table, posts, "id")


def load_comments():
    return load_table(comments_table)


def save_comments(comments):
    save_table(comments_table, comments, "id")


def load_messages():
    return load_table(messages_table)


def save_messages(messages):
    save_table(messages_table, messages, "id")


def load_reports():
    return load_table(reports_table)


def save_reports(reports):
    save_table(reports_table, reports, "id")


def load_jobs():
    return load_table(jobs_table)


def save_jobs(jobs):
    save_table(jobs_table, jobs, "id")


def load_groups():
    return load_table(groups_table)


def save_groups(groups):
    save_table(groups_table, groups, "id")


def load_group_messages():
    return load_table(group_messages_table)


def save_group_messages(messages):
    save_table(group_messages_table, messages, "id")


@app.post("/register")
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
    category: str | None = None
    anonymous: bool = False
    best_answer_id: int | None = None
    likes: list[str] = []
    retweets: list[str] = []
    created_at: str


class PostCreate(BaseModel):
    author_id: str
    content: str
    tags: list[str] | None = None
    category: str | None = None
    anonymous: bool = False


class Comment(BaseModel):
    id: int
    post_id: int
    author_id: str
    content: str
    created_at: str


class CommentCreate(BaseModel):
    author_id: str
    content: str


class Message(BaseModel):
    id: int
    sender_id: str
    receiver_id: str
    content: str
    created_at: str


class MessageCreate(BaseModel):
    sender_id: str
    receiver_id: str
    content: str


class ReportCreate(BaseModel):
    reporter_id: str
    reason: str | None = None


class JobPost(BaseModel):
    id: int
    author_id: str
    title: str
    description: str
    reward: str | None = None
    deadline: str | None = None
    created_at: str


class JobPostCreate(BaseModel):
    author_id: str
    title: str
    description: str
    reward: str | None = None
    deadline: str | None = None


class Group(BaseModel):
    id: int
    name: str
    members: list[str]


class GroupCreate(BaseModel):
    name: str
    members: list[str]


class GroupMessage(BaseModel):
    id: int
    group_id: int
    sender_id: str
    content: str
    created_at: str


class GroupMessageCreate(BaseModel):
    group_id: int
    sender_id: str
    content: str


def remove_password(user: dict) -> dict:
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


@app.get("/users/{user_id}")
def get_user(user_id: str, viewer_id: str | None = None):
    users = load_users()
    for u in users:
        if u["user_id"] == user_id:
            result = remove_password(u)
            profile = result.get("profile", {})
            vis = profile.get("visibility", "public")
            if viewer_id != user_id:
                if vis == "private" or (
                    vis == "followers" and viewer_id not in u.get("followers", [])
                ):
                    result["profile"] = {}
            return result
    raise HTTPException(status_code=404, detail="User not found")


class FollowRequest(BaseModel):
    follower_id: str


class InterestRequest(BaseModel):
    user_id: str

class BlockRequest(BaseModel):
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


@app.post("/users/{target_id}/block")
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


@app.post("/users/{target_id}/unblock")
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


@app.get("/users/{user_id}/bookmarks")
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


@app.get("/users/search")
def search_users(query: str):
    users = load_users()
    query_lower = query.lower()
    result = [
        remove_password(u)
        for u in users
        if query_lower in u["user_id"].lower() or query_lower in u["username"].lower()
    ]
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
async def create_post(post: PostCreate):
    users = load_users()
    user = next((u for u in users if u["user_id"] == post.author_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if is_semibanned(user):
        raise HTTPException(status_code=403, detail="Temporarily banned")
    posts = load_posts()
    first_post = not any(p["author_id"] == post.author_id for p in posts)
    new_id = max([p["id"] for p in posts], default=0) + 1
    item = {
        "id": new_id,
        "author_id": post.author_id,
        "content": post.content,
        "tags": post.tags or [],
        "category": post.category,
        "anonymous": post.anonymous,
        "best_answer_id": None,
        "likes": [],
        "retweets": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    posts.append(item)
    save_posts(posts)
    if first_post:
        add_achievement(user, FIRST_POST_ACHIEVEMENT)
        save_users(users)
    await broadcast({"type": "new_post", "post": item})
    return item


@app.get("/posts")
def list_posts(
    feed: str = "all", user_id: str | None = None, category: str | None = None
):
    posts = load_posts()
    posts.sort(key=lambda x: x["id"], reverse=True)
    users = load_users()
    blocked_by_me: set[str] = set()
    blocked_me: set[str] = set()
    if user_id:
        me = next((u for u in users if u["user_id"] == user_id), None)
        if me:
            blocked_by_me = set(me.get("blocks", []))
        blocked_me = {u["user_id"] for u in users if user_id in u.get("blocks", [])}
    if category:
        posts = [p for p in posts if p.get("category") == category]
    if feed == "following" and user_id:
        me = next((u for u in users if u["user_id"] == user_id), None)
        if not me:
            raise HTTPException(status_code=404, detail="User not found")
        follow = set(me.get("following", []))
        posts = [
            p for p in posts if p["author_id"] in follow or p["author_id"] == user_id
        ]
    elif feed == "user" and user_id:
        posts = [p for p in posts if p["author_id"] == user_id]
    result = []
    for p in posts:
        if user_id and (
            p["author_id"] in blocked_by_me or p["author_id"] in blocked_me
        ):
            continue
        item = p.copy()
        if item.get("anonymous"):
            item["author_id"] = "匿名"
        result.append(item)
    return {"posts": result}


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


@app.get("/trending_posts")
def trending_posts():
    posts = load_posts()
    posts.sort(
        key=lambda x: len(x.get("likes", [])) + len(x.get("retweets", [])),
        reverse=True,
    )
    result = []
    for p in posts[:10]:
        item = p.copy()
        if item.get("anonymous"):
            item["author_id"] = "匿名"
        result.append(item)
    return {"posts": result}


@app.get("/posts/by_tag")
def posts_by_tag(tag: str):
    posts = load_posts()
    result = []
    for p in posts:
        if tag in p.get("tags", []):
            item = p.copy()
            if item.get("anonymous"):
                item["author_id"] = "匿名"
            result.append(item)
    result.sort(key=lambda x: x["id"], reverse=True)
    return {"posts": result}


# -------------------- Like API --------------------


class LikeRequest(BaseModel):
    user_id: str


class RetweetRequest(BaseModel):
    user_id: str


@app.post("/posts/{post_id}/like")
async def like_post(post_id: int, data: LikeRequest):
    posts = load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    likes = post.setdefault("likes", [])
    if data.user_id not in likes:
        likes.append(data.user_id)
        save_posts(posts)
        await broadcast({"type": "like", "post_id": post_id, "likes": likes})
    return {"likes": len(likes)}


@app.post("/posts/{post_id}/unlike")
async def unlike_post(post_id: int, data: LikeRequest):
    posts = load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    likes = post.setdefault("likes", [])
    if data.user_id in likes:
        likes.remove(data.user_id)
        save_posts(posts)
        await broadcast({"type": "like", "post_id": post_id, "likes": likes})
    return {"likes": len(likes)}


@app.post("/posts/{post_id}/retweet")
async def retweet_post(post_id: int, data: RetweetRequest):
    posts = load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    retweets = post.setdefault("retweets", [])
    if data.user_id not in retweets:
        retweets.append(data.user_id)
        save_posts(posts)
        await broadcast({"type": "retweet", "post_id": post_id, "retweets": retweets})
    return {"retweets": len(retweets)}


@app.post("/posts/{post_id}/unretweet")
async def unretweet_post(post_id: int, data: RetweetRequest):
    posts = load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    retweets = post.setdefault("retweets", [])
    if data.user_id in retweets:
        retweets.remove(data.user_id)
        save_posts(posts)
        await broadcast({"type": "retweet", "post_id": post_id, "retweets": retweets})
    return {"retweets": len(retweets)}


# -------------------- Bookmark API --------------------


class BookmarkRequest(BaseModel):
    user_id: str


@app.post("/posts/{post_id}/bookmark")
def bookmark_post(post_id: int, data: BookmarkRequest):
    posts = load_posts()
    if not any(p["id"] == post_id for p in posts):
        raise HTTPException(status_code=404, detail="Post not found")
    users = load_users()
    user = next((u for u in users if u["user_id"] == data.user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    bookmarks = user.setdefault("bookmarks", [])
    if post_id not in bookmarks:
        bookmarks.append(post_id)
        save_users(users)
    return {"bookmarks": len(bookmarks)}


@app.post("/posts/{post_id}/unbookmark")
def unbookmark_post(post_id: int, data: BookmarkRequest):
    posts = load_posts()
    if not any(p["id"] == post_id for p in posts):
        raise HTTPException(status_code=404, detail="Post not found")
    users = load_users()
    user = next((u for u in users if u["user_id"] == data.user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    bookmarks = user.setdefault("bookmarks", [])
    if post_id in bookmarks:
        bookmarks.remove(post_id)
        save_users(users)
    return {"bookmarks": len(bookmarks)}


@app.get("/posts/{post_id}/likers")
def list_likers(post_id: int):
    posts = load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    users = load_users()
    result = [
        remove_password(u) for u in users if u["user_id"] in post.get("likes", [])
    ]
    return result


# -------------------- Comment API --------------------


@app.get("/posts/{post_id}/comments")
def list_comments(post_id: int):
    comments = load_comments()
    post_comments = [c for c in comments if c["post_id"] == post_id]
    return {"comments": post_comments}


@app.post("/posts/{post_id}/comments")
def create_comment(post_id: int, comment: CommentCreate):
    posts = load_posts()
    if not any(p["id"] == post_id for p in posts):
        raise HTTPException(status_code=404, detail="Post not found")
    users = load_users()
    user = next((u for u in users if u["user_id"] == comment.author_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if is_semibanned(user):
        raise HTTPException(status_code=403, detail="Temporarily banned")
    comments = load_comments()
    first_comment = not any(c["author_id"] == comment.author_id for c in comments)
    new_id = max([c["id"] for c in comments], default=0) + 1
    item = {
        "id": new_id,
        "post_id": post_id,
        "author_id": comment.author_id,
        "content": comment.content,
        "created_at": datetime.utcnow().isoformat(),
    }
    comments.append(item)
    save_comments(comments)
    if first_comment:
        add_achievement(user, FIRST_COMMENT_ACHIEVEMENT)
        save_users(users)
    return item


class BestAnswerRequest(BaseModel):
    comment_id: int
    user_id: str


@app.put("/posts/{post_id}/best_answer")
def set_best_answer(post_id: int, req: BestAnswerRequest):
    posts = load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != req.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    comments = load_comments()
    if not any(c["id"] == req.comment_id and c["post_id"] == post_id for c in comments):
        raise HTTPException(status_code=404, detail="Comment not found")
    if post.get("best_answer_id") == req.comment_id:
        post["best_answer_id"] = None
    else:
        post["best_answer_id"] = req.comment_id
    save_posts(posts)
    return {"best_answer_id": post["best_answer_id"]}


# -------------------- Report API --------------------


@app.post("/reports/post/{post_id}")
def report_post(post_id: int, rep: ReportCreate):
    posts = load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    users = load_users()
    reporter = next((u for u in users if u["user_id"] == rep.reporter_id), None)
    if not reporter:
        raise HTTPException(status_code=404, detail="User not found")
    reports = load_reports()
    if any(
        r["target_type"] == "post"
        and r["target_id"] == post_id
        and r["reporter_id"] == rep.reporter_id
        for r in reports
    ):
        raise HTTPException(status_code=400, detail="Already reported")
    new_id = max([r["id"] for r in reports], default=0) + 1
    item = {
        "id": new_id,
        "target_type": "post",
        "target_id": post_id,
        "reporter_id": rep.reporter_id,
        "reason": rep.reason or "",
        "created_at": datetime.utcnow().isoformat(),
    }
    reports.append(item)
    # add points
    target = next((u for u in users if u["user_id"] == post["author_id"]), None)
    if target:
        weight = ROLE_REPORT_POINTS.get(reporter.get("role"), 1)
        target["report_points"] = target.get("report_points", 0) + weight
        if target["report_points"] >= 3:
            target["semiban_until"] = (
                datetime.utcnow() + timedelta(days=7)
            ).isoformat()
            target["report_points"] = 0
    save_reports(reports)
    save_users(users)
    return {"message": "reported"}


@app.post("/reports/comment/{comment_id}")
def report_comment(comment_id: int, rep: ReportCreate):
    comments = load_comments()
    comment = next((c for c in comments if c["id"] == comment_id), None)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    users = load_users()
    reporter = next((u for u in users if u["user_id"] == rep.reporter_id), None)
    if not reporter:
        raise HTTPException(status_code=404, detail="User not found")
    reports = load_reports()
    if any(
        r["target_type"] == "comment"
        and r["target_id"] == comment_id
        and r["reporter_id"] == rep.reporter_id
        for r in reports
    ):
        raise HTTPException(status_code=400, detail="Already reported")
    new_id = max([r["id"] for r in reports], default=0) + 1
    item = {
        "id": new_id,
        "target_type": "comment",
        "target_id": comment_id,
        "reporter_id": rep.reporter_id,
        "reason": rep.reason or "",
        "created_at": datetime.utcnow().isoformat(),
    }
    reports.append(item)
    target = next((u for u in users if u["user_id"] == comment["author_id"]), None)
    if target:
        weight = ROLE_REPORT_POINTS.get(reporter.get("role"), 1)
        target["report_points"] = target.get("report_points", 0) + weight
        if target["report_points"] >= 3:
            target["semiban_until"] = (
                datetime.utcnow() + timedelta(days=7)
            ).isoformat()
            target["report_points"] = 0
    save_reports(reports)
    save_users(users)
    return {"message": "reported"}


# -------------------- Message API --------------------


@app.post("/messages")
async def send_message(msg: MessageCreate):
    users = load_users()
    sender = next((u for u in users if u["user_id"] == msg.sender_id), None)
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
    if is_semibanned(sender):
        raise HTTPException(status_code=403, detail="Temporarily banned")
    receiver = next((u for u in users if u["user_id"] == msg.receiver_id), None)
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    if msg.receiver_id in sender.get("blocks", []) or msg.sender_id in receiver.get("blocks", []):
        raise HTTPException(status_code=403, detail="Blocked")
    messages = load_messages()
    new_id = max([m["id"] for m in messages], default=0) + 1
    item = {
        "id": new_id,
        "sender_id": msg.sender_id,
        "receiver_id": msg.receiver_id,
        "content": msg.content,
        "created_at": datetime.utcnow().isoformat(),
    }
    messages.append(item)
    save_messages(messages)

    # add notification to receiver
    for u in users:
        if u["user_id"] == msg.receiver_id:
            notes = u.setdefault("notifications", [])
            notes.append(
                {
                    "type": "message",
                    "from": msg.sender_id,
                    "message_id": new_id,
                    "created_at": item["created_at"],
                }
            )
            break
    save_users(users)

    await broadcast({"type": "new_message", "message": item})
    return item


@app.get("/messages/{user_id}/with/{other_id}")
def get_messages(user_id: str, other_id: str):
    users = load_users()
    me = next((u for u in users if u["user_id"] == user_id), None)
    other = next((u for u in users if u["user_id"] == other_id), None)
    if not me or not other:
        raise HTTPException(status_code=404, detail="User not found")
    if other_id in me.get("blocks", []) or user_id in other.get("blocks", []):
        raise HTTPException(status_code=403, detail="Blocked")
    messages = load_messages()
    convo = [
        m
        for m in messages
        if (m["sender_id"] == user_id and m["receiver_id"] == other_id)
        or (m["sender_id"] == other_id and m["receiver_id"] == user_id)
    ]
    convo.sort(key=lambda x: x["id"])
    return {"messages": convo}


@app.get("/users/{user_id}/notifications")
def get_notifications(user_id: str):
    users = load_users()
    user = next((u for u in users if u["user_id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"notifications": user.get("notifications", [])}


@app.get("/users/{user_id}/achievements")
def get_achievements(user_id: str):
    users = load_users()
    user = next((u for u in users if u["user_id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"achievements": user.get("achievements", [])}


@app.get("/users/{user_id}/tutorial_tasks")
def tutorial_tasks(user_id: str):
    users = load_users()
    user = next((u for u in users if u["user_id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    created_at = user.get("created_at")
    if not created_at:
        return {"tasks": []}
    try:
        created = datetime.fromisoformat(created_at)
    except Exception:
        return {"tasks": []}
    if datetime.utcnow() - created <= timedelta(days=7):
        return {"tasks": TUTORIAL_TASKS}
    return {"tasks": []}


# -------------------- Group Chat API --------------------


@app.post("/groups")
def create_group(group: GroupCreate):
    users = load_users()
    for mid in group.members:
        if not any(u["user_id"] == mid for u in users):
            raise HTTPException(status_code=404, detail="Member not found")
    groups = load_groups()
    new_id = max([g["id"] for g in groups], default=0) + 1
    item = {"id": new_id, "name": group.name, "members": group.members}
    groups.append(item)
    save_groups(groups)
    return item


@app.get("/groups/{user_id}")
def list_groups(user_id: str):
    groups = load_groups()
    result = [g for g in groups if user_id in g.get("members", [])]
    return {"groups": result}


@app.get("/groups/{group_id}/messages")
def group_messages(group_id: int):
    msgs = load_group_messages()
    result = [m for m in msgs if m["group_id"] == group_id]
    result.sort(key=lambda x: x["id"])
    return {"messages": result}


@app.post("/groups/{group_id}/messages")
async def send_group_message(group_id: int, msg: GroupMessageCreate):
    groups = load_groups()
    group = next((g for g in groups if g["id"] == group_id), None)
    if not group or msg.sender_id not in group.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member")
    messages = load_group_messages()
    new_id = max([m["id"] for m in messages], default=0) + 1
    item = {
        "id": new_id,
        "group_id": group_id,
        "sender_id": msg.sender_id,
        "content": msg.content,
        "created_at": datetime.utcnow().isoformat(),
    }
    messages.append(item)
    save_group_messages(messages)
    await broadcast({"type": "group_message", "group_id": group_id, "message": item})
    return item


# -------------------- Job Board API --------------------


@app.get("/jobs")
def list_jobs():
    jobs = load_jobs()
    jobs.sort(key=lambda x: x["id"], reverse=True)
    return {"jobs": jobs}


@app.post("/jobs")
async def create_job(job: JobPostCreate):
    users = load_users()
    if not any(u["user_id"] == job.author_id for u in users):
        raise HTTPException(status_code=404, detail="User not found")
    jobs = load_jobs()
    new_id = max([j["id"] for j in jobs], default=0) + 1
    item = {
        "id": new_id,
        "author_id": job.author_id,
        "title": job.title,
        "description": job.description,
        "reward": job.reward,
        "deadline": job.deadline,
        "created_at": datetime.utcnow().isoformat(),
    }
    jobs.append(item)
    save_jobs(jobs)
    await broadcast({"type": "new_job", "job": item})
    return item


@app.websocket("/ws/updates")
async def websocket_updates(websocket: WebSocket):
    await websocket.accept()
    connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connections.discard(websocket)
