"""
Router quản lý Bài viết / Tin tức
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.database import get_db
from app.models import Post, User, Club
from app.schemas import PostCreate, PostUpdate, PostOut
from app.security import require_user
from app.ai_service import ai_extract_keywords, ai_generate_post_content

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("", response_model=List[PostOut])
def list_posts(
    db: Session = Depends(get_db),
    q: Optional[str] = None,
    club_id: Optional[int] = None,
    post_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """Danh sách bài viết"""
    query = db.query(Post)

    if q:
        query = query.filter(
            or_(
                Post.title.ilike(f"%{q}%"),
                Post.content.ilike(f"%{q}%"),
                Post.ai_keyword.ilike(f"%{q}%")
            )
        )
    if club_id:
        query = query.filter(Post.club_id == club_id)
    if post_type:
        query = query.filter(Post.post_type == post_type)

    posts = query.order_by(Post.is_pinned.desc(), Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts


@router.get("/latest", response_model=List[PostOut])
def latest_posts(db: Session = Depends(get_db), limit: int = 10):
    """Bài viết mới nhất"""
    posts = db.query(Post).order_by(Post.created_at.desc()).limit(limit).all()
    return posts


@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    """Chi tiết bài viết"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    post.views += 1
    db.commit()
    return post


@router.post("", response_model=PostOut, status_code=201)
async def create_post(
    payload: PostCreate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Tạo bài viết mới + AI phân tích"""
    club = db.query(Club).filter(Club.id == payload.club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Câu lạc bộ không tồn tại")

    # AI trích xuất keywords
    keywords = await ai_extract_keywords(f"{payload.title} {payload.content}")

    new_post = Post(
        title=payload.title,
        content=payload.content,
        club_id=payload.club_id,
        author_id=current_user.id,
        post_type=payload.post_type,
        cover_image=payload.cover_image or "",
        ai_keyword=keywords,
        ai_category=payload.post_type
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


@router.post("/ai-generate")
async def ai_generate_post(
    payload: dict,
    current_user: User = Depends(require_user)
):
    """AI sinh nội dung bài viết"""
    title = payload.get("title", "")
    keywords = payload.get("keywords", "")
    if not title:
        raise HTTPException(status_code=400, detail="Cần tiêu đề")
    result = await ai_generate_post_content(title, keywords)
    return result


@router.put("/{post_id}", response_model=PostOut)
def update_post(
    post_id: int,
    payload: PostUpdate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Cập nhật bài viết"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")

    if post.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Xóa bài viết"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")

    if post.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền xóa")

    db.delete(post)
    db.commit()
    return {"message": "Đã xóa bài viết"}


@router.post("/{post_id}/like")
def like_post(post_id: int, current_user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Thích bài viết"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    post.likes += 1
    db.commit()
    return {"likes": post.likes}
