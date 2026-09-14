"""
Router cho Polls, Event CheckIn, Ratings, Messages, Mentors, Documents
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List
from datetime import datetime, timedelta
import secrets
import json

from app.database import get_db
from app.models import (
    Poll, PollOption, PollVote, Event, EventCheckIn, EventRegistration,
    EventRating, Message, MentorConnection, Document, Comment,
    User, Club, Membership
)
from app.security import require_user
from app.utils import award_points, create_notification, log_activity

router = APIRouter(prefix="/api", tags=["extras"])

# ============= POLLS =============

@router.get("/clubs/{club_id}/polls")
def list_polls(club_id: int, db: Session = Depends(get_db)):
    """Danh sách polls của CLB"""
    polls = db.query(Poll).filter(Poll.club_id == club_id, Poll.is_active == True)\
        .order_by(desc(Poll.created_at)).all()
    return [
        {
            "id": p.id,
            "question": p.question,
            "description": p.description,
            "is_multiple": p.is_multiple,
            "is_anonymous": p.is_anonymous,
            "closes_at": p.closes_at.isoformat() if p.closes_at else None,
            "created_at": p.created_at.isoformat(),
            "total_votes": sum(opt.vote_count for opt in p.options)
        } for p in polls
    ]


@router.post("/polls")
def create_poll(
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Tạo poll mới"""
    poll = Poll(
        club_id=payload["club_id"],
        creator_id=current_user.id,
        question=payload["question"],
        description=payload.get("description"),
        is_multiple=payload.get("is_multiple", False),
        is_anonymous=payload.get("is_anonymous", False),
        closes_at=datetime.fromisoformat(payload["closes_at"]) if payload.get("closes_at") else None
    )
    db.add(poll)
    db.commit()
    db.refresh(poll)

    # Thêm options
    for i, opt_text in enumerate(payload.get("options", [])):
        opt = PollOption(poll_id=poll.id, text=opt_text, order_index=i)
        db.add(opt)

    db.commit()

    # Thông báo cho thành viên CLB
    create_notification(
        db, current_user.id, "poll",
        f"📊 Poll mới: {poll.question}",
        "Câu lạc bộ vừa tạo một cuộc bình chọn mới",
        "fa-square-poll-vertical",
        f"/clubs/{poll.club_id}"
    )

    return {"id": poll.id, "message": "Tạo poll thành công"}


@router.get("/polls/{poll_id}")
def get_poll(poll_id: int, db: Session = Depends(get_db)):
    """Chi tiết poll + options + kết quả vote"""
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(404, "Poll not found")

    options = db.query(PollOption).filter(PollOption.poll_id == poll_id)\
        .order_by(PollOption.order_index).all()

    total = sum(o.vote_count for o in options) or 1
    return {
        "id": poll.id,
        "club_id": poll.club_id,
        "question": poll.question,
        "description": poll.description,
        "is_multiple": poll.is_multiple,
        "is_anonymous": poll.is_anonymous,
        "closes_at": poll.closes_at.isoformat() if poll.closes_at else None,
        "is_active": poll.is_active,
        "options": [
            {
                "id": o.id,
                "text": o.text,
                "vote_count": o.vote_count,
                "percent": round((o.vote_count / total) * 100, 1)
            } for o in options
        ]
    }


@router.post("/polls/{poll_id}/vote")
def vote_poll(
    poll_id: int,
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Vote cho poll"""
    option_ids = payload.get("option_ids", [])
    if not option_ids:
        raise HTTPException(400, "Chưa chọn đáp án")

    poll = db.query(Poll).filter(Poll.id == poll_id, Poll.is_active == True).first()
    if not poll:
        raise HTTPException(404, "Poll không tồn tại hoặc đã đóng")

    # Xóa vote cũ của user nếu có (cho phép đổi vote)
    db.query(PollVote).filter(
        PollVote.poll_id == poll_id,
        PollVote.user_id == current_user.id
    ).delete()

    # Thêm vote mới
    for opt_id in option_ids:
        vote = PollVote(poll_id=poll_id, option_id=opt_id, user_id=current_user.id)
        db.add(vote)
        # Tăng vote count
        opt = db.query(PollOption).filter(PollOption.id == opt_id).first()
        if opt:
            opt.vote_count += 1

    db.commit()
    award_points(db, current_user.id, "comment", 3)  # Cộng điểm khi vote
    return {"message": "Vote thành công"}


# ============= EVENT CHECK-IN QR =============

@router.post("/events/{event_id}/checkin")
def checkin_event(
    event_id: int,
    payload: dict,
    db: Session = Depends(get_db)
):
    """Check-in sự kiện bằng QR code"""
    qr_code = payload.get("qr_code", "").strip()

    checkin = db.query(EventCheckIn).filter(
        EventCheckIn.event_id == event_id,
        EventCheckIn.qr_code == qr_code
    ).first()

    if not checkin:
        raise HTTPException(404, "Mã QR không hợp lệ")

    if checkin.checked_in_at:
        return {"message": "Đã check-in trước đó", "checked_in_at": checkin.checked_in_at.isoformat()}

    checkin.checked_in_at = datetime.utcnow()
    db.commit()

    # Cộng điểm
    award_points(db, checkin.user_id, "attend_event")

    return {
        "message": "Check-in thành công",
        "user_id": checkin.user_id,
        "checked_in_at": checkin.checked_in_at.isoformat()
    }


@router.post("/events/{event_id}/generate-qr")
def generate_event_qr(
    event_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Tạo QR code cho người đã đăng ký"""
    # Tìm registration
    reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()

    if not reg:
        raise HTTPException(400, "Bạn chưa đăng ký sự kiện")

    # Tìm hoặc tạo check-in
    checkin = db.query(EventCheckIn).filter(
        EventCheckIn.event_id == event_id,
        EventCheckIn.user_id == current_user.id
    ).first()

    if not checkin:
        qr_code = f"EVT{event_id}U{current_user.id}{secrets.token_urlsafe(8).upper()}"
        checkin = EventCheckIn(
            event_id=event_id,
            user_id=current_user.id,
            qr_code=qr_code
        )
        db.add(checkin)
        db.commit()
        db.refresh(checkin)

    return {
        "qr_code": checkin.qr_code,
        "event_id": event_id,
        "checked_in_at": checkin.checked_in_at.isoformat() if checkin.checked_in_at else None
    }


# ============= EVENT RATING =============

@router.post("/events/{event_id}/rate")
def rate_event(
    event_id: int,
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Đánh giá sự kiện 1-5 sao + review"""
    rating = payload.get("rating", 0)
    if not 1 <= rating <= 5:
        raise HTTPException(400, "Rating phải từ 1-5")

    # Kiểm tra đã rate chưa
    existing = db.query(EventRating).filter(
        EventRating.event_id == event_id,
        EventRating.user_id == current_user.id
    ).first()

    if existing:
        existing.rating = rating
        existing.review = payload.get("review")
        existing.would_recommend = payload.get("would_recommend", True)
        existing.aspects = json.dumps(payload.get("aspects", {}))
    else:
        rating_obj = EventRating(
            event_id=event_id,
            user_id=current_user.id,
            rating=rating,
            review=payload.get("review"),
            would_recommend=payload.get("would_recommend", True),
            aspects=json.dumps(payload.get("aspects", {}))
        )
        db.add(rating_obj)

    db.commit()
    award_points(db, current_user.id, "comment", 5)
    return {"message": "Cảm ơn bạn đã đánh giá!"}


@router.get("/events/{event_id}/ratings")
def get_event_ratings(event_id: int, db: Session = Depends(get_db)):
    """Lấy đánh giá của sự kiện"""
    ratings = db.query(EventRating, User).join(User, User.id == EventRating.user_id)\
        .filter(EventRating.event_id == event_id).all()

    avg = db.query(func.avg(EventRating.rating)).filter(
        EventRating.event_id == event_id
    ).scalar() or 0

    recommend_pct = db.query(EventRating).filter(
        EventRating.event_id == event_id,
        EventRating.would_recommend == True
    ).count()

    total = len(ratings)
    return {
        "average_rating": round(float(avg), 1),
        "total_ratings": total,
        "recommend_percent": round((recommend_pct / total * 100) if total else 0, 1),
        "ratings": [
            {
                "id": r.id,
                "rating": r.rating,
                "review": r.review,
                "user_name": u.full_name,
                "created_at": r.created_at.isoformat()
            } for r, u in ratings
        ]
    }


# ============= MESSAGES =============

@router.get("/messages")
def get_messages(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Lấy tin nhắn của user"""
    messages = db.query(Message, User).join(User, User.id == Message.sender_id)\
        .filter(
            (Message.receiver_id == current_user.id) | (Message.sender_id == current_user.id)
        ).order_by(Message.created_at.desc()).limit(50).all()

    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": u.full_name,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat()
        } for m, u in messages
    ]


@router.post("/messages")
def send_message(
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Gửi tin nhắn"""
    content = (payload.get("content") or "").strip()
    if not content:
        raise HTTPException(400, "Tin nhắn không được trống")
    if len(content) > 2000:
        raise HTTPException(400, "Tin nhắn quá dài (tối đa 2000 ký tự)")
    receiver_id = payload.get("receiver_id")
    if not receiver_id:
        raise HTTPException(400, "Thiếu receiver_id")
    if receiver_id == current_user.id:
        raise HTTPException(400, "Không thể gửi tin nhắn cho chính mình")
    msg = Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        club_id=payload.get("club_id"),
        content=content
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"id": msg.id, "message": "Đã gửi"}


@router.get("/messages/conversations")
def list_conversations(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Danh sách các cuộc hội thoại (group theo user khác)"""
    # Lấy tất cả tin nhắn liên quan
    msgs = db.query(Message).filter(
        (Message.receiver_id == current_user.id) | (Message.sender_id == current_user.id)
    ).order_by(Message.created_at.desc()).all()

    # Group theo user khác
    threads = {}
    for m in msgs:
        other_id = m.sender_id if m.receiver_id == current_user.id else m.receiver_id
        if other_id is None or other_id == current_user.id:
            continue
        if other_id not in threads:
            other = db.query(User).filter(User.id == other_id).first()
            if not other:
                continue
            threads[other_id] = {
                "other_id": other_id,
                "other_name": other.full_name,
                "other_avatar": other.avatar or "",
                "last_message": m.content,
                "last_time": m.created_at.isoformat() if m.created_at else None,
                "unread_count": 0,
            }
        if m.receiver_id == current_user.id and not m.is_read:
            threads[other_id]["unread_count"] += 1

    return sorted(threads.values(), key=lambda x: x["last_time"] or "", reverse=True)


@router.get("/messages/with/{user_id}")
def get_thread(
    user_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Lấy thread tin nhắn giữa current_user và user_id"""
    msgs = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.created_at.asc()).all()

    # Mark tin nhắn nhận là đã đọc
    for m in msgs:
        if m.receiver_id == current_user.id:
            m.is_read = True
    db.commit()

    return [{
        "id": m.id,
        "sender_id": m.sender_id,
        "receiver_id": m.receiver_id,
        "content": m.content,
        "is_read": m.is_read,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    } for m in msgs]


# ============= MENTOR =============

@router.post("/mentors/request")
def request_mentor(
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Yêu cầu kết nối mentor"""
    mentor_id = payload.get("mentor_id")
    mentor = db.query(User).filter(User.id == mentor_id, User.role.in_(["leader", "admin"])).first()
    if not mentor:
        raise HTTPException(404, "Không tìm thấy mentor")

    conn = MentorConnection(
        mentor_id=mentor_id,
        mentee_id=current_user.id,
        club_id=payload.get("club_id"),
        status="pending"
    )
    db.add(conn)
    db.commit()

    create_notification(
        db, mentor_id, "mentor",
        f"🤝 Yêu cầu Mentor",
        f"{current_user.full_name} muốn kết nối với bạn để được hỗ trợ",
        "fa-handshake",
        "/profile"
    )

    return {"message": "Đã gửi yêu cầu"}


@router.get("/mentors")
def list_mentors(
    db: Session = Depends(get_db),
    club_id: Optional[int] = None
):
    """Danh sách mentor có thể kết nối"""
    query = db.query(User).filter(
        User.role.in_(["leader", "admin"]),
        User.is_public == True,
        User.is_active == True
    )
    if club_id:
        # Lấy chủ nhiệm các CLB
        query = query.join(Membership, Membership.user_id == User.id).filter(
            Membership.club_id == club_id,
            Membership.role == "president"
        )

    mentors = query.limit(20).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "faculty": u.faculty,
            "class_name": u.class_name,
            "bio": (u.bio or "")[:150],
            "skills": u.skills
        } for u in mentors
    ]


# ============= DOCUMENTS =============

@router.get("/clubs/{club_id}/documents")
def list_documents(club_id: int, db: Session = Depends(get_db)):
    """Tài liệu của CLB"""
    docs = db.query(Document, User).join(User, User.id == Document.uploader_id)\
        .filter(Document.club_id == club_id).order_by(desc(Document.created_at)).all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "description": d.description,
            "file_url": d.file_url,
            "file_type": d.file_type,
            "category": d.category,
            "download_count": d.download_count,
            "uploader_name": u.full_name,
            "created_at": d.created_at.isoformat()
        } for d, u in docs
    ]


@router.post("/clubs/{club_id}/documents")
def add_document(
    club_id: int,
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Thêm tài liệu"""
    doc = Document(
        club_id=club_id,
        uploader_id=current_user.id,
        title=payload["title"],
        description=payload.get("description"),
        file_url=payload.get("file_url"),
        file_type=payload.get("file_type"),
        category=payload.get("category")
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "message": "Thêm thành công"}


# ============= COMMENTS =============

@router.get("/comments")
def list_comments(
    target_type: str,  # post | event
    target_id: int,
    db: Session = Depends(get_db)
):
    """Lấy danh sách bình luận của bài viết / sự kiện"""
    if target_type not in ("post", "event"):
        raise HTTPException(400, "target_type phải là 'post' hoặc 'event'")
    rows = db.query(Comment, User).join(User, User.id == Comment.user_id)\
        .filter(Comment.target_type == target_type, Comment.target_id == target_id)\
        .order_by(Comment.created_at.asc()).all()
    return [
        {
            "id": c.id,
            "user_id": c.user_id,
            "user_name": u.full_name,
            "user_avatar": u.avatar or "",
            "user_role": u.role,
            "content": c.content,
            "parent_id": c.parent_id,
            "likes": c.likes or 0,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c, u in rows
    ]


@router.post("/comments")
def create_comment(
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Tạo bình luận mới"""
    target_type = payload.get("target_type")
    target_id = payload.get("target_id")
    content = (payload.get("content") or "").strip()
    parent_id = payload.get("parent_id")

    if target_type not in ("post", "event"):
        raise HTTPException(400, "target_type phải là 'post' hoặc 'event'")
    if not target_id:
        raise HTTPException(400, "Thiếu target_id")
    if not content:
        raise HTTPException(400, "Nội dung bình luận không được trống")
    if len(content) > 2000:
        raise HTTPException(400, "Bình luận quá dài (tối đa 2000 ký tự)")

    c = Comment(
        user_id=current_user.id,
        target_type=target_type,
        target_id=target_id,
        content=content,
        parent_id=parent_id,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "user_id": c.user_id,
        "user_name": current_user.full_name,
        "user_avatar": current_user.avatar or "",
        "user_role": current_user.role,
        "content": c.content,
        "parent_id": c.parent_id,
        "likes": 0,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Xóa bình luận (chủ comment hoặc admin)"""
    c = db.query(Comment).filter(Comment.id == comment_id).first()
    if not c:
        raise HTTPException(404, "Bình luận không tồn tại")
    if c.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Bạn không có quyền xóa bình luận này")
    db.delete(c)
    db.commit()
    return {"message": "Đã xóa bình luận"}


@router.post("/comments/{comment_id}/like")
def like_comment(
    comment_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Like/unlike bình luận (toggle)"""
    c = db.query(Comment).filter(Comment.id == comment_id).first()
    if not c:
        raise HTTPException(404, "Bình luận không tồn tại")
    c.likes = (c.likes or 0) + 1
    db.commit()
    return {"likes": c.likes}
