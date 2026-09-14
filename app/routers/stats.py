"""
Router thống kê & dashboard
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Club, User, Event, EventRegistration, Post, Membership, UserPoints
from app.security import require_user, get_current_user
from typing import Optional

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    """Thống kê tổng quan hệ thống"""
    total_clubs = db.query(Club).filter(Club.is_active == True).count()
    total_users = db.query(User).filter(User.is_active == True).count()
    total_events = db.query(Event).count()
    upcoming_events = db.query(Event).filter(
        Event.start_time >= datetime.utcnow(),
        Event.status == "upcoming"
    ).count()
    total_posts = db.query(Post).count()
    total_memberships = db.query(Membership).filter(Membership.is_active == True).count()

    return {
        "total_clubs": total_clubs,
        "total_users": total_users,
        "total_events": total_events,
        "upcoming_events": upcoming_events,
        "total_posts": total_posts,
        "total_memberships": total_memberships
    }


@router.get("/dashboard")
def get_dashboard(current_user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Dashboard cho user hiện tại"""
    my_clubs = db.query(Membership, Club).join(Club, Club.id == Membership.club_id)\
        .filter(Membership.user_id == current_user.id, Membership.is_active == True).all()

    my_events_upcoming = db.query(EventRegistration, Event).join(Event, Event.id == EventRegistration.event_id)\
        .filter(EventRegistration.user_id == current_user.id,
                Event.start_time >= datetime.utcnow()).all()

    my_posts = db.query(Post).filter(Post.author_id == current_user.id).count()

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "username": current_user.username,
            "role": current_user.role
        },
        "my_clubs": [
            {
                "id": c.id,
                "name": c.name,
                "category": c.category,
                "logo": c.logo,
                "role": m.role
            } for m, c in my_clubs
        ],
        "my_clubs_count": len(my_clubs),
        "upcoming_events": [
            {
                "id": e.id,
                "title": e.title,
                "start_time": e.start_time.isoformat(),
                "location": e.location
            } for r, e in my_events_upcoming
        ],
        "upcoming_events_count": len(my_events_upcoming),
        "my_posts_count": my_posts
    }


@router.get("/popular-clubs")
def popular_clubs(db: Session = Depends(get_db), limit: int = 5):
    """CLB phổ biến nhất"""
    clubs = db.query(Club).filter(Club.is_active == True)\
        .order_by(Club.member_count.desc()).limit(limit).all()
    return [
        {"id": c.id, "name": c.name, "category": c.category,
         "logo": c.logo, "member_count": c.member_count} for c in clubs
    ]


@router.get("/activity")
def activity_feed(db: Session = Depends(get_db), limit: int = 20):
    """Hoạt động gần đây"""
    recent_clubs = db.query(Club).order_by(Club.created_at.desc()).limit(5).all()
    recent_events = db.query(Event).order_by(Event.created_at.desc()).limit(5).all()
    recent_posts = db.query(Post).order_by(Post.created_at.desc()).limit(5).all()

    activities = []
    for c in recent_clubs:
        activities.append({
            "type": "club_created",
            "title": f"Câu lạc bộ mới: {c.name}",
            "description": c.description[:100] if c.description else "",
            "time": c.created_at.isoformat(),
            "id": c.id
        })
    for e in recent_events:
        activities.append({
            "type": "event_created",
            "title": f"Sự kiện: {e.title}",
            "description": e.location,
            "time": e.created_at.isoformat(),
            "id": e.id
        })
    for p in recent_posts:
        activities.append({
            "type": "post_created",
            "title": p.title,
            "description": (p.content or "")[:100],
            "time": p.created_at.isoformat(),
            "id": p.id
        })

    activities.sort(key=lambda x: x["time"], reverse=True)
    return activities[:limit]


# ============= LEADERBOARD ENDPOINTS =============

@router.get("/leaderboard")
def get_leaderboard(
    period: str = "month",
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Xếp hạng sinh viên - Top contributors"""
    try:
        # Get users sorted by points
        users = db.query(User).filter(User.is_active == True).all()

        leaderboard_data = []
        for user in users:
            # Count clubs joined
            clubs_count = db.query(Membership).filter(
                Membership.user_id == user.id,
                Membership.is_active == True
            ).count()

            # Count events attended
            events_count = db.query(EventRegistration).filter(
                EventRegistration.user_id == user.id,
                EventRegistration.attended == True
            ).count()

            # Get points
            points_record = db.query(UserPoints).filter(
                UserPoints.user_id == user.id
            ).first()
            points = points_record.total_points if points_record else 0

            leaderboard_data.append({
                "id": user.id,
                "name": user.full_name or user.username,
                "major": user.faculty or "N/A",
                "points": points,
                "clubs_count": clubs_count,
                "events_count": events_count,
                "avatar": (user.full_name or user.username)[0].upper()
            })

        # Sort by points descending
        leaderboard_data.sort(key=lambda x: x["points"], reverse=True)
        return leaderboard_data[:limit]
    except Exception as e:
        return []


@router.get("/leaderboard/my-rank")
def get_my_rank(
    current_user: User = Depends(get_current_user),
    period: str = "month",
    db: Session = Depends(get_db)
):
    """Xếp hạng của tôi"""
    try:
        # Count clubs
        clubs_count = db.query(Membership).filter(
            Membership.user_id == current_user.id,
            Membership.is_active == True
        ).count()

        # Count events attended
        events_count = db.query(EventRegistration).filter(
            EventRegistration.user_id == current_user.id,
            EventRegistration.attended == True
        ).count()

        # Get points
        points_record = db.query(UserPoints).filter(
            UserPoints.user_id == current_user.id
        ).first()
        points = points_record.total_points if points_record else 0

        # Calculate rank
        users_with_more_points = db.query(func.count(User.id)).join(
            UserPoints, UserPoints.user_id == User.id
        ).filter(
            User.is_active == True,
            UserPoints.total_points > points
        ).scalar() or 0

        rank = users_with_more_points + 1

        return {
            "user_id": current_user.id,
            "rank": rank,
            "points": points,
            "clubs": clubs_count,
            "events": events_count
        }
    except Exception as e:
        return {
            "user_id": current_user.id,
            "rank": 0,
            "points": 0,
            "clubs": 0,
            "events": 0
        }
