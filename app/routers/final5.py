"""
Router cho 5 tính năng cuối:
1. Certificate - Chứng nhận
2. QR Scanner - API scan QR
3. Reports - Báo cáo nhà trường
4. PWA - Manifest (handled by frontend)
5. Event Gallery - Album ảnh
"""
import secrets
import base64
import io
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List

try:
    import qrcode
    from PIL import Image
    QR_AVAILABLE = True
except ImportError:
    QR_AVAILABLE = False

from app.database import get_db
from app.models import (
    Certificate, Event, EventGallery, User, Club, Membership, EventRegistration,
    Post, Comment, UserPoints, QAQuestion
)
from app.security import require_user
from app.utils import create_notification, award_points

router = APIRouter(prefix="/api", tags=["final"])


# ============= 1. CERTIFICATE =============

@router.get("/certificates")
def get_my_certificates(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Lấy chứng nhận của tôi"""
    certs = db.query(Certificate, Club).join(Club, Club.id == Certificate.club_id)\
        .filter(Certificate.user_id == current_user.id)\
        .order_by(desc(Certificate.issued_date)).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "certificate_type": c.certificate_type,
            "club_name": cl.name,
            "issued_date": c.issued_date.isoformat(),
            "verify_code": c.verify_code,
            "verify_url": f"/verify/{c.verify_code}"
        } for c, cl in certs
    ]


@router.post("/certificates/issue")
def issue_certificate(
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Cấp chứng nhận (chủ nhiệm hoặc admin)"""
    user_id = payload.get("user_id")
    club_id = payload.get("club_id")
    cert_type = payload.get("certificate_type", "member")
    title = payload.get("title", "Chứng nhận thành viên")
    description = payload.get("description", "")

    if not user_id or not club_id:
        raise HTTPException(400, "Thiếu user_id hoặc club_id")

    # Kiểm tra quyền: chỉ chủ nhiệm CLB hoặc admin
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(404, "CLB không tồn tại")

    if club.president_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Chỉ chủ nhiệm CLB hoặc admin mới có quyền")

    # Sinh mã verify
    verify_code = f"CERT-{secrets.token_urlsafe(8).upper()}"

    cert = Certificate(
        user_id=user_id,
        club_id=club_id,
        certificate_type=cert_type,
        title=title,
        description=description,
        verify_code=verify_code,
        issued_by=current_user.id
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    # Thông báo cho user
    create_notification(
        db, user_id, "achievement",
        f"🏆 Bạn nhận chứng nhận mới!",
        f"{title} từ {club.name}",
        "fa-certificate",
        "/profile"
    )

    award_points(db, user_id, "complete_profile", 20)

    return {
        "id": cert.id,
        "verify_code": verify_code,
        "message": "Đã cấp chứng nhận"
    }


@router.get("/certificates/verify/{verify_code}")
def verify_certificate(verify_code: str, db: Session = Depends(get_db)):
    """Verify chứng nhận qua mã (public)"""
    cert = db.query(Certificate, User, Club)\
        .join(User, User.id == Certificate.user_id)\
        .join(Club, Club.id == Certificate.club_id)\
        .filter(Certificate.verify_code == verify_code, Certificate.is_public == True).first()

    if not cert:
        raise HTTPException(404, "Mã chứng nhận không hợp lệ")

    c, u, cl = cert
    return {
        "valid": True,
        "title": c.title,
        "description": c.description,
        "type": c.certificate_type,
        "recipient": u.full_name,
        "club": cl.name,
        "issued_date": c.issued_date.isoformat()
    }


@router.get("/certificates/qr/{cert_id}")
def get_certificate_qr(
    cert_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Tạo QR code cho chứng nhận"""
    if not QR_AVAILABLE:
        raise HTTPException(503, "QR service unavailable")

    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certificate not found")
    if cert.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Không có quyền")

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(f"CLUB_HUB_CERT:{cert.verify_code}")
    qr.make(fit=True)
    img = qr.make_image(fill_color="#6366f1", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()

    return {
        "certificate_id": cert_id,
        "verify_code": cert.verify_code,
        "qr_image": f"data:image/png;base64,{img_str}"
    }


# ============= 2. QR SCANNER API =============

@router.post("/qr/validate")
def validate_qr_code(
    payload: dict,
    db: Session = Depends(get_db)
):
    """Validate QR code được scan"""
    qr_data = payload.get("qr_data", "").strip()
    if not qr_data:
        raise HTTPException(400, "QR data trống")

    # Parse QR format: CLUB_HUB_EVENT:event_id:title
    if qr_data.startswith("CLUB_HUB_EVENT:"):
        parts = qr_data.split(":")
        if len(parts) >= 2:
            try:
                event_id = int(parts[1])
                event = db.query(Event).filter(Event.id == event_id).first()
                if event:
                    return {
                        "valid": True,
                        "type": "event",
                        "event_id": event_id,
                        "event_title": event.title,
                        "message": f"Check-in cho sự kiện: {event.title}"
                    }
            except (ValueError, IndexError):
                pass

    # Parse: CLUB_HUB_CERT:code
    if qr_data.startswith("CLUB_HUB_CERT:"):
        code = qr_data.replace("CLUB_HUB_CERT:", "")
        cert = db.query(Certificate).filter(Certificate.verify_code == code).first()
        if cert:
            return {
                "valid": True,
                "type": "certificate",
                "cert_id": cert.id,
                "verify_code": code,
                "message": "Chứng nhận hợp lệ"
            }

    return {
        "valid": False,
        "message": "Mã QR không hợp lệ"
    }


@router.post("/qr/checkin-event")
def checkin_event_via_qr(
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Check-in sự kiện qua QR scan"""
    qr_data = payload.get("qr_data", "").strip()
    if not qr_data.startswith("CLUB_HUB_EVENT:"):
        raise HTTPException(400, "QR không phải sự kiện")

    try:
        event_id = int(qr_data.split(":")[1])
    except (ValueError, IndexError):
        raise HTTPException(400, "QR không hợp lệ")

    # Kiểm tra đã đăng ký chưa
    reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()

    if not reg:
        raise HTTPException(400, "Bạn chưa đăng ký sự kiện này")

    reg.attended = True
    db.commit()
    award_points(db, current_user.id, "attend_event")

    return {
        "success": True,
        "message": f"Check-in thành công sự kiện!",
        "event_id": event_id
    }


# ============= 3. REPORTS (BÁO CÁO NHÀ TRƯỜNG) =============

@router.get("/reports/school")
def get_school_report(
    db: Session = Depends(get_db),
    period: str = Query("all", pattern="^(all|year|month)$"),
    year: Optional[int] = None,
    month: Optional[int] = None
):
    """Báo cáo tổng hợp cho nhà trường"""
    now = datetime.utcnow()
    if year is None:
        year = now.year
    if month is None:
        month = now.month

    # Date filter
    date_filter = None
    if period == "year":
        date_filter = datetime(year, 1, 1)
    elif period == "month":
        date_filter = datetime(year, month, 1)

    # Stats
    user_query = db.query(User)
    event_query = db.query(Event)
    if date_filter:
        user_query = user_query.filter(User.created_at >= date_filter)
        event_query = event_query.filter(Event.created_at >= date_filter)

    total_students = user_query.count()
    total_events = event_query.count()

    # Thống kê theo khoa
    by_faculty = db.query(User.faculty, func.count(User.id))\
        .filter(User.faculty.isnot(None), User.is_active == True)\
        .group_by(User.faculty).all()

    # Tỷ lệ SV tham gia CLB
    total_active_users = db.query(User).filter(User.is_active == True).count()
    users_in_clubs = db.query(Membership.user_id).filter(Membership.is_active == True).distinct().count()
    participation_rate = (users_in_clubs / total_active_users * 100) if total_active_users else 0

    # Top 10 CLB tích cực
    top_clubs = db.query(Club).order_by(desc(Club.member_count)).limit(10).all()

    # CLB theo category
    by_category = db.query(Club.category, func.count(Club.id))\
        .filter(Club.is_active == True).group_by(Club.category).all()

    return {
        "period": period,
        "year": year,
        "month": month if period == "month" else None,
        "summary": {
            "total_students": total_students,
            "total_clubs": db.query(Club).filter(Club.is_active == True).count(),
            "total_events": total_events,
            "total_posts": db.query(Post).count(),
            "total_memberships": db.query(Membership).filter(Membership.is_active == True).count(),
            "participation_rate": round(participation_rate, 1),
            "users_in_clubs": users_in_clubs
        },
        "by_faculty": [
            {"faculty": f[0] or "N/A", "count": f[1]} for f in by_faculty
        ],
        "by_category": [
            {"category": c[0] or "N/A", "count": c[1]} for c in by_category
        ],
        "top_clubs": [
            {
                "id": c.id,
                "name": c.name,
                "category": c.category,
                "member_count": c.member_count
            } for c in top_clubs
        ],
        "generated_at": now.isoformat()
    }


@router.get("/reports/club/{club_id}")
def get_club_report(
    club_id: int,
    db: Session = Depends(get_db)
):
    """Báo cáo chi tiết 1 CLB"""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(404, "Club not found")

    total_events = db.query(Event).filter(Event.club_id == club_id).count()
    upcoming = db.query(Event).filter(
        Event.club_id == club_id, Event.start_time >= datetime.utcnow()
    ).count()
    completed = db.query(Event).filter(
        Event.club_id == club_id, Event.status == "completed"
    ).count()
    total_posts = db.query(Post).filter(Post.club_id == club_id).count()
    total_members = db.query(Membership).filter(
        Membership.club_id == club_id, Membership.is_active == True
    ).count()

    # Events theo tháng
    monthly_events = db.query(
        func.extract('month', Event.start_time).label('month'),
        func.count(Event.id)
    ).filter(Event.club_id == club_id).group_by('month').all()

    return {
        "club": {
            "id": club.id,
            "name": club.name,
            "category": club.category,
            "member_count": club.member_count,
            "founded_date": club.founded_date.isoformat()
        },
        "stats": {
            "total_events": total_events,
            "upcoming_events": upcoming,
            "completed_events": completed,
            "total_posts": total_posts,
            "total_members": total_members
        },
        "monthly_events": [
            {"month": int(m[0]), "count": m[1]} for m in monthly_events
        ]
    }


# ============= 4. EVENT GALLERY =============

@router.get("/events/{event_id}/gallery")
def get_event_gallery(event_id: int, db: Session = Depends(get_db)):
    """Album ảnh sự kiện"""
    photos = db.query(EventGallery, User).join(User, User.id == EventGallery.uploader_id)\
        .filter(EventGallery.event_id == event_id)\
        .order_by(desc(EventGallery.created_at)).all()
    return [
        {
            "id": p.id,
            "image_url": p.image_url,
            "caption": p.caption,
            "likes": p.likes,
            "uploader_name": u.full_name,
            "created_at": p.created_at.isoformat()
        } for p, u in photos
    ]


@router.post("/events/{event_id}/gallery")
def upload_event_photo(
    event_id: int,
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Upload ảnh sự kiện"""
    photo = EventGallery(
        event_id=event_id,
        uploader_id=current_user.id,
        image_url=payload["image_url"],
        caption=payload.get("caption")
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    award_points(db, current_user.id, "comment", 5)
    return {"id": photo.id, "message": "Đã thêm ảnh"}


@router.post("/events/{event_id}/gallery/{photo_id}/like")
def like_event_photo(
    event_id: int,
    photo_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Like ảnh sự kiện"""
    photo = db.query(EventGallery).filter(
        EventGallery.id == photo_id, EventGallery.event_id == event_id
    ).first()
    if not photo:
        raise HTTPException(404, "Photo not found")
    photo.likes += 1
    db.commit()
    return {"likes": photo.likes}


# ============= 5. PWA MANIFEST =============

@router.get("/pwa/info")
def get_pwa_info():
    """Thông tin PWA"""
    return {
        "name": "CLB Student Hub",
        "short_name": "CLB Hub",
        "description": "Hệ thống quản lý câu lạc bộ sinh viên ICTU",
        "theme_color": "#6366f1",
        "background_color": "#ffffff",
        "display": "standalone",
        "scope": "/",
        "start_url": "/"
    }
