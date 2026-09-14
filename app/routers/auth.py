"""
Router xác thực người dùng
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserOut, LoginRequest, TokenResponse, UserUpdate
from app.security import (
    hash_password, verify_password,
    create_access_token, require_user
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Đăng ký tài khoản mới"""
    # Kiểm tra username tồn tại
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")

    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        student_id=user_data.student_id,
        phone=user_data.phone,
        faculty=user_data.faculty,
        role="member"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role})
    return TokenResponse(access_token=token, user=UserOut.model_validate(new_user))


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Đăng nhập (form data)"""
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không đúng"
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login-json", response_model=TokenResponse)
def login_json(payload: LoginRequest, db: Session = Depends(get_db)):
    """Đăng nhập (JSON body)"""
    user = db.query(User).filter(User.username == payload.username).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không đúng"
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(require_user)):
    """Lấy thông tin người dùng hiện tại"""
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, current_user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Cập nhật thông tin cá nhân"""
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    payload: dict,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Đổi mật khẩu"""
    old_pw = payload.get("old_password")
    new_pw = payload.get("new_password")

    if not old_pw or not new_pw:
        raise HTTPException(status_code=400, detail="Thiếu thông tin")
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải từ 6 ký tự")

    if not verify_password(old_pw, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu cũ không đúng")

    current_user.hashed_password = hash_password(new_pw)
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}
