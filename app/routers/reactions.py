"""
Router cho Reactions, Follow, Tasks
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models import (
    Reaction, Follow, ClubTask, Club, User, Post, Event, Comment
)
from app.security import require_user, get_current_user
from app.utils import award_points, create_notification, log_activity

router = APIRouter(prefix="/api", tags=["interactions"])

# ============= REACTIONS =============

REACTION_TYPES = {
    "like": "👍",
    "love": "❤️",
    "haha": "😂",
    "wow": "😮",
    "sad": "😢",
    "angry": "😠"
}


@router.post("/react")
def add_reaction(
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Thêm/sửa reaction"""
    target_type = payload.get("target_type")  # post, event, comment
    target_id = payload.get("target_id")
    reaction_type = payload.get("reaction_type", "like")

    if target_type not in ["post", "event", "comment"]:
        raise HTTPException(400, "Invalid target_type")
    if reaction_type not in REACTION_TYPES:
        raise HTTPException(400, "Invalid reaction_type")

    # Tìm reaction cũ
    existing = db.query(Reaction).filter(
        Reaction.user_id == current_user.id,
        Reaction.target_type == target_type,
        Reaction.target_id == target_id
    ).first()

    if existing:
        existing.reaction_type = reaction_type
        action = "updated"
    else:
        reaction = Reaction(
            user_id=current_user.id,
            target_type=target_type,
            target_id=target_id,
            reaction_type=reaction_type
        )
        db.add(reaction)
        action = "added"
        # Cộng điểm cho chủ bài viết/event
        award_points(db, current_user.id, "like_received", 1)

    db.commit()

    return {
        "action": action,
        "reaction_type": reaction_type,
        "emoji": REACTION_TYPES[reaction_type]
    }


@router.delete("/react/{target_type}/{target_id}")
def remove_reaction(
    target_type: str,
    target_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Xóa reaction"""
    db.query(Reaction).filter(
        Reaction.user_id == current_user.id,
        Reaction.target_type == target_type,
        Reaction.target_id == target_id
    ).delete()
    db.commit()
    return {"message": "Removed"}


@router.get("/reactions/{target_type}/{target_id}")
def get_reactions(
    target_type: str,
    target_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy tổng hợp reactions của 1 target"""
    reactions = db.query(Reaction).filter(
        Reaction.target_type == target_type,
        Reaction.target_id == target_id
    ).all()

    # Group by type
    summary = {}
    for r in reactions:
        if r.reaction_type not in summary:
            summary[r.reaction_type] = {"count": 0, "users": []}
        summary[r.reaction_type]["count"] += 1
        if len(summary[r.reaction_type]["users"]) < 5:
            user = db.query(User).filter(User.id == r.user_id).first()
            if user:
                summary[r.reaction_type]["users"].append(user.full_name)

    # User's reaction
    my_reaction = None
    if current_user:
        mine = next((r for r in reactions if r.user_id == current_user.id), None)
        if mine:
            my_reaction = mine.reaction_type

    return {
        "total": len(reactions),
        "summary": summary,
        "my_reaction": my_reaction
    }


# ============= FOLLOW =============

@router.post("/follow")
def follow(
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Follow user hoặc CLB (toggle)"""
    target_type = payload.get("target_type")
    target_id = payload.get("target_id")

    if target_type not in ["user", "club"]:
        raise HTTPException(400, "Invalid target_type")
    if target_type == "user" and target_id == current_user.id:
        raise HTTPException(400, "Không thể follow chính mình")

    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.target_type == target_type,
        Follow.target_id == target_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"following": False, "message": "Đã bỏ follow"}
    else:
        follow = Follow(
            follower_id=current_user.id,
            target_type=target_type,
            target_id=target_id
        )
        db.add(follow)
        db.commit()

        if target_type == "user":
            create_notification(
                db, target_id, "follow",
                f"👋 {current_user.full_name} theo dõi bạn",
                f"{current_user.full_name} vừa follow bạn",
                "fa-user-plus",
                f"/member-profile/{current_user.id}"
            )

        return {"following": True, "message": "Đã follow"}


@router.get("/follow/status")
def follow_status(
    target_type: str,
    target_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trạng thái follow + tổng số follower"""
    if target_type not in ("user", "club"):
        raise HTTPException(400, "Invalid target_type")
    is_following = False
    if current_user:
        existing = db.query(Follow).filter(
            Follow.follower_id == current_user.id,
            Follow.target_type == target_type,
            Follow.target_id == target_id
        ).first()
        is_following = existing is not None
    followers_count = db.query(Follow).filter(
        Follow.target_type == target_type,
        Follow.target_id == target_id
    ).count()
    return {"is_following": is_following, "followers_count": followers_count}


@router.delete("/follow/{target_type}/{target_id}")
def unfollow(
    target_type: str,
    target_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Bỏ follow"""
    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.target_type == target_type,
        Follow.target_id == target_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
    return {"following": False, "message": "Đã bỏ follow"}


@router.get("/following")
def get_following(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Danh sách following của tôi"""
    follows = db.query(Follow).filter(Follow.follower_id == current_user.id).all()
    return [
        {
            "target_type": f.target_type,
            "target_id": f.target_id,
            "created_at": f.created_at.isoformat()
        } for f in follows
    ]


# ============= TASKS =============

@router.get("/clubs/{club_id}/tasks")
def list_tasks(
    club_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Danh sách task của CLB"""
    tasks = db.query(ClubTask, User).outerjoin(User, User.id == ClubTask.assignee_id)\
        .filter(ClubTask.club_id == club_id).order_by(desc(ClubTask.created_at)).all()

    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "assignee_id": t.assignee_id,
            "assignee_name": u.full_name if u else None,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "created_at": t.created_at.isoformat(),
            "completed_at": t.completed_at.isoformat() if t.completed_at else None
        } for t, u in tasks
    ]


@router.post("/clubs/{club_id}/tasks")
def create_task(
    club_id: int,
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Tạo task mới (chủ nhiệm/leader)"""
    task = ClubTask(
        club_id=club_id,
        title=payload["title"],
        description=payload.get("description"),
        creator_id=current_user.id,
        assignee_id=payload.get("assignee_id"),
        priority=payload.get("priority", "medium"),
        due_date=datetime.fromisoformat(payload["due_date"]) if payload.get("due_date") else None
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Notify assignee
    if task.assignee_id and task.assignee_id != current_user.id:
        create_notification(
            db, task.assignee_id, "task",
            f"📋 Task mới: {task.title}",
            f"Bạn được giao một nhiệm vụ mới trong CLB",
            "fa-list-check",
            "/profile"
        )

    return {"id": task.id, "message": "Đã tạo task"}


@router.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Cập nhật task (status, assignee)"""
    task = db.query(ClubTask).filter(ClubTask.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")

    for field in ["status", "priority", "assignee_id", "title", "description", "due_date"]:
        if field in payload:
            setattr(task, field, payload[field])

    if payload.get("status") == "done" and not task.completed_at:
        task.completed_at = datetime.utcnow()
        award_points(db, task.assignee_id or current_user.id, "complete_profile", 10)
    elif payload.get("status") != "done":
        task.completed_at = None

    db.commit()
    return {"message": "Cập nhật thành công"}


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Xóa task"""
    task = db.query(ClubTask).filter(ClubTask.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Đã xóa"}


# ============= CLUB MANAGE PAGE =============

@router.get("/clubs/{club_id}/manage")
def get_club_manage_data(
    club_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Lấy tất cả data để quản lý CLB"""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(404, "Club not found")

    # Kiểm tra quyền
    is_president = club.president_id == current_user.id
    is_admin = current_user.role == "admin"
    if not (is_president or is_admin):
        raise HTTPException(403, "Chỉ chủ nhiệm hoặc admin mới có quyền")

    members = db.query(Membership, User).join(User, User.id == Membership.user_id)\
        .filter(Membership.club_id == club_id, Membership.is_active == True).all()

    # Thống kê
    total_events = db.query(Event).filter(Event.club_id == club_id).count()
    upcoming_events = db.query(Event).filter(
        Event.club_id == club_id, Event.start_time >= datetime.utcnow()
    ).count()
    total_posts = db.query(Post).filter(Post.club_id == club_id).count()
    total_tasks = db.query(ClubTask).filter(ClubTask.club_id == club_id).count()
    completed_tasks = db.query(ClubTask).filter(
        ClubTask.club_id == club_id, ClubTask.status == "done"
    ).count()

    return {
        "club": {
            "id": club.id,
            "name": club.name,
            "description": club.description,
            "member_count": club.member_count,
            "is_president": is_president,
            "is_admin": is_admin
        },
        "stats": {
            "total_events": total_events,
            "upcoming_events": upcoming_events,
            "total_posts": total_posts,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks
        },
        "members": [
            {
                "user_id": u.id,
                "full_name": u.full_name,
                "student_id": u.student_id,
                "class_name": u.class_name,
                "faculty": u.faculty,
                "role": m.role,
                "joined_at": m.joined_at.isoformat()
            } for m, u in members
        ]
    }
