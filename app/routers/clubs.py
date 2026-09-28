"""
Router quản lý Câu lạc bộ
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
import re

from app.database import get_db
from app.models import Club, Membership, User, AIChatHistory
from app.schemas import ClubCreate, ClubUpdate, ClubOut, ClubMemberOut
from app.security import require_user, get_current_user
from app.ai_service import ai_summarize_club
from app.utils import award_points, create_notification, check_achievements, log_activity
from datetime import datetime

router = APIRouter(prefix="/api/clubs", tags=["clubs"])

# Thứ tự ưu tiên hiển thị vai trò trong CLB
ROLE_ORDER = {"president": 0, "vice_president": 1, "member": 2}


def slugify(text: str) -> str:
    """Tạo slug từ chuỗi"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text


def resolve_club(db: Session, identifier: str) -> Club:
    """Resolve a club by integer ID or slug. Raises 404 if not found."""
    # Try integer ID first
    if identifier.isdigit():
        club = db.query(Club).filter(Club.id == int(identifier)).first()
        if club:
            return club
    # Fall back to slug lookup
    club = db.query(Club).filter(Club.slug == identifier).first()
    if not club:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu lạc bộ")
    return club


def active_club_ids(db: Session, user_id: Optional[int]) -> set:
    """Tập ID các CLB mà user đang là thành viên (is_active)"""
    if not user_id:
        return set()
    rows = db.query(Membership.club_id).filter(
        Membership.user_id == user_id,
        Membership.is_active == True  # noqa: E712
    ).all()
    return {r[0] for r in rows}


def serialize_clubs(clubs: List[Club], member_ids: set) -> List[ClubOut]:
    """Chuyển Club -> ClubOut kèm cờ is_member"""
    result = []
    for club in clubs:
        item = ClubOut.model_validate(club)
        item.is_member = club.id in member_ids
        result.append(item)
    return result


@router.get("", response_model=List[ClubOut])
def list_clubs(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    q: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Danh sách câu lạc bộ (tìm kiếm, lọc)"""
    query = db.query(Club).filter(Club.is_active == True)

    if q:
        query = query.filter(
            or_(
                Club.name.ilike(f"%{q}%"),
                Club.description.ilike(f"%{q}%"),
                Club.ai_tags.ilike(f"%{q}%")
            )
        )

    if category:
        query = query.filter(Club.category == category)

    clubs = query.order_by(Club.member_count.desc()).offset(skip).limit(limit).all()
    return serialize_clubs(clubs, active_club_ids(db, current_user.id if current_user else None))


@router.get("/featured", response_model=List[ClubOut])
def featured_clubs(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    limit: int = 6
):
    """CLB nổi bật (nhiều thành viên nhất)"""
    clubs = db.query(Club).filter(Club.is_active == True)\
        .order_by(Club.member_count.desc()).limit(limit).all()
    return serialize_clubs(clubs, active_club_ids(db, current_user.id if current_user else None))


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    """Danh sách các danh mục"""
    categories = db.query(Club.category, func.count(Club.id))\
        .filter(Club.is_active == True)\
        .group_by(Club.category).all()
    return [{"name": c[0], "count": c[1]} for c in categories if c[0]]


@router.get("/{club_identifier}", response_model=ClubOut)
def get_club(
    club_identifier: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Chi tiết câu lạc bộ (hỗ trợ cả ID số và slug)"""
    club = resolve_club(db, club_identifier)
    out = ClubOut.model_validate(club)
    out.is_member = club.id in active_club_ids(db, current_user.id if current_user else None)
    return out


@router.get("/slug/{slug}", response_model=ClubOut)
def get_club_by_slug(slug: str, db: Session = Depends(get_db)):
    """Lấy CLB theo slug"""
    club = db.query(Club).filter(Club.slug == slug).first()
    if not club:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu lạc bộ")
    return club


@router.post("", response_model=ClubOut, status_code=201)
async def create_club(
    payload: ClubCreate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Tạo câu lạc bộ mới + AI phân tích"""
    if current_user.role not in ["admin", "leader"]:
        raise HTTPException(status_code=403, detail="Cần quyền chủ nhiệm hoặc admin")

    slug = slugify(payload.name)
    if db.query(Club).filter(Club.slug == slug).first():
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"

    # Gọi AI phân tích CLB (async)
    ai_result = await ai_summarize_club(payload.name, payload.description)

    new_club = Club(
        name=payload.name,
        slug=slug,
        description=payload.description,
        category=payload.category,
        logo=payload.logo or "",
        banner=payload.banner or "",
        email=payload.email,
        facebook=payload.facebook,
        meeting_room=payload.meeting_room,
        president_id=current_user.id,
        ai_summary=ai_result.get("summary", ""),
        ai_tags=", ".join(ai_result.get("tags", []))
    )

    db.add(new_club)
    db.commit()
    db.refresh(new_club)

    # Tự động thêm chủ nhiệm vào CLB
    membership = Membership(
        user_id=current_user.id,
        club_id=new_club.id,
        role="president"
    )
    db.add(membership)
    new_club.member_count = 1
    db.commit()

    return new_club


@router.put("/{club_id}", response_model=ClubOut)
def update_club(
    club_id: int,
    payload: ClubUpdate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Cập nhật câu lạc bộ"""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu lạc bộ")

    if club.president_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(club, field, value)

    db.commit()
    db.refresh(club)
    return club


@router.delete("/{club_id}")
def delete_club(
    club_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Xóa câu lạc bộ"""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu lạc bộ")

    if club.president_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền xóa")

    club.is_active = False
    db.commit()
    return {"message": "Đã xóa câu lạc bộ"}


@router.post("/{club_identifier}/join")
def join_club(
    club_identifier: str,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Tham gia câu lạc bộ"""
    club = resolve_club(db, club_identifier)

    existing = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.club_id == club.id
    ).first()

    if existing and existing.is_active:
        raise HTTPException(status_code=400, detail="Bạn đã là thành viên của CLB này")

    if existing:
        # Từng rời rồi tham gia lại -> kích hoạt lại, đồng thời cộng lại member_count
        existing.is_active = True
        club.member_count = (club.member_count or 0) + 1
    else:
        membership = Membership(user_id=current_user.id, club_id=club.id, role="member")
        db.add(membership)
        club.member_count = (club.member_count or 0) + 1

    # Cộng điểm & tạo notification
    points_result = award_points(db, current_user.id, "join_club")
    create_notification(
        db, current_user.id, "club",
        f"Chào mừng đến với {club.name}!",
        f"Bạn vừa tham gia CLB. Nhận {points_result['points_earned']} điểm thưởng!",
        "fa-people-group",
        f"/clubs/{club.slug}"
    )
    achievements = check_achievements(db, current_user.id)
    log_activity(db, current_user.id, "join_club", "club", club.id, f"Tham gia {club.name}")

    db.commit()
    db.refresh(club)
    return {
        "message": f"Chào mừng bạn đến với {club.name}!",
        "is_member": True,
        "club_id": club.id,
        "club_name": club.name,
        "member_count": club.member_count,
        "points_earned": points_result["points_earned"],
        "level": points_result["level"],
        "rank": points_result["rank"],
        "achievements_unlocked": achievements
    }


@router.post("/{club_identifier}/leave")
def leave_club(
    club_identifier: str,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Rời câu lạc bộ"""
    club = resolve_club(db, club_identifier)
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.club_id == club.id,
        Membership.is_active == True
    ).first()

    if not membership:
        raise HTTPException(status_code=404, detail="Bạn không phải thành viên")

    if membership.role == "president":
        raise HTTPException(status_code=400, detail="Chủ nhiệm không thể rời CLB")

    membership.is_active = False
    if club.member_count and club.member_count > 0:
        club.member_count -= 1

    db.commit()
    db.refresh(club)
    return {
        "message": "Đã rời câu lạc bộ",
        "is_member": False,
        "club_id": club.id,
        "club_name": club.name,
        "member_count": club.member_count
    }


@router.get("/{club_identifier}/members", response_model=List[ClubMemberOut])
def get_club_members(
    club_identifier: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    role: Optional[str] = None,
    limit: int = 200
):
    """Danh sách thành viên CLB (kèm thông tin user, có cờ is_me)"""
    club = resolve_club(db, club_identifier)
    query = db.query(Membership, User).join(User, User.id == Membership.user_id)\
        .filter(Membership.club_id == club.id, Membership.is_active == True)

    if role:
        query = query.filter(Membership.role == role)

    rows = query.order_by(Membership.joined_at.asc()).limit(limit).all()
    me_id = current_user.id if current_user else None

    members = [
        ClubMemberOut(
            user_id=u.id,
            username=u.username,
            full_name=u.full_name,
            avatar=u.avatar or (u.full_name or u.username or "?")[0].upper(),
            faculty=u.faculty,
            student_id=u.student_id,
            role=m.role,
            joined_at=m.joined_at,
            contribution_score=m.contribution_score or 0.0,
            is_me=(me_id is not None and u.id == me_id)
        )
        for m, u in rows
    ]
    members.sort(key=lambda x: (ROLE_ORDER.get(x.role, 3), x.joined_at or datetime.min))
    return members
