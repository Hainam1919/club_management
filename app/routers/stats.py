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

def _period_days(period: str) -> Optional[int]:
    """Map period -> số ngày trong quá khứ (None = tất cả)."""
    return {
        "week": 7,
        "month": 30,
        "quarter": 90,
        "year": 365,
    }.get(period, None)


@router.get("/leaderboard")
def get_leaderboard(
    period: str = "month",
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Xếp hạng sinh viên - Top contributors (batch aggregate, không N+1)"""
    try:
        days = _period_days(period)
        cutoff = datetime.utcnow() - timedelta(days=days) if days else None

        # Batch aggregate (thay vòng lặp N+1)
        club_counts = dict(
            db.query(Membership.user_id, func.count(Membership.id))
            .filter(Membership.is_active == True)
            .group_by(Membership.user_id).all()
        )
        event_counts = dict(
            db.query(EventRegistration.user_id, func.count(EventRegistration.id))
            .filter(EventRegistration.attended == True)
            .group_by(EventRegistration.user_id).all()
        )
        points_query = db.query(UserPoints.user_id, UserPoints.total_points)
        if cutoff:
            points_query = points_query.filter(UserPoints.updated_at >= cutoff)
        points_map = dict(points_query.all())

        users = db.query(User).filter(User.is_active == True).all()
        leaderboard_data = []
        for user in users:
            points = points_map.get(user.id, 0)
            if cutoff and user.id not in points_map:
                continue  # Không hoạt động trong kỳ -> không xếp hạng
            leaderboard_data.append({
                "id": user.id,
                "name": user.full_name or user.username,
                "major": user.faculty or "N/A",
                "points": points,
                "clubs_count": club_counts.get(user.id, 0),
                "events_count": event_counts.get(user.id, 0),
                "avatar": (user.full_name or user.username)[0].upper()
            })

        leaderboard_data.sort(key=lambda x: x["points"], reverse=True)
        result = leaderboard_data[:limit]
        for idx, row in enumerate(result, start=1):
            row["rank"] = idx
        return result
    except Exception as e:
        return []


@router.get("/leaderboard/my-rank")
def get_my_rank(
    current_user: User = Depends(get_current_user),
    period: str = "month",
    db: Session = Depends(get_db)
):
    """Xếp hạng của tôi theo kỳ"""
    try:
        days = _period_days(period)
        cutoff = datetime.utcnow() - timedelta(days=days) if days else None

        clubs_count = db.query(Membership).filter(
            Membership.user_id == current_user.id,
            Membership.is_active == True
        ).count()

        events_count = db.query(EventRegistration).filter(
            EventRegistration.user_id == current_user.id,
            EventRegistration.attended == True
        ).count()

        points_query = db.query(UserPoints).filter(UserPoints.user_id == current_user.id)
        if cutoff:
            points_query = points_query.filter(UserPoints.updated_at >= cutoff)
        points_record = points_query.first()
        points = points_record.total_points if points_record else 0

        users_with_more_points = db.query(func.count(User.id)).join(
            UserPoints, UserPoints.user_id == User.id
        ).filter(
            User.is_active == True,
            UserPoints.total_points > points
        )
        if cutoff:
            users_with_more_points = users_with_more_points.filter(UserPoints.updated_at >= cutoff)
        rank = (users_with_more_points.scalar() or 0) + 1

        return {
            "user_id": current_user.id,
            "rank": rank if points > 0 else 0,
            "points": points,
            "clubs": clubs_count,
            "events": events_count,
            "period": period
        }
    except Exception as e:
        return {
            "user_id": current_user.id,
            "rank": 0,
            "points": 0,
            "clubs": 0,
            "events": 0,
            "period": period
        }


# ============= ANALYTICS DASHBOARD ENDPOINTS (Charts) =============

def _daily_series(db: Session, model, date_col, days: int) -> dict:
    """Đếm số bản ghi theo từng ngày trong `days` ngày qua -> {date_str: count}"""
    cutoff = datetime.utcnow() - timedelta(days=days - 1)
    cutoff_date = cutoff.date()
    rows = db.query(
        func.date(date_col).label("day"),
        func.count(model.id)
    ).filter(date_col >= cutoff).group_by("day").all()
    counts = {str(day): cnt for day, cnt in rows}
    series = {}
    for i in range(days):
        d = (cutoff_date + timedelta(days=i)).isoformat()
        series[d] = counts.get(d, 0)
    return series


@router.get("/trends")
def get_trends(db: Session = Depends(get_db), days: int = 30):
    """Chuỗi dữ liệu theo ngày cho biểu đồ: CLB mới, sự kiện, bài viết, đăng ký"""
    try:
        days = max(7, min(int(days), 365))
        labels = [(datetime.utcnow() - timedelta(days=i)).date().isoformat() for i in range(days - 1, -1, -1)]

        clubs = _daily_series(db, Club, Club.created_at, days)
        events = _daily_series(db, Event, Event.created_at, days)
        posts = _daily_series(db, Post, Post.created_at, days)
        registrations = _daily_series(db, EventRegistration, EventRegistration.registered_at, days)

        return {
            "labels": labels,
            "series": {
                "clubs": [clubs.get(d, 0) for d in labels],
                "events": [events.get(d, 0) for d in labels],
                "posts": [posts.get(d, 0) for d in labels],
                "registrations": [registrations.get(d, 0) for d in labels],
            }
        }
    except Exception as e:
        return {"labels": [], "series": {}, "error": str(e)}


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Phân bố CLB theo danh mục + số thành viên mỗi danh mục (biểu đồ tròn/thanh)"""
    try:
        club_rows = db.query(Club.category, func.count(Club.id)).filter(Club.is_active == True)\
            .group_by(Club.category).all()
        member_rows = db.query(Club.category, func.count(Membership.id))\
            .join(Membership, Membership.club_id == Club.id)\
            .filter(Club.is_active == True, Membership.is_active == True)\
            .group_by(Club.category).all()

        club_map = {c: n for c, n in club_rows}
        member_map = {c: n for c, n in member_rows}

        categories = sorted(set(list(club_map) + [c for c, _ in member_rows if c]))
        return {
            "categories": categories,
            "clubs": [club_map.get(c, 0) for c in categories],
            "members": [member_map.get(c, 0) for c in categories],
        }
    except Exception as e:
        return {"categories": [], "clubs": [], "members": [], "error": str(e)}


@router.get("/engagement")
def get_engagement(db: Session = Depends(get_db), days: int = 30):
    """Tương tác theo ngày: bình luận + reaction + bài viết (giữ chân / hoạt động)"""
    try:
        days = max(7, min(int(days), 365))
        from app.models import Comment, Reaction
        comments = _daily_series(db, Comment, Comment.created_at, days)
        reactions = _daily_series(db, Reaction, Reaction.created_at, days)
        posts = _daily_series(db, Post, Post.created_at, days)

        labels = list(comments.keys())
        total_comments = db.query(Comment).count()
        total_reactions = db.query(Reaction).count()

        return {
            "labels": labels,
            "series": {
                "comments": list(comments.values()),
                "reactions": list(reactions.values()),
                "posts": list(posts.values()),
            },
            "totals": {
                "comments": total_comments,
                "reactions": total_reactions,
                "posts": db.query(Post).count(),
                "active_members": db.query(Membership).filter(Membership.is_active == True).count(),
            }
        }
    except Exception as e:
        return {"labels": [], "series": {}, "totals": {}, "error": str(e)}
