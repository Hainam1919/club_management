"""
Helper utilities: notifications, activity logs, gamification
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models import (
    Notification, ActivityLog, UserPoints, UserAchievement,
    Achievement, User, EventRegistration, Membership
)


def create_notification(
    db: Session,
    user_id: int,
    type: str,
    title: str,
    message: str = "",
    icon: str = "fa-bell",
    link: str = ""
) -> Notification:
    """Tạo thông báo mới cho user"""
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        icon=icon,
        link=link
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def notify_club_members(
    db: Session,
    club_id: int,
    type: str,
    title: str,
    message: str,
    icon: str = "fa-bell",
    link: str = "",
    exclude_user_id: Optional[int] = None
):
    """Gửi thông báo cho tất cả thành viên CLB"""
    members = db.query(Membership).filter(
        Membership.club_id == club_id,
        Membership.is_active == True
    ).all()

    for m in members:
        if m.user_id != exclude_user_id:
            create_notification(db, m.user_id, type, title, message, icon, link)


def log_activity(
    db: Session,
    user_id: Optional[int],
    action: str,
    target_type: str = "",
    target_id: Optional[int] = None,
    description: str = "",
    ip_address: str = ""
):
    """Ghi log hoạt động"""
    log = ActivityLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        description=description,
        ip_address=ip_address
    )
    db.add(log)
    db.commit()


# ============= GAMIFICATION =============

LEVEL_THRESHOLDS = [
    (0, 1, "Tân binh", "🌱"),
    (100, 2, "Đồng", "🥉"),
    (300, 3, "Bạc", "🥈"),
    (700, 4, "Vàng", "🥇"),
    (1500, 5, "Bạch kim", "💎"),
    (3000, 6, "Kim cương", "💠"),
    (6000, 7, "Huyền thoại", "👑")
]

POINT_REWARDS = {
    "join_club": 10,
    "create_event": 30,
    "register_event": 5,
    "attend_event": 15,
    "create_post": 20,
    "comment": 2,
    "like_received": 1,
    "login_streak": 5,
    "complete_profile": 50,
    "first_comment": 10,
    "week_active": 25
}


def calculate_level(total_points: int):
    """Tính level dựa trên tổng điểm"""
    current = LEVEL_THRESHOLDS[0]
    for threshold, lvl, rank, badge in LEVEL_THRESHOLDS:
        if total_points >= threshold:
            current = (threshold, lvl, rank, badge)
    return current


def award_points(db: Session, user_id: int, action: str, custom_points: int = 0) -> dict:
    """
    Cộng điểm cho user khi thực hiện hành động
    Returns thông tin level mới
    """
    points = custom_points or POINT_REWARDS.get(action, 5)

    user_points = db.query(UserPoints).filter(UserPoints.user_id == user_id).first()
    if not user_points:
        user_points = UserPoints(user_id=user_id, total_points=0, level=1, experience=0)
        db.add(user_points)
        db.commit()

    old_level = user_points.level
    user_points.total_points += points

    # Tính level & rank
    threshold, new_level, rank, badge = calculate_level(user_points.total_points)
    user_points.level = new_level
    user_points.rank = rank

    if new_level > old_level:
        # Level up notification
        create_notification(
            db, user_id, "achievement",
            f"🎉 Lên cấp {new_level} - {rank}!",
            f"Chúc mừng! Bạn đã đạt {user_points.total_points} điểm và thăng hạng {rank}",
            "fa-trophy",
            "/profile"
        )

    db.commit()
    db.refresh(user_points)

    return {
        "points_earned": points,
        "total_points": user_points.total_points,
        "level": new_level,
        "rank": rank,
        "badge": badge,
        "leveled_up": new_level > old_level
    }


def check_achievements(db: Session, user_id: int) -> list:
    """Kiểm tra và trao thành tích"""
    earned = []

    # Đếm số CLB đã tham gia
    clubs_count = db.query(Membership).filter(
        Membership.user_id == user_id,
        Membership.is_active == True
    ).count()

    # Đếm số sự kiện đã đăng ký
    events_count = db.query(EventRegistration).filter(
        EventRegistration.user_id == user_id
    ).count()

    # Lấy các thành tích có thể đạt được
    achievements_to_check = []

    if clubs_count >= 1:
        achievements_to_check.append(("first_join", 100))
    if clubs_count >= 3:
        achievements_to_check.append(("social_butterfly", 200))
    if clubs_count >= 5:
        achievements_to_check.append(("community_leader", 500))
    if events_count >= 5:
        achievements_to_check.append(("event_enthusiast", 200))
    if events_count >= 10:
        achievements_to_check.append(("event_master", 500))

    for code, points in achievements_to_check:
        ach = db.query(Achievement).filter(Achievement.code == code).first()
        if not ach:
            continue
        # Kiểm tra đã có chưa
        existing = db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == ach.id
        ).first()
        if not existing:
            ua = UserAchievement(user_id=user_id, achievement_id=ach.id)
            db.add(ua)
            create_notification(
                db, user_id, "achievement",
                f"🏆 Mở khóa thành tích: {ach.name}",
                ach.description or "",
                "fa-medal",
                "/profile"
            )
            award_points(db, user_id, "achievement_unlocked", ach.points)
            earned.append(ach.name)

    db.commit()
    return earned


def init_default_achievements(db: Session):
    """Khởi tạo danh sách thành tích mặc định"""
    defaults = [
        ("first_join", "Thành viên mới", "Tham gia CLB đầu tiên", "🎯", 100, "common", "social"),
        ("social_butterfly", "Bướm xã hội", "Tham gia 3 CLB", "🦋", 200, "rare", "social"),
        ("community_leader", "Lãnh đạo cộng đồng", "Tham gia 5 CLB trở lên", "👑", 500, "epic", "leadership"),
        ("event_enthusiast", "Đam mê sự kiện", "Đăng ký 5 sự kiện", "🎪", 200, "rare", "activity"),
        ("event_master", "Bậc thầy sự kiện", "Tham gia 10 sự kiện trở lên", "🏆", 500, "epic", "activity"),
        ("early_bird", "Chim sớm", "Đăng ký sự kiện trong 24h đầu", "🐦", 150, "rare", "activity"),
        ("ai_explorer", "Nhà thám hiểm AI", "Sử dụng AI Assistant 10 lần", "🤖", 300, "epic", "activity"),
        ("veteran", "Cựu chiến binh", "Hoạt động trên 6 tháng", "⭐", 1000, "legendary", "leadership")
    ]

    for code, name, desc, icon, points, rarity, category in defaults:
        existing = db.query(Achievement).filter(Achievement.code == code).first()
        if not existing:
            ach = Achievement(
                code=code, name=name, description=desc,
                icon=icon, points=points, rarity=rarity, category=category
            )
            db.add(ach)
    db.commit()
