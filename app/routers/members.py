"""
Router xem thông tin chi tiết thành viên
Bất kỳ ai cũng có thể xem profile công khai của thành viên
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User, Membership, Club, Post, EventRegistration
from app.security import require_user
from app.schemas import UserOut, UserUpdate

router = APIRouter(prefix="/api/members", tags=["members"])


@router.get("/{user_id}")
def get_member_profile(user_id: int, db: Session = Depends(get_db)):
    """
    Lấy profile công khai của thành viên
    Ai cũng xem được (không cần đăng nhập)
    """
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy thành viên")

    if not user.is_public:
        raise HTTPException(status_code=403, detail="Thành viên này đã ẩn thông tin")

    # Lấy các CLB đang tham gia
    memberships = db.query(Membership, Club).join(Club, Club.id == Membership.club_id)\
        .filter(Membership.user_id == user_id, Membership.is_active == True).all()

    # Đếm sự kiện đã tham gia
    events_count = db.query(EventRegistration).filter(
        EventRegistration.user_id == user_id
    ).count()

    # Đếm bài viết đã đăng
    posts_count = db.query(Post).filter(Post.author_id == user_id).count()

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar": user.avatar,
        "role": user.role,
        "student_id": user.student_id,
        "class_name": user.class_name,
        "faculty": user.faculty,
        "phone": user.phone,
        "bio": user.bio,
        "skills": user.skills,
        "interests": user.interests,
        "social_facebook": user.social_facebook,
        "social_instagram": user.social_instagram,
        "social_github": user.social_github,
        "created_at": user.created_at.isoformat(),
        "clubs": [
            {
                "id": c.id,
                "name": c.name,
                "category": c.category,
                "logo": c.logo,
                "role": m.role
            } for m, c in memberships
        ],
        "stats": {
            "events_attended": events_count,
            "posts_created": posts_count,
            "clubs_joined": len(memberships)
        }
    }


@router.get("")
def list_members(
    db: Session = Depends(get_db),
    q: Optional[str] = None,
    faculty: Optional[str] = None,
    class_name: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Danh sách thành viên công khai"""
    query = db.query(User).filter(User.is_active == True, User.is_public == True)

    if q:
        query = query.filter(
            (User.full_name.ilike(f"%{q}%")) |
            (User.username.ilike(f"%{q}%")) |
            (User.student_id.ilike(f"%{q}%")) |
            (User.skills.ilike(f"%{q}%")) |
            (User.interests.ilike(f"%{q}%"))
        )
    if faculty:
        query = query.filter(User.faculty == faculty)
    if class_name:
        query = query.filter(User.class_name == class_name)

    users = query.order_by(User.full_name).offset(skip).limit(limit).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "avatar": u.avatar,
            "role": u.role,
            "student_id": u.student_id,
            "class_name": u.class_name,
            "faculty": u.faculty,
            "bio": (u.bio or "")[:150]
        } for u in users
    ]


@router.put("/me")
def update_my_profile(
    payload: UserUpdate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Cập nhật profile của tôi"""
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return {
        "message": "Cập nhật thành công",
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "bio": current_user.bio,
            "skills": current_user.skills
        }
    }
