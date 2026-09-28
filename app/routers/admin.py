"""
Router Admin: Quản lý Users, Upload, Email, Stats nâng cao
"""
import csv
import io
import os
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_, and_
from typing import Optional

from app.database import get_db
from app.models import (
    User, Club, Event, Post, Membership, EventRegistration,
    FileUpload, EmailLog, Comment, Notification, EventRating, Reaction
)
from app.security import require_admin
from app.utils import create_notification, log_activity

router = APIRouter(prefix="/api/admin", tags=["admin"])

# ============= USER MANAGEMENT =============

@router.get("/users")
def list_all_users(
    q: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    faculty: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin xem tất cả users (kể cả bị khóa)"""
    query = db.query(User)

    if q:
        query = query.filter(
            (User.full_name.ilike(f"%{q}%")) |
            (User.username.ilike(f"%{q}%")) |
            (User.email.ilike(f"%{q}%")) |
            (User.student_id.ilike(f"%{q}%"))
        )
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if faculty:
        query = query.filter(User.faculty == faculty)

    total = query.count()
    users = query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "student_id": u.student_id,
                "class_name": u.class_name,
                "faculty": u.faculty,
                "is_active": u.is_active,
                "is_public": u.is_public,
                "avatar": u.avatar,
                "created_at": u.created_at.isoformat(),
                "last_login": u.last_login.isoformat() if u.last_login else None
            } for u in users
        ]
    }


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Khóa/Mở khóa tài khoản user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role == "admin":
        raise HTTPException(400, "Không thể khóa tài khoản admin")

    user.is_active = not user.is_active
    db.commit()

    # Thông báo cho user
    if not user.is_active:
        create_notification(
            db, user.id, "system",
            "🔒 Tài khoản bị khóa",
            "Tài khoản của bạn đã bị khóa bởi Admin. Liên hệ admin@ictu.edu.vn để biết thêm.",
            "fa-lock",
            "/profile"
        )

    return {
        "user_id": user.id,
        "is_active": user.is_active,
        "message": "Đã khóa" if not user.is_active else "Đã mở khóa"
    }


@router.put("/users/{user_id}/role")
def change_user_role(
    user_id: int,
    payload: dict,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Thay đổi role user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    new_role = payload.get("role")
    if new_role not in ["admin", "leader", "member"]:
        raise HTTPException(400, "Role không hợp lệ")

    user.role = new_role
    db.commit()

    create_notification(
        db, user.id, "system",
        f"🎖️ Vai trò mới: {new_role}",
        f"Bạn đã được thay đổi vai trò thành {new_role}",
        "fa-shield",
        "/profile"
    )

    return {"message": f"Đã đổi role thành {new_role}"}


@router.post("/users/{user_id}/reset-password")
def admin_reset_password(
    user_id: int,
    payload: dict,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin reset mật khẩu cho user"""
    from app.security import hash_password

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    new_password = payload.get("new_password", "123456")
    user.hashed_password = hash_password(new_password)
    db.commit()

    create_notification(
        db, user.id, "system",
        "🔑 Mật khẩu đã được reset",
        f"Admin đã reset mật khẩu của bạn. Mật khẩu mới: {new_password}",
        "fa-key",
        "/profile"
    )

    return {
        "message": "Đã reset mật khẩu",
        "new_password": new_password
    }


# ============= FILE UPLOAD =============

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    target_type: str = Form("general"),
    target_id: Optional[int] = Form(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Upload file (avatar, banner, post image, etc.) - Admin only"""
    # Validate file
    if file.content_type not in ALLOWED_IMAGE_TYPES and not file.content_type.startswith("image/"):
        raise HTTPException(400, f"Chỉ chấp nhận file ảnh. Got: {file.content_type}")

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    unique_name = f"{secrets.token_urlsafe(16)}{ext}"

    # Determine subdirectory
    subdir_map = {
        "avatar": "avatars",
        "club_logo": "banners",
        "club_banner": "banners",
        "post": "posts",
        "event": "events",
        "document": "documents"
    }
    subdir = subdir_map.get(target_type, "general")
    target_dir = os.path.join(UPLOAD_DIR, subdir)
    os.makedirs(target_dir, exist_ok=True)

    file_path = os.path.join(target_dir, unique_name)

    # Save file
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File quá lớn. Max {MAX_FILE_SIZE//1024//1024}MB")

    with open(file_path, "wb") as f:
        f.write(content)

    # Save to DB
    file_size = len(content)
    upload = FileUpload(
        uploader_id=current_user.id,
        filename=unique_name,
        original_name=file.filename,
        file_path=f"uploads/{subdir}/{unique_name}",
        file_type="image",
        mime_type=file.content_type,
        file_size=file_size,
        target_type=target_type,
        target_id=target_id
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    # Update target with file URL
    file_url = f"/{upload.file_path}"
    if target_type == "avatar" and target_id:
        user = db.query(User).filter(User.id == target_id).first()
        if user:
            user.avatar = file_url
            db.commit()
    elif target_type == "club_logo" and target_id:
        club = db.query(Club).filter(Club.id == target_id).first()
        if club:
            club.logo = file_url
            db.commit()
    elif target_type == "club_banner" and target_id:
        club = db.query(Club).filter(Club.id == target_id).first()
        if club:
            club.banner = file_url
            db.commit()

    return {
        "id": upload.id,
        "filename": unique_name,
        "url": file_url,
        "size": file_size,
        "target_type": target_type
    }


# ============= EMAIL SYSTEM =============

@router.post("/emails/send")
async def send_email(
    payload: dict,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Gửi email (log vào DB - production sẽ dùng SMTP) - Admin only"""
    user_id = payload.get("user_id")
    to_email = payload.get("to_email")
    subject = payload.get("subject", "Thông báo từ CLB Hub")
    body = payload.get("body", "")
    email_type = payload.get("email_type", "notification")

    if not to_email and user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            to_email = user.email

    if not to_email:
        raise HTTPException(400, "Thiếu email người nhận")

    # Log email
    log = EmailLog(
        user_id=user_id,
        to_email=to_email,
        subject=subject,
        body=body,
        email_type=email_type,
        status="sent",  # Giả lập đã gửi thành công
        sent_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()

    return {
        "id": log.id,
        "message": "Email đã được gửi (logged)",
        "to": to_email,
        "subject": subject
    }


@router.post("/emails/send-bulk")
async def send_bulk_email(
    payload: dict,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Gửi email hàng loạt cho nhiều users - Admin only"""
    target = payload.get("target", "all")  # all, club, role
    target_id = payload.get("target_id")
    subject = payload.get("subject", "")
    body = payload.get("body", "")

    query = db.query(User)
    if target == "club" and target_id:
        query = query.join(Membership, Membership.user_id == User.id)\
            .filter(Membership.club_id == target_id, Membership.is_active == True)
    elif target == "role":
        role = payload.get("role", "member")
        query = query.filter(User.role == role)

    users = query.all()
    sent_count = 0
    for u in users:
        log = EmailLog(
            user_id=u.id,
            to_email=u.email,
            subject=subject,
            body=body,
            email_type="newsletter",
            status="sent",
            sent_at=datetime.utcnow()
        )
        db.add(log)
        sent_count += 1

    db.commit()
    return {"message": f"Đã gửi email cho {sent_count} người"}


@router.get("/emails/logs")
def get_email_logs(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Xem lịch sử email đã gửi - Admin only"""
    logs = db.query(EmailLog).order_by(desc(EmailLog.created_at)).limit(limit).all()
    return [
        {
            "id": l.id,
            "to": l.to_email,
            "subject": l.subject,
            "type": l.email_type,
            "status": l.status,
            "sent_at": l.sent_at.isoformat() if l.sent_at else None
        } for l in logs
    ]


# ============= ADVANCED STATS =============

@router.get("/stats/advanced")
def advanced_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Thống kê nâng cao cho admin - Admin only"""
    now = datetime.utcnow()
    last_30 = now - timedelta(days=30)
    last_7 = now - timedelta(days=7)

    return {
        "users": {
            "total": db.query(User).count(),
            "active": db.query(User).filter(User.is_active == True).count(),
            "new_30d": db.query(User).filter(User.created_at >= last_30).count(),
            "new_7d": db.query(User).filter(User.created_at >= last_7).count(),
            "by_role": {
                "admin": db.query(User).filter(User.role == "admin").count(),
                "leader": db.query(User).filter(User.role == "leader").count(),
                "member": db.query(User).filter(User.role == "member").count()
            }
        },
        "clubs": {
            "total": db.query(Club).count(),
            "active": db.query(Club).filter(Club.is_active == True).count(),
            "total_members": db.query(Membership).filter(Membership.is_active == True).count()
        },
        "events": {
            "total": db.query(Event).count(),
            "upcoming": db.query(Event).filter(Event.start_time >= now).count(),
            "completed": db.query(Event).filter(Event.status == "completed").count(),
            "registrations": db.query(EventRegistration).count()
        },
        "posts": {
            "total": db.query(Post).count(),
            "comments": db.query(Comment).count()
        },
        "engagement": {
            "total_reactions": db.query(func.count()).select_from(Reaction).scalar() or 0
        }
    }


# ============= EXPORT CSV =============

@router.get("/export/{entity}")
def export_csv(
    entity: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Export CSV: users, clubs, events, posts, ratings (chỉ Admin)"""

    if entity == "users":
        rows = db.query(User).all()
        data = [["ID", "Username", "Email", "Họ tên", "MSSV", "Khoa", "Role", "Ngày tạo"]]
        for u in rows:
            data.append([u.id, u.username, u.email or "", u.full_name or "", u.student_id or "",
                        u.faculty or "", u.role, u.created_at.isoformat() if u.created_at else ""])
    elif entity == "clubs":
        rows = db.query(Club).all()
        data = [["ID", "Tên", "Slug", "Danh mục", "Thành viên", "Ngày TL", "Trạng thái"]]
        for c in rows:
            data.append([c.id, c.name, c.slug, c.category or "", c.member_count,
                        c.founded_date.isoformat()[:10] if c.founded_date else "",
                        "Hoạt động" if c.is_active else "Ngừng"])
    elif entity == "events":
        rows = db.query(Event).all()
        data = [["ID", "Tiêu đề", "CLB", "Bắt đầu", "Địa điểm", "Max", "Đã đăng ký", "Trạng thái"]]
        for e in rows:
            data.append([e.id, e.title, e.club_id, e.start_time.isoformat()[:16] if e.start_time else "",
                        e.location or "", e.max_participants, e.current_participants, e.status])
    elif entity == "posts":
        rows = db.query(Post).all()
        data = [["ID", "Tiêu đề", "Tác giả", "CLB", "Lượt xem", "Ngày tạo"]]
        for p in rows:
            data.append([p.id, p.title, p.author_id, p.club_id, p.views,
                        p.created_at.isoformat()[:10] if p.created_at else ""])
    elif entity == "ratings":
        rows = db.query(EventRating).all()
        data = [["ID", "Sự kiện", "User", "Sao", "Review", "Đề xuất", "Ngày"]]
        for r in rows:
            data.append([r.id, r.event_id, r.user_id, r.rating, (r.review or "")[:200],
                        "Có" if r.would_recommend else "Không",
                        r.created_at.isoformat()[:10] if r.created_at else ""])
    else:
        raise HTTPException(400, "Loại không hợp lệ. Chọn: users, clubs, events, posts, ratings")

    # Tạo CSV
    output = io.StringIO()
    output.write('﻿')  # BOM để Excel đọc được tiếng Việt
    writer = csv.writer(output)
    writer.writerows(data)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={entity}_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"}
    )
