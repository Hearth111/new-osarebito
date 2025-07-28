from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from ..models import (
    MessageCreate,
    GroupCreate,
    GroupMessageCreate,
    JobPostCreate,
    FanPostCreate,
    AppealCreate,
    AppealResolveRequest,
)
from ..crud import (
    load_users,
    save_users,
    load_messages,
    save_messages,
    load_groups,
    save_groups,
    load_group_messages,
    save_group_messages,
    load_jobs,
    save_jobs,
    load_fan_posts,
    save_fan_posts,
    load_appeals,
    save_appeals,
)
from ..utils import (
    broadcast,
    TUTORIAL_TASKS,
    is_semibanned,
)

router = APIRouter()


@router.post("/messages")
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
    for u in users:
        if u["user_id"] == msg.receiver_id:
            notes = u.setdefault("notifications", [])
            notes.append({"type": "message", "from": msg.sender_id, "message_id": new_id, "created_at": item["created_at"]})
            break
    save_users(users)
    await broadcast({"type": "new_message", "message": item})
    return item


@router.get("/messages/{user_id}/with/{other_id}")
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
        m for m in messages
        if (m["sender_id"] == user_id and m["receiver_id"] == other_id) or (m["sender_id"] == other_id and m["receiver_id"] == user_id)
    ]
    convo.sort(key=lambda x: x["id"])
    return {"messages": convo}


@router.get("/users/{user_id}/notifications")
def get_notifications(user_id: str):
    users = load_users()
    user = next((u for u in users if u["user_id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"notifications": user.get("notifications", [])}


@router.get("/users/{user_id}/achievements")
def get_achievements(user_id: str):
    users = load_users()
    user = next((u for u in users if u["user_id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"achievements": user.get("achievements", [])}


@router.get("/users/{user_id}/tutorial_tasks")
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


@router.post("/groups")
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


@router.get("/groups/{user_id}")
def list_groups(user_id: str):
    groups = load_groups()
    result = [g for g in groups if user_id in g.get("members", [])]
    return {"groups": result}


@router.get("/groups/{group_id}/messages")
def group_messages(group_id: int):
    msgs = load_group_messages()
    result = [m for m in msgs if m["group_id"] == group_id]
    result.sort(key=lambda x: x["id"])
    return {"messages": result}


@router.post("/groups/{group_id}/messages")
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


@router.get("/jobs")
def list_jobs():
    jobs = load_jobs()
    jobs.sort(key=lambda x: x["id"], reverse=True)
    return {"jobs": jobs}


@router.post("/jobs")
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


@router.get("/fan_posts")
def list_fan_posts(viewer_id: str):
    users = load_users()
    viewer = next((u for u in users if u["user_id"] == viewer_id), None)
    if not viewer:
        raise HTTPException(status_code=404, detail="User not found")
    if viewer.get("role") != "推し人":
        raise HTTPException(status_code=403, detail="Only fans can view")
    posts = load_fan_posts()
    posts.sort(key=lambda x: x["id"], reverse=True)
    return {"posts": posts}


@router.post("/fan_posts")
def create_fan_post(post: FanPostCreate):
    users = load_users()
    user = next((u for u in users if u["user_id"] == post.author_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") != "推し人":
        raise HTTPException(status_code=403, detail="Only fans can post")
    posts = load_fan_posts()
    new_id = max([p["id"] for p in posts], default=0) + 1
    item = {
        "id": new_id,
        "author_id": post.author_id,
        "content": post.content,
        "created_at": datetime.utcnow().isoformat(),
    }
    posts.append(item)
    save_fan_posts(posts)
    return item


@router.post("/appeals")
def create_appeal(appc: AppealCreate):
    users = load_users()
    user = next((u for u in users if u["user_id"] == appc.user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not is_semibanned(user):
        raise HTTPException(status_code=400, detail="Not semibanned")
    appeals = load_appeals()
    if any(a["user_id"] == appc.user_id and a["status"] == "pending" for a in appeals):
        raise HTTPException(status_code=400, detail="Already appealed")
    new_id = max([a["id"] for a in appeals], default=0) + 1
    item = {
        "id": new_id,
        "user_id": appc.user_id,
        "message": appc.message,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
    }
    appeals.append(item)
    save_appeals(appeals)
    return item


@router.post("/appeals/{appeal_id}/resolve")
def resolve_appeal(appeal_id: int, req: AppealResolveRequest):
    appeals = load_appeals()
    appeal = next((a for a in appeals if a["id"] == appeal_id), None)
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    if appeal.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Already resolved")
    action = req.action.lower()
    if action not in {"approve", "reject"}:
        raise HTTPException(status_code=400, detail="Invalid action")
    users = load_users()
    user = next((u for u in users if u["user_id"] == appeal["user_id"]), None)
    if action == "approve" and user:
        appeal["status"] = "approved"
        user["semiban_until"] = None
        save_users(users)
    elif action == "reject":
        appeal["status"] = "rejected"
    save_appeals(appeals)
    return {"message": appeal["status"]}


@router.get("/appeals")
def list_appeals():
    appeals = load_appeals()
    appeals.sort(key=lambda x: x["id"], reverse=True)
    return {"appeals": appeals}
