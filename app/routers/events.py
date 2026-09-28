"""
Router quản lý Sự kiện
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import Event, EventRegistration, Club, User
from app.schemas import EventCreate, EventUpdate, EventOut, EventRegistrationOut
from app.security import require_user, get_current_user
from app.ai_service import ai_predict_event_success, ai_analyze_sentiment
from app.utils import award_points, create_notification, check_achievements, log_activity, notify_club_members

router = APIRouter(prefix="/api/events", tags=["events"])


def registered_event_ids(db: Session, user_id: int) -> set:
    """Tập ID sự kiện mà user đã đăng ký"""
    rows = db.query(EventRegistration.event_id).filter(
        EventRegistration.user_id == user_id
    ).all()
    return {r[0] for r in rows}


def serialize_events(events: List[Event], reg_ids: set) -> List[EventOut]:
    """Chuyển Event -> EventOut kèm cờ is_registered"""
    result = []
    for event in events:
        item = EventOut.model_validate(event)
        item.is_registered = event.id in reg_ids
        result.append(item)
    return result


@router.get("", response_model=List[EventOut])
def list_events(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    q: Optional[str] = None,
    club_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    upcoming: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """Danh sách sự kiện"""
    query = db.query(Event)

    if q:
        query = query.filter(
            or_(Event.title.ilike(f"%{q}%"), Event.description.ilike(f"%{q}%"))
        )
    if club_id:
        query = query.filter(Event.club_id == club_id)
    if status_filter:
        query = query.filter(Event.status == status_filter)
    if upcoming:
        query = query.filter(Event.start_time >= datetime.utcnow())

    events = query.order_by(Event.start_time.desc()).offset(skip).limit(limit).all()
    reg_ids = registered_event_ids(db, current_user.id) if current_user else set()
    return serialize_events(events, reg_ids)


@router.get("/upcoming", response_model=List[EventOut])
def upcoming_events(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    limit: int = 10
):
    """Sự kiện sắp tới"""
    events = db.query(Event).filter(Event.start_time >= datetime.utcnow())\
        .order_by(Event.start_time.asc()).limit(limit).all()
    reg_ids = registered_event_ids(db, current_user.id) if current_user else set()
    return serialize_events(events, reg_ids)


@router.get("/{event_id}")
def get_event(
    event_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chi tiết sự kiện"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Không tìm thấy sự kiện")
    # Lấy thêm thông tin mở rộng
    club = db.query(Club).filter(Club.id == event.club_id).first() if event.club_id else None
    is_registered = False
    if current_user:
        reg = db.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == current_user.id
        ).first()
        is_registered = reg is not None
    # Đảm bảo club không bị None khi truy vấn
    if event.club_id and not club:
        pass  # Club đã bị xóa, giữ None
    # Serialize thủ công để thêm field mở rộng
    result = {**event.__dict__}
    # Xóa field internal của SQLAlchemy
    result.pop("_sa_instance_state", None)
    result["club"] = {"id": club.id, "name": club.name, "logo": club.logo or ""} if club else None
    result["is_registered"] = is_registered
    return result


@router.post("", response_model=EventOut, status_code=201)
async def create_event(
    payload: EventCreate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Tạo sự kiện mới + AI dự đoán"""
    from app.models import Membership as MembershipModel

    club = db.query(Club).filter(Club.id == payload.club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Câu lạc bộ không tồn tại")

    membership = db.query(MembershipModel).filter(
        MembershipModel.user_id == current_user.id,
        MembershipModel.club_id == payload.club_id,
        MembershipModel.is_active == True
    ).first()

    if not membership and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn cần là thành viên CLB để tạo sự kiện")

    duration = 0
    if payload.end_time and payload.start_time:
        duration = (payload.end_time - payload.start_time).total_seconds() / 3600

    success_score = await ai_predict_event_success(
        payload.title, payload.description, payload.location,
        payload.max_participants, duration
    )

    sentiment = await ai_analyze_sentiment(payload.description)

    new_event = Event(
        title=payload.title,
        description=payload.description,
        club_id=payload.club_id,
        creator_id=current_user.id,
        location=payload.location,
        start_time=payload.start_time,
        end_time=payload.end_time,
        max_participants=payload.max_participants,
        cover_image=payload.cover_image or "",
        ai_success_score=success_score,
        ai_sentiment=sentiment
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    payload: EventUpdate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Cập nhật sự kiện"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Không tìm thấy sự kiện")

    if event.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Xóa sự kiện"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Không tìm thấy sự kiện")

    if event.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền xóa")

    event.status = "cancelled"
    db.commit()
    return {"message": "Đã hủy sự kiện"}


@router.post("/{event_id}/register")
def register_event(
    event_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Đăng ký tham gia sự kiện"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Không tìm thấy sự kiện")

    if event.start_time < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Sự kiện đã qua")

    if event.max_participants > 0 and event.current_participants >= event.max_participants:
        raise HTTPException(status_code=400, detail="Sự kiện đã đầy")

    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã đăng ký sự kiện này")

    reg = EventRegistration(event_id=event_id, user_id=current_user.id)
    db.add(reg)
    event.current_participants = (event.current_participants or 0) + 1
    db.commit()
    db.refresh(event)

    # Cộng điểm & tạo notification
    points_result = award_points(db, current_user.id, "register_event")
    create_notification(
        db, current_user.id, "event",
        f"Đăng ký thành công: {event.title}",
        f"Bạn đã đăng ký sự kiện. +{points_result['points_earned']} điểm!",
        "fa-calendar-check",
        f"/events/{event_id}"
    )
    achievements = check_achievements(db, current_user.id)
    log_activity(db, current_user.id, "register_event", "event", event_id, f"Đăng ký {event.title}")

    return {
        "message": "Đăng ký thành công",
        "event_title": event.title,
        "is_registered": True,
        "current_participants": event.current_participants,
        "max_participants": event.max_participants,
        "points_earned": points_result["points_earned"],
        "achievements_unlocked": achievements
    }


@router.post("/{event_id}/cancel-registration")
def cancel_registration(
    event_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Hủy đăng ký"""
    reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()

    if not reg:
        raise HTTPException(status_code=404, detail="Bạn chưa đăng ký")

    event = db.query(Event).filter(Event.id == event_id).first()
    db.delete(reg)
    if event and (event.current_participants or 0) > 0:
        event.current_participants -= 1
    db.commit()
    if event:
        db.refresh(event)

    return {
        "message": "Đã hủy đăng ký",
        "is_registered": False,
        "current_participants": event.current_participants if event else 0
    }


@router.post("/{event_id}/feedback")
async def submit_feedback(
    event_id: int,
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Gửi đánh giá sau sự kiện"""
    reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()

    if not reg:
        raise HTTPException(status_code=404, detail="Bạn chưa đăng ký sự kiện này")

    feedback = payload.get("feedback", "")
    rating = payload.get("rating")

    if rating and (rating < 1 or rating > 5):
        raise HTTPException(status_code=400, detail="Đánh giá từ 1-5")

    # AI phân tích cảm xúc feedback
    sentiment = await ai_analyze_sentiment(feedback)
    reg.feedback = feedback
    reg.rating = rating
    reg.attended = True
    db.commit()

    return {"message": "Cảm ơn bạn đã đánh giá!", "ai_sentiment": sentiment}


@router.get("/{event_id}/registrations", response_model=List[EventRegistrationOut])
def list_registrations(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    limit: int = 200
):
    """Danh sách người đã đăng ký (kèm thông tin user, có cờ is_me)"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Không tìm thấy sự kiện")

    regs = db.query(EventRegistration, User).join(User, User.id == EventRegistration.user_id)\
        .filter(EventRegistration.event_id == event_id)\
        .order_by(EventRegistration.registered_at.asc()).limit(limit).all()
    me_id = current_user.id if current_user else None

    return [
        EventRegistrationOut(
            id=r.id,
            event_id=r.event_id,
            user_id=u.id,
            attended=bool(r.attended),
            feedback=r.feedback,
            rating=r.rating,
            registered_at=r.registered_at,
            full_name=u.full_name,
            username=u.username,
            avatar=u.avatar or (u.full_name or u.username or "?")[0].upper(),
            faculty=u.faculty,
            student_id=u.student_id,
            class_name=u.class_name,
            is_me=(me_id is not None and u.id == me_id)
        )
        for r, u in regs
    ]


@router.get("/{event_id}/participants")
def get_event_participants(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    limit: int = 60
):
    """Tóm tắt người đã đăng ký sự kiện (dùng cho UI danh sách người tham gia)"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Không tìm thấy sự kiện")

    total = db.query(EventRegistration).filter(EventRegistration.event_id == event_id).count()
    regs = db.query(EventRegistration, User).join(User, User.id == EventRegistration.user_id)\
        .filter(EventRegistration.event_id == event_id)\
        .order_by(EventRegistration.registered_at.desc()).limit(limit).all()
    me_id = current_user.id if current_user else None

    club = db.query(Club).filter(Club.id == event.club_id).first() if event.club_id else None

    return {
        "event_id": event.id,
        "total": total,
        "shown": len(regs),
        "current_participants": event.current_participants or 0,
        "max_participants": event.max_participants or 0,
        "is_registered": any(u.id == me_id for _, u in regs) if me_id else False,
        "club": {"id": club.id, "name": club.name, "logo": club.logo or ""} if club else None,
        "participants": [
            {
                "user_id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "avatar": u.avatar or (u.full_name or u.username or "?")[0].upper(),
                "faculty": u.faculty,
                "student_id": u.student_id,
                "class_name": u.class_name,
                "registered_at": r.registered_at.isoformat(),
                "attended": bool(r.attended),
                "is_me": (me_id is not None and u.id == me_id)
            }
            for r, u in regs
        ]
    }
