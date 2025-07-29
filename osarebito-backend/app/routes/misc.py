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
    MaterialCreate,
    MaterialBoxRequest,
    PollCreate,
    PollVoteRequest,
    ScheduleCreate,
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
    load_materials,
    save_materials,
    load_polls,
    save_polls,
    load_schedules,
    save_schedules,
)
from ..utils import (
    broadcast,
    TUTORIAL_TASKS,
    is_semibanned,
    generate_schedule_image,
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


@router.get("/materials")
def list_materials(keyword: str | None = None, category: str | None = None):
    materials = load_materials()
    if keyword:
        kw = keyword.lower()
        materials = [
            m
            for m in materials
            if kw in m.get("title", "").lower()
            or kw in m.get("description", "").lower()
        ]
    if category:
        materials = [m for m in materials if m.get("category") == category]
    materials.sort(key=lambda x: x["id"], reverse=True)
    return {"materials": materials}


@router.post("/materials")
def create_material(mat: MaterialCreate):
    users = load_users()
    if not any(u["user_id"] == mat.uploader_id for u in users):
        raise HTTPException(status_code=404, detail="User not found")
    materials = load_materials()
    new_id = max([m["id"] for m in materials], default=0) + 1
    item = {
        "id": new_id,
        "uploader_id": mat.uploader_id,
        "title": mat.title,
        "description": mat.description,
        "category": mat.category,
        "url": mat.url,
        "created_at": datetime.utcnow().isoformat(),
    }
    materials.append(item)
    save_materials(materials)
    return item


@router.post("/materials/{material_id}/save")
def save_material_to_box(material_id: int, req: MaterialBoxRequest):
    materials = load_materials()
    if not any(m["id"] == material_id for m in materials):
        raise HTTPException(status_code=404, detail="Material not found")
    users = load_users()
    user = next((u for u in users if u["user_id"] == req.user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    box = user.setdefault("material_box", [])
    if material_id not in box:
        box.append(material_id)
        save_users(users)
    return {"count": len(box)}


@router.post("/materials/{material_id}/unsave")
def unsave_material_from_box(material_id: int, req: MaterialBoxRequest):
    users = load_users()
    user = next((u for u in users if u["user_id"] == req.user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    box = user.setdefault("material_box", [])
    if material_id in box:
        box.remove(material_id)
        save_users(users)
    return {"count": len(box)}


@router.get("/users/{user_id}/material_box")
def list_material_box(user_id: str):
    users = load_users()
    user = next((u for u in users if u["user_id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    materials = load_materials()
    ids = set(user.get("material_box", []))
    result = [m for m in materials if m["id"] in ids]
    result.sort(key=lambda x: x["id"], reverse=True)
    return {"materials": result}


@router.get("/polls")
def list_polls():
    polls = load_polls()
    polls.sort(key=lambda x: x["id"], reverse=True)
    return {"polls": polls}


@router.post("/polls")
async def create_poll(poll: PollCreate):
    users = load_users()
    user = next((u for u in users if u["user_id"] == poll.author_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") != "推され人":
        raise HTTPException(status_code=403, detail="Only performers can create")
    polls = load_polls()
    new_id = max([p["id"] for p in polls], default=0) + 1
    item = {
        "id": new_id,
        "author_id": poll.author_id,
        "question": poll.question,
        "options": poll.options,
        "votes": [[] for _ in poll.options],
        "created_at": datetime.utcnow().isoformat(),
    }
    polls.append(item)
    save_polls(polls)
    await broadcast({"type": "new_poll", "poll": item})
    return item


@router.get("/polls/{poll_id}")
def get_poll(poll_id: int):
    polls = load_polls()
    poll = next((p for p in polls if p["id"] == poll_id), None)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return poll


@router.post("/polls/{poll_id}/vote")
async def vote_poll(poll_id: int, req: PollVoteRequest):
    polls = load_polls()
    poll = next((p for p in polls if p["id"] == poll_id), None)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    users = load_users()
    if not any(u["user_id"] == req.user_id for u in users):
        raise HTTPException(status_code=404, detail="User not found")
    if req.option < 0 or req.option >= len(poll.get("options", [])):
        raise HTTPException(status_code=400, detail="Invalid option")
    for voters in poll["votes"]:
        if req.user_id in voters:
            voters.remove(req.user_id)
    poll["votes"][req.option].append(req.user_id)
    save_polls(polls)
    counts = [len(v) for v in poll["votes"]]
    await broadcast({"type": "vote", "poll_id": poll_id, "counts": counts})
    return {"counts": counts}


@router.post("/schedules")
def create_schedule(req: ScheduleCreate):
    users = load_users()
    if not any(u["user_id"] == req.author_id for u in users):
        raise HTTPException(status_code=404, detail="User not found")
    schedules = load_schedules()
    new_id = max([s["id"] for s in schedules], default=0) + 1
    events = [e.dict() for e in req.events]
    item = {
        "id": new_id,
        "author_id": req.author_id,
        "events": events,
        "template": req.template or "default",
        "created_at": datetime.utcnow().isoformat(),
    }
    schedules.append(item)
    save_schedules(schedules)
    image = generate_schedule_image(events)
    item_with_image = item | {"image": image}
    return item_with_image


@router.get("/schedules/{schedule_id}/image")
def get_schedule_image(schedule_id: int):
    schedules = load_schedules()
    sched = next((s for s in schedules if s["id"] == schedule_id), None)
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found")
    image = generate_schedule_image(sched.get("events", []))
    return {"image": image}

