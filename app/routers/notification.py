from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import Notification
from app.schemas import NotificationCreate, NotificationOut
from app.security import get_current_user
from app.models import User

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)

@router.get("/", response_model=List[NotificationOut])
async def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách thông báo của người dùng hiện tại"""
    notifications = db.query(Notification)        .filter(Notification.user_id == current_user.id)        .order_by(Notification.created_at.desc())        .all()
    return notifications

@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Đánh dấu một thông báo là đã đọc"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Thông báo không tìm thấy")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Đánh dấu tất cả thông báo là đã đọc"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return None

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xóa một thông báo"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Thông báo không tìm thấy")

    db.delete(notification)
    db.commit()
    return None
