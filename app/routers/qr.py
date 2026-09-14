"""
Router QR Code cho check-in sự kiện
"""
import io
import base64
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

try:
    import qrcode
    from PIL import Image
    QR_AVAILABLE = True
except ImportError:
    QR_AVAILABLE = False

from app.database import get_db
from app.models import Event, EventRegistration, EventCheckIn, User
from app.security import require_user

router = APIRouter(prefix="/api/qr", tags=["qr"])


@router.get("/event/{event_id}")
def generate_event_qr_image(
    event_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Tạo QR code cho sự kiện (cho chủ nhiệm quét check-in)"""
    if not QR_AVAILABLE:
        raise HTTPException(503, "QR service unavailable")

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")

    # Tạo QR code chứa thông tin sự kiện
    qr_data = f"CLUB_HUB_EVENT:{event_id}:{event.title[:20]}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#6366f1", back_color="white")

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()

    return {
        "event_id": event_id,
        "event_title": event.title,
        "qr_data": qr_data,
        "qr_image_base64": f"data:image/png;base64,{img_str}"
    }


@router.get("/checkin/{event_id}")
def generate_user_checkin_qr(
    event_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Tạo QR code cá nhân để check-in sự kiện"""
    if not QR_AVAILABLE:
        raise HTTPException(503, "QR service unavailable")

    # Lấy hoặc tạo checkin
    import secrets
    from datetime import datetime

    checkin = db.query(EventCheckIn).filter(
        EventCheckIn.event_id == event_id,
        EventCheckIn.user_id == current_user.id
    ).first()

    if not checkin:
        # Kiểm tra đã đăng ký chưa
        reg = db.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == current_user.id
        ).first()
        if not reg:
            raise HTTPException(400, "Bạn chưa đăng ký sự kiện")

        qr_code = f"EVT{event_id}-U{current_user.id}-{secrets.token_urlsafe(6).upper()}"
        checkin = EventCheckIn(
            event_id=event_id,
            user_id=current_user.id,
            qr_code=qr_code
        )
        db.add(checkin)
        db.commit()
        db.refresh(checkin)

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(checkin.qr_code)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#10b981", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()

    return {
        "event_id": event_id,
        "user_id": current_user.id,
        "qr_code": checkin.qr_code,
        "qr_image_base64": f"data:image/png;base64,{img_str}",
        "checked_in_at": checkin.checked_in_at.isoformat() if checkin.checked_in_at else None
    }


@router.post("/checkin-event")
def checkin_via_qr(
    payload: dict,
    db: Session = Depends(get_db)
):
    """Check-in thông qua QR code"""
    qr_code = payload.get("qr_code", "").strip()
    if not qr_code:
        raise HTTPException(400, "Thiếu QR code")

    checkin = db.query(EventCheckIn, User).join(User, User.id == EventCheckIn.user_id)\
        .filter(EventCheckIn.qr_code == qr_code).first()

    if not checkin:
        raise HTTPException(404, "Mã QR không hợp lệ")

    ci, user = checkin

    if ci.checked_in_at:
        return {
            "message": "Đã check-in trước đó",
            "user_name": user.full_name,
            "checked_in_at": ci.checked_in_at.isoformat()
        }

    from datetime import datetime
    ci.checked_in_at = datetime.utcnow()
    db.commit()

    # Cộng điểm
    from app.utils import award_points
    award_points(db, user.id, "attend_event")

    return {
        "message": "Check-in thành công!",
        "user_name": user.full_name,
        "user_id": user.id,
        "checked_in_at": ci.checked_in_at.isoformat()
    }
