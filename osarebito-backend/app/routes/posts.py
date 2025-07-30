from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from collections import Counter
from ..models import (
    PostCreate,
    CommentCreate,
    BestAnswerRequest,
    LikeRequest,
    RetweetRequest,
    BookmarkRequest,
    ReportCreate,
)
from ..crud import (
    load_users,
    save_users,
    load_posts,
    save_posts,
    get_post,
    update_post,
    load_comments,
    save_comments,
    load_reports,
    save_reports,
)
from ..utils import (
    remove_sensitive_fields,
    add_achievement,
    FIRST_POST_ACHIEVEMENT,
    FIRST_COMMENT_ACHIEVEMENT,
    ROLE_REPORT_POINTS,
    REPORT_CATEGORIES,
    schedule_broadcast,
    is_semibanned,
)

router = APIRouter()


@router.post("/posts")
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
        "image": post.image,
        "created_at": datetime.utcnow().isoformat(),
    }
    posts.append(item)
    save_posts(posts)
    if first_post:
        add_achievement(user, FIRST_POST_ACHIEVEMENT)
        save_users(users)
    schedule_broadcast({"type": "new_post", "post": item})
    return item


@router.get("/posts")
def list_posts(
    feed: str | None = None,
    user_id: str | None = None,
    category: str | None = None,
    anonymous: bool | None = None,
):
    posts = load_posts()
    users = load_users()
    blocked_me = set()
    blocked_by_me = set()
    if user_id:
        me = next((u for u in users if u["user_id"] == user_id), None)
        if me:
            blocked_me = set(u["user_id"] for u in users if user_id in u.get("blocks", []))
            blocked_by_me = set(me.get("blocks", []))
    if category:
        posts = [p for p in posts if p.get("category") == category]
    if anonymous is not None:
        posts = [p for p in posts if bool(p.get("anonymous")) == anonymous]
    if feed == "following" and user_id:
        me = next((u for u in users if u["user_id"] == user_id), None)
        if not me:
            raise HTTPException(status_code=404, detail="User not found")
        follow = set(me.get("following", []))
        posts = [p for p in posts if p["author_id"] in follow or p["author_id"] == user_id]
    elif feed == "user" and user_id:
        posts = [p for p in posts if p["author_id"] == user_id]
    result = []
    for p in posts:
        if user_id and (p["author_id"] in blocked_by_me or p["author_id"] in blocked_me):
            continue
        item = p.copy()
        if item.get("anonymous"):
            item["author_id"] = "匿名"
        result.append(item)
    result.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"posts": result}


@router.get("/recommended_users")
def recommended_users():
    users = load_users()
    ranked = sorted(users, key=lambda u: len(u.get("followers", [])), reverse=True)
    return [remove_sensitive_fields(u) for u in ranked[:5]]


@router.get("/popular_tags")
def popular_tags():
    posts = load_posts()
    counter = Counter()
    for p in posts:
        for t in p.get("tags", []):
            counter[t] += 1
    return [{"name": t, "count": c} for t, c in counter.most_common(10)]


@router.get("/trending_posts")
def trending_posts():
    posts = load_posts()
    posts.sort(key=lambda x: len(x.get("likes", [])) + len(x.get("retweets", [])), reverse=True)
    result = []
    for p in posts[:10]:
        item = p.copy()
        if item.get("anonymous"):
            item["author_id"] = "匿名"
        result.append(item)
    return {"posts": result}


@router.get("/posts/{post_id}")
def get_post(post_id: int):
    posts = load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    item = post.copy()
    if item.get("anonymous"):
        item["author_id"] = "匿名"
    return item


@router.get("/posts/by_tag")
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


@router.post("/posts/{post_id}/like")
async def like_post(post_id: int, data: LikeRequest):
    post = get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    likes = post.setdefault("likes", [])
    if data.user_id not in likes:
        likes.append(data.user_id)
        update_post(post)
        schedule_broadcast({"type": "like", "post_id": post_id, "likes": likes})
    return {"likes": len(likes)}


@router.post("/posts/{post_id}/unlike")
async def unlike_post(post_id: int, data: LikeRequest):
    post = get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    likes = post.setdefault("likes", [])
    if data.user_id in likes:
        likes.remove(data.user_id)
        update_post(post)
        schedule_broadcast({"type": "like", "post_id": post_id, "likes": likes})
    return {"likes": len(likes)}


@router.post("/posts/{post_id}/retweet")
async def retweet_post(post_id: int, data: RetweetRequest):
    post = get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    retweets = post.setdefault("retweets", [])
    if data.user_id not in retweets:
        retweets.append(data.user_id)
        update_post(post)
        schedule_broadcast({"type": "retweet", "post_id": post_id, "retweets": retweets})
    return {"retweets": len(retweets)}


@router.post("/posts/{post_id}/unretweet")
async def unretweet_post(post_id: int, data: RetweetRequest):
    post = get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    retweets = post.setdefault("retweets", [])
    if data.user_id in retweets:
        retweets.remove(data.user_id)
        update_post(post)
        schedule_broadcast({"type": "retweet", "post_id": post_id, "retweets": retweets})
    return {"retweets": len(retweets)}


@router.post("/posts/{post_id}/bookmark")
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


@router.post("/posts/{post_id}/unbookmark")
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


@router.get("/posts/{post_id}/likers")
def list_likers(post_id: int):
    posts = load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    users = load_users()
    result = [remove_sensitive_fields(u) for u in users if u["user_id"] in post.get("likes", [])]
    return result


@router.get("/posts/{post_id}/comments")
def list_comments(post_id: int):
    comments = load_comments()
    post_comments = [c for c in comments if c["post_id"] == post_id]
    return {"comments": post_comments}


@router.post("/posts/{post_id}/comments")
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


@router.put("/posts/{post_id}/best_answer")
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


@router.post("/reports/post/{post_id}")
def report_post(post_id: int, rep: ReportCreate):
    posts = load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    users = load_users()
    reporter = next((u for u in users if u["user_id"] == rep.reporter_id), None)
    if not reporter:
        raise HTTPException(status_code=404, detail="User not found")
    if rep.category not in REPORT_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    reports = load_reports()
    if any(
        r["target_type"] == "post" and r["target_id"] == post_id and r["reporter_id"] == rep.reporter_id
        for r in reports
    ):
        raise HTTPException(status_code=400, detail="Already reported")
    new_id = max([r["id"] for r in reports], default=0) + 1
    item = {
        "id": new_id,
        "target_type": "post",
        "target_id": post_id,
        "reporter_id": rep.reporter_id,
        "category": rep.category,
        "reason": rep.reason or "",
        "created_at": datetime.utcnow().isoformat(),
    }
    reports.append(item)
    target = next((u for u in users if u["user_id"] == post["author_id"]), None)
    if target:
        weight = ROLE_REPORT_POINTS.get(reporter.get("role"), 1)
        target["report_points"] = target.get("report_points", 0) + weight
        if target["report_points"] >= 3:
            target["semiban_until"] = (datetime.utcnow() + timedelta(days=7)).isoformat()
            target["report_points"] = 0
    save_reports(reports)
    save_users(users)
    return {"message": "reported"}


@router.post("/reports/comment/{comment_id}")
def report_comment(comment_id: int, rep: ReportCreate):
    comments = load_comments()
    comment = next((c for c in comments if c["id"] == comment_id), None)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    users = load_users()
    reporter = next((u for u in users if u["user_id"] == rep.reporter_id), None)
    if not reporter:
        raise HTTPException(status_code=404, detail="User not found")
    if rep.category not in REPORT_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    reports = load_reports()
    if any(
        r["target_type"] == "comment" and r["target_id"] == comment_id and r["reporter_id"] == rep.reporter_id
        for r in reports
    ):
        raise HTTPException(status_code=400, detail="Already reported")
    new_id = max([r["id"] for r in reports], default=0) + 1
    item = {
        "id": new_id,
        "target_type": "comment",
        "target_id": comment_id,
        "reporter_id": rep.reporter_id,
        "category": rep.category,
        "reason": rep.reason or "",
        "created_at": datetime.utcnow().isoformat(),
    }
    reports.append(item)
    target = next((u for u in users if u["user_id"] == comment["author_id"]), None)
    if target:
        weight = ROLE_REPORT_POINTS.get(reporter.get("role"), 1)
        target["report_points"] = target.get("report_points", 0) + weight
        if target["report_points"] >= 3:
            target["semiban_until"] = (datetime.utcnow() + timedelta(days=7)).isoformat()
            target["report_points"] = 0
    save_reports(reports)
    save_users(users)
    return {"message": "reported"}
