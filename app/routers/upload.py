"""
Router upload file (avatar, banner, club logo)
"""
import os
import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Club, FileUpload
from app.security import require_user
from app.utils import log_activity

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOADS_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOADS_ROOT, exist_ok=True)

# Mapping target_type -> folder
FOLDER_MAP = {
    "avatar": "avatars",
    "club_logo": "banners",
    "club_banner": "banners",
    "event_cover": "events",
    "post_cover": "posts",
    "document": "documents",
}

ALLOWED_MIMES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 8 * 1024 * 1024  # 8MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    target_type: str = Form("avatar"),
    target_id: int = Form(None),
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Upload ảnh (avatar, club logo/banner, event cover...)"""
    # Validate
    if target_type not in FOLDER_MAP:
        raise HTTPException(400, f"target_type không hợp lệ. Chọn một trong: {list(FOLDER_MAP.keys())}")
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(400, f"Định dạng không hỗ trợ: {file.content_type}. Chỉ chấp nhận ảnh (JPG/PNG/WebP/GIF)")

    # Đọc & check size
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, f"File quá lớn (tối đa {MAX_SIZE // 1024 // 1024}MB)")

    # Tạo folder
    folder = FOLDER_MAP[target_type]
    target_dir = os.path.join(UPLOADS_ROOT, folder)
    os.makedirs(target_dir, exist_ok=True)

    # Tên file unique
    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    safe_name = f"{current_user.id}_{secrets.token_hex(8)}{ext}"
    file_path = os.path.join(target_dir, safe_name)

    # Lưu file
    with open(file_path, "wb") as f:
        f.write(contents)

    # URL public
    file_url = f"/uploads/{folder}/{safe_name}"

    # Ghi vào DB
    record = FileUpload(
        uploader_id=current_user.id,
        filename=safe_name,
        original_name=file.filename or "image",
        file_path=file_path,
        file_type="image",
        mime_type=file.content_type,
        file_size=len(contents),
        target_type=target_type,
        target_id=target_id,
    )
    db.add(record)

    # Cập nhật target model tương ứng
    if target_type == "avatar":
        # Xóa avatar cũ (nếu có)
        if current_user.avatar:
            old_path = os.path.join(UPLOADS_ROOT, current_user.avatar.replace("/uploads/", ""))
            if os.path.exists(old_path):
                try: os.remove(old_path)
                except OSError: pass
        current_user.avatar = file_url
    elif target_type in ("club_logo", "club_banner") and target_id:
        club = db.query(Club).filter(Club.id == target_id).first()
        if not club:
            os.remove(file_path)
            raise HTTPException(404, "CLB không tồn tại")
        if club.president_id != current_user.id and current_user.role != "admin":
            os.remove(file_path)
            raise HTTPException(403, "Chỉ chủ nhiệm CLB hoặc admin mới được đổi ảnh CLB")
        if target_type == "club_logo":
            if club.logo and club.logo.startswith("/uploads/"):
                old = os.path.join(UPLOADS_ROOT, club.logo.replace("/uploads/", ""))
                if os.path.exists(old):
                    try: os.remove(old)
                    except OSError: pass
            club.logo = file_url
        else:
            if club.banner and club.banner.startswith("/uploads/"):
                old = os.path.join(UPLOADS_ROOT, club.banner.replace("/uploads/", ""))
                if os.path.exists(old):
                    try: os.remove(old)
                    except OSError: pass
            club.banner = file_url

    log_activity(db, current_user.id, "upload_image", target_type, target_id, f"Upload {target_type}")
    db.commit()

    return {
        "message": "Upload thành công",
        "url": file_url,
        "filename": safe_name,
        "size": len(contents),
    }


@router.get("/my-uploads")
def my_uploads(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Danh sách file đã upload của tôi"""
    records = db.query(FileUpload).filter(FileUpload.uploader_id == current_user.id)\
        .order_by(FileUpload.created_at.desc()).limit(50).all()
    return [{
        "id": r.id,
        "filename": r.filename,
        "original_name": r.original_name,
        "url": f"/uploads/{FOLDER_MAP.get(r.target_type, '')}/{r.filename}" if r.target_type in FOLDER_MAP else "",
        "file_type": r.file_type,
        "target_type": r.target_type,
        "file_size": r.file_size,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in records]
