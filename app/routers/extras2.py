"""
Router nâng cấp: Event Detail, Post Detail, Calendar, Global Search
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_, and_
from typing import Optional, List
from datetime import datetime, timedelta
import calendar as cal

from app.database import get_db
from app.models import (
    Event, EventRegistration, EventCheckIn, EventRating, Post,
    User, Club, Membership, Comment, ActivityLog, Achievement,
    UserAchievement, UserPoints, NotificationPreference, Notification
)
from app.security import require_user
from app.utils import award_points, calculate_level, LEVEL_THRESHOLDS

router = APIRouter(prefix="/api", tags=["extras2"])


# ============= EVENT DETAIL NÂNG CẤP =============

@router.get("/events/{event_id}/registrations")
def get_event_registrations(event_id: int, db: Session = Depends(get_db)):
    """Danh sách người đã đăng ký"""
    regs = db.query(EventRegistration, User).join(User, User.id == EventRegistration.user_id)\
        .filter(EventRegistration.event_id == event_id).all()
    return [
        {
            "id": r.id,
            "user_id": u.id,
            "full_name": u.full_name,
            "student_id": u.student_id,
            "class_name": u.class_name,
            "avatar": (u.full_name or u.username)[0].upper(),
            "registered_at": r.registered_at.isoformat(),
            "attended": r.attended
        } for r, u in regs
    ]


@router.get("/events/{event_id}/checkin-stats")
def get_checkin_stats(event_id: int, db: Session = Depends(get_db)):
    """Thống kê check-in của sự kiện"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")

    total_registered = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id
    ).count()

    total_checked_in = db.query(EventCheckIn).filter(
        EventCheckIn.event_id == event_id,
        EventCheckIn.checked_in_at.isnot(None)
    ).count()

    return {
        "event_id": event_id,
        "registered": total_registered,
        "checked_in": total_checked_in,
        "check_in_rate": round((total_checked_in / total_registered * 100) if total_registered else 0, 1)
    }


@router.get("/events/{event_id}/comments")
def get_event_comments(event_id: int, db: Session = Depends(get_db)):
    """Lấy bình luận của sự kiện"""
    comments = db.query(Comment, User).join(User, User.id == Comment.user_id)\
        .filter(Comment.target_type == "event", Comment.target_id == event_id)\
        .order_by(desc(Comment.created_at)).all()
    return [
        {
            "id": c.id,
            "user_id": c.user_id,
            "user_name": u.full_name,
            "avatar": (u.full_name or u.username)[0].upper(),
            "content": c.content,
            "likes": c.likes,
            "created_at": c.created_at.isoformat()
        } for c, u in comments
    ]


@router.post("/events/{event_id}/comments")
def add_event_comment(
    event_id: int,
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Bình luận sự kiện"""
    content = payload.get("content", "").strip()
    if not content:
        raise HTTPException(400, "Nội dung trống")

    comment = Comment(
        user_id=current_user.id,
        target_type="event",
        target_id=event_id,
        content=content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    award_points(db, current_user.id, "comment", 2)
    return {"id": comment.id, "message": "Đã bình luận"}


# ============= POST DETAIL NÂNG CẤP =============

@router.get("/posts/{post_id}/full")
def get_post_full(post_id: int, db: Session = Depends(get_db)):
    """Lấy chi tiết bài viết + tác giả + CLB"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    author = db.query(User).filter(User.id == post.author_id).first()
    club = db.query(Club).filter(Club.id == post.club_id).first()

    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "post_type": post.post_type,
        "cover_image": post.cover_image,
        "views": post.views,
        "likes": post.likes,
        "is_pinned": post.is_pinned,
        "ai_keyword": post.ai_keyword,
        "ai_category": post.ai_category,
        "created_at": post.created_at.isoformat(),
        "author": {
            "id": author.id if author else None,
            "full_name": author.full_name if author else "Unknown",
            "avatar": (author.full_name or "")[0].upper() if author else "?",
            "role": author.role if author else "member"
        } if author else None,
        "club": {
            "id": club.id if club else None,
            "name": club.name if club else "Unknown",
            "category": club.category if club else None,
            "logo": club.logo if club else ""
        } if club else None
    }


# ============= CALENDAR =============

@router.get("/calendar/events")
def get_events_calendar(
    db: Session = Depends(get_db),
    month: Optional[int] = None,
    year: Optional[int] = None,
    club_id: Optional[int] = None
):
    """Lấy sự kiện theo tháng để hiển thị calendar"""
    now = datetime.utcnow()
    year = year or now.year
    month = month or now.month

    start = datetime(year, month, 1)
    last_day = cal.monthrange(year, month)[1]
    end = datetime(year, month, last_day, 23, 59, 59)

    query = db.query(Event).filter(
        Event.start_time >= start,
        Event.start_time <= end
    )
    if club_id:
        query = query.filter(Event.club_id == club_id)

    events = query.order_by(Event.start_time).all()

    # Group by day
    events_by_day = {}
    for e in events:
        day = e.start_time.day
        if day not in events_by_day:
            events_by_day[day] = []
        events_by_day[day].append({
            "id": e.id,
            "title": e.title,
            "time": e.start_time.strftime("%H:%M"),
            "location": e.location,
            "status": e.status
        })

    return {
        "year": year,
        "month": month,
        "month_name": f"Tháng {month}/{year}",
        "events_by_day": events_by_day,
        "total_events": len(events)
    }


# ============= GLOBAL SEARCH =============

@router.get("/search")
def global_search(
    q: str,
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Tìm kiếm toàn cục: clubs, events, posts, members"""
    if not q or len(q) < 2:
        return {"clubs": [], "events": [], "posts": [], "members": []}

    pattern = f"%{q}%"

    clubs = db.query(Club).filter(
        Club.is_active == True,
        or_(
            Club.name.ilike(pattern),
            Club.description.ilike(pattern),
            Club.ai_tags.ilike(pattern)
        )
    ).limit(5).all()

    events = db.query(Event).filter(
        or_(Event.title.ilike(pattern), Event.description.ilike(pattern))
    ).limit(5).all()

    posts = db.query(Post).filter(
        or_(Post.title.ilike(pattern), Post.content.ilike(pattern))
    ).limit(5).all()

    members = db.query(User).filter(
        User.is_active == True,
        User.is_public == True,
        or_(
            User.full_name.ilike(pattern),
            User.username.ilike(pattern),
            User.student_id.ilike(pattern),
            User.skills.ilike(pattern),
            User.interests.ilike(pattern)
        )
    ).limit(5).all()

    return {
        "query": q,
        "clubs": [
            {
                "id": c.id,
                "name": c.name,
                "category": c.category,
                "member_count": c.member_count,
                "description": (c.description or "")[:100]
            } for c in clubs
        ],
        "events": [
            {
                "id": e.id,
                "title": e.title,
                "start_time": e.start_time.isoformat(),
                "location": e.location,
                "club_id": e.club_id
            } for e in events
        ],
        "posts": [
            {
                "id": p.id,
                "title": p.title,
                "post_type": p.post_type,
                "created_at": p.created_at.isoformat(),
                "club_id": p.club_id
            } for p in posts
        ],
        "members": [
            {
                "id": u.id,
                "full_name": u.full_name,
                "student_id": u.student_id,
                "class_name": u.class_name,
                "faculty": u.faculty,
                "role": u.role
            } for u in members
        ],
        "total": len(clubs) + len(events) + len(posts) + len(members)
    }


# ============= ACTIVITY TIMELINE (CÁ NHÂN) =============

@router.get("/my-timeline")
def my_timeline(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
    days: int = 30
):
    """Dòng thời gian hoạt động của tôi"""
    since = datetime.utcnow() - timedelta(days=days)

    # CLB đã tham gia gần đây
    recent_clubs = db.query(Membership, Club).join(Club, Club.id == Membership.club_id)\
        .filter(Membership.user_id == current_user.id, Membership.joined_at >= since).all()

    # Sự kiện đã đăng ký
    recent_events = db.query(EventRegistration, Event).join(Event, Event.id == EventRegistration.event_id)\
        .filter(EventRegistration.user_id == current_user.id, EventRegistration.registered_at >= since).all()

    # Bài viết đã đăng
    recent_posts = db.query(Post).filter(
        Post.author_id == current_user.id,
        Post.created_at >= since
    ).all()

    timeline = []
    for m, c in recent_clubs:
        timeline.append({
            "type": "join_club",
            "icon": "fa-users",
            "title": f"Tham gia {c.name}",
            "description": c.category,
            "time": m.joined_at.isoformat()
        })
    for r, e in recent_events:
        timeline.append({
            "type": "register_event",
            "icon": "fa-calendar-check",
            "title": f"Đăng ký: {e.title}",
            "description": e.location,
            "time": r.registered_at.isoformat()
        })
    for p in recent_posts:
        timeline.append({
            "type": "create_post",
            "icon": "fa-newspaper",
            "title": f"Đăng bài: {p.title}",
            "description": (p.content or "")[:80],
            "time": p.created_at.isoformat()
        })

    timeline.sort(key=lambda x: x["time"], reverse=True)
    return {
        "user_id": current_user.id,
        "since": since.isoformat(),
        "items": timeline,
        "stats": {
            "clubs_joined": len(recent_clubs),
            "events_registered": len(recent_events),
            "posts_created": len(recent_posts)
        }
    }


# ============= EXPORT BÁO CÁO =============

@router.get("/clubs/{club_id}/export")
def export_club_data(
    club_id: int,
    db: Session = Depends(get_db),
    format: str = "json"
):
    """Export dữ liệu CLB (JSON)"""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(404, "Club not found")

    members = db.query(Membership, User).join(User, User.id == Membership.user_id)\
        .filter(Membership.club_id == club_id, Membership.is_active == True).all()
    events = db.query(Event).filter(Event.club_id == club_id).all()
    posts = db.query(Post).filter(Post.club_id == club_id).all()

    return {
        "club": {
            "id": club.id,
            "name": club.name,
            "category": club.category,
            "description": club.description,
            "mission": club.mission,
            "vision": club.vision,
            "member_count": club.member_count,
            "founded_date": club.founded_date.isoformat()
        },
        "members": [
            {
                "full_name": u.full_name,
                "student_id": u.student_id,
                "class_name": u.class_name,
                "role": m.role
            } for m, u in members
        ],
        "members_count": len(members),
        "events_count": len(events),
        "posts_count": len(posts),
        "exported_at": datetime.utcnow().isoformat()
    }


# ============= GAMIFICATION CÁ NHÂN =============

@router.get("/my-points")
def my_points(current_user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Điểm, level, rank và tiến trình lên cấp của user hiện tại"""
    up = db.query(UserPoints).filter(UserPoints.user_id == current_user.id).first()
    total = up.total_points if up else 0
    experience = up.experience if up else 0
    streak_days = up.streak_days if up else 0

    threshold, level, rank, badge = calculate_level(total)

    next_t = None
    for t, lvl, rk, b in LEVEL_THRESHOLDS:
        if t > threshold:
            next_t = (t, lvl, rk, b)
            break

    if next_t:
        span = next_t[0] - threshold
        progress = int((total - threshold) / span * 100) if span > 0 else 100
    else:
        progress = 100
        next_t = (threshold, level, rank, badge)

    return {
        "user_id": current_user.id,
        "level": level,
        "rank": rank,
        "badge": badge,
        "total_points": total,
        "experience": experience,
        "streak_days": streak_days,
        "progress": progress,
        "next_level": next_t[1],
        "next_rank": next_t[2],
        "next_level_points": next_t[0]
    }


@router.get("/achievements")
def my_achievements(current_user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Danh sách thành tích đã mở khóa của user hiện tại"""
    achievements = db.query(Achievement, UserAchievement).join(
        UserAchievement, Achievement.id == UserAchievement.achievement_id
    ).filter(
        UserAchievement.user_id == current_user.id
    ).order_by(UserAchievement.earned_at.desc()).all()

    return [
        {
            "id": a.id,
            "code": a.code,
            "name": a.name,
            "description": a.description,
            "icon": a.icon,
            "points": a.points,
            "rarity": a.rarity,
            "category": a.category,
            "earned_at": ua.earned_at.isoformat() if ua.earned_at else None
        } for a, ua in achievements
    ]


@router.get("/activity-log")
def my_activity_log(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Nhật ký hoạt động của user hiện tại"""
    logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()

    return [
        {
            "id": l.id,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "description": l.description,
            "metadata": l.metadata_json,
            "created_at": l.created_at.isoformat() if l.created_at else None
        } for l in logs
    ]


# ============= NOTIFICATION PREFERENCES =============

_NOTIF_PREF_FIELDS = ["in_app", "email", "notif_event", "notif_club",
                      "notif_comment", "notif_achievement", "notif_follow"]


def _get_or_create_pref(db: Session, user_id: int) -> NotificationPreference:
    pref = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == user_id
    ).first()
    if not pref:
        pref = NotificationPreference(user_id=user_id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.get("/notification-preferences")
def get_notification_preferences(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Lấy cài đặt thông báo của user hiện tại"""
    pref = _get_or_create_pref(db, current_user.id)
    data = {f: getattr(pref, f) for f in _NOTIF_PREF_FIELDS}
    data["quiet_hours_start"] = pref.quiet_hours_start
    data["quiet_hours_end"] = pref.quiet_hours_end
    data["updated_at"] = pref.updated_at.isoformat() if pref.updated_at else None
    return data


@router.put("/notification-preferences")
def update_notification_preferences(
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Cập nhật cài đặt thông báo"""
    pref = _get_or_create_pref(db, current_user.id)
    for f in _NOTIF_PREF_FIELDS:
        if f in payload:
            setattr(pref, f, bool(payload[f]))
    if "quiet_hours_start" in payload:
        pref.quiet_hours_start = str(payload["quiet_hours_start"])[:5]
    if "quiet_hours_end" in payload:
        pref.quiet_hours_end = str(payload["quiet_hours_end"])[:5]
    db.commit()
    db.refresh(pref)
    return {"message": "Đã lưu cài đặt thông báo", "updated": True}


# ============= SYSTEM STATS =============

@router.get("/system-stats")
def system_stats(db: Session = Depends(get_db)):
    """Thống kê tổng quan hệ thống cho menu quản trị"""
    return {
        "total_users": db.query(User).filter(User.is_active == True).count(),
        "total_clubs": db.query(Club).filter(Club.is_active == True).count(),
        "total_events": db.query(Event).count(),
        "total_posts": db.query(Post).count(),
        "total_memberships": db.query(Membership).filter(Membership.is_active == True).count(),
        "total_notifications": db.query(Notification).count()
    }
