"""
Định nghĩa các công cụ (Tools) mà AI Agent có thể sử dụng để tương tác với hệ thống.
Sử dụng decorator @ai_tool để tự động đăng ký công cụ vào ToolRegistry.
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app import models
from typing import List, Dict, Any, Callable, Optional
from datetime import datetime, timezone
import functools
import json


class Tool:
    def __init__(self, name: str, description: str, func: Callable):
        self.name = name
        self.description = description
        self.func = func


class ToolRegistry:
    def __init__(self):
        self.tools: Dict[str, Tool] = {}

    def register(self, name: str, description: str, func: Callable):
        self.tools[name] = Tool(name, description, func)

    def get_tool_descriptions(self) -> str:
        return "\n".join([f"- {t.name}: {t.description}" for t in self.tools.values()])

    async def execute(self, name: str, args: Dict[str, Any], **kwargs) -> str:
        if name not in self.tools:
            return f"Error: Tool {name} not found."
        try:
            func = self.tools[name].func
            # Check kwargs and pass db if needed
            db = kwargs.get("db")
            if db is not None:
                result = await func(db=db, **args)
            else:
                result = await func(**args)
            return str(result)
        except TypeError as te:
            # Fallback if db is passed or not passed
            try:
                result = await self.tools[name].func(**args)
                return str(result)
            except Exception as e:
                return f"Error executing {name}: {str(e)}"
        except Exception as e:
            return f"Error executing {name}: {str(e)}"


# Singleton registry
registry = ToolRegistry()


def ai_tool(description: str):
    """Decorator để đăng ký một function thành AI Tool"""
    def decorator(func: Callable):
        name = func.__name__
        registry.register(name, description, func)
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    return decorator


# ============= READ & SEARCH TOOLS =============

@ai_tool("Lấy thông tin chi tiết của một câu lạc bộ bằng id hoặc name. Args: {club_id: int, name: str}")
async def get_club_info(db: Optional[Session] = None, club_id: Optional[int] = None, name: Optional[str] = None) -> str:
    if not db:
        return "Error: Database session unavailable."
    if club_id:
        club = db.query(models.Club).filter(models.Club.id == club_id).first()
    elif name:
        club = db.query(models.Club).filter(models.Club.name.ilike(f"%{name}%")).first()
    else:
        return "Error: Cần cung cấp club_id hoặc name."

    if not club:
        return "Không tìm thấy câu lạc bộ này."

    return (
        f"CLB: {club.name}\n"
        f"Danh mục: {club.category}\n"
        f"Mô tả: {club.description}\n"
        f"Thành viên: {club.member_count}\n"
        f"Sứ mệnh: {club.mission or 'N/A'}\n"
        f"Tầm nhìn: {club.vision or 'N/A'}\n"
        f"Email: {club.email or 'N/A'}"
    )


@ai_tool("Tìm kiếm danh sách câu lạc bộ theo từ khóa hoặc danh mục. Args: {query: str}")
async def search_clubs(db: Optional[Session] = None, query: str = "") -> str:
    if not db:
        return "Error: Database session unavailable."
    clubs = db.query(models.Club).filter(
        (models.Club.name.ilike(f"%{query}%")) |
        (models.Club.description.ilike(f"%{query}%")) |
        (models.Club.category.ilike(f"%{query}%")) |
        (models.Club.ai_tags.ilike(f"%{query}%"))
    ).limit(6).all()

    if not clubs:
        return "Không tìm thấy câu lạc bộ nào phù hợp với từ khóa."

    results = [f"- {c.name} ({c.category}) - {c.member_count} thành viên: {(c.description or '')[:90]}..." for c in clubs]
    return "Danh sách CLB phù hợp:\n" + "\n".join(results)


@ai_tool("Lấy danh sách các sự kiện sắp tới kèm thông tin địa điểm và số chỗ. Args: {limit: int}")
async def get_upcoming_events(db: Optional[Session] = None, limit: int = 5) -> str:
    if not db:
        return "Error: Database session unavailable."
    now = datetime.now(timezone.utc)
    events = db.query(models.Event).filter(
        models.Event.status == "upcoming"
    ).order_by(models.Event.start_time.asc()).limit(limit).all()

    if not events:
        return "Hiện không có sự kiện sắp tới."

    results = [
        f"- {e.title} (Bắt đầu: {e.start_time.strftime('%d/%m/%Y %H:%M') if e.start_time else 'N/A'}) tại {e.location} [{e.current_participants}/{e.max_participants or '∞'} đã đăng ký]"
        for e in events
    ]
    return "Các sự kiện sắp tới:\n" + "\n".join(results)


@ai_tool("Lấy thông tin profile của sinh viên. Args: {user_id: int}")
async def get_user_profile(db: Optional[Session] = None, user_id: int = 1) -> str:
    if not db:
        return "Error: Database session unavailable."
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return "Không tìm thấy sinh viên này."

    memberships = db.query(models.Club).join(models.Membership, models.Membership.club_id == models.Club.id)\
        .filter(models.Membership.user_id == user_id, models.Membership.is_active == True).all()
    clubs_str = ", ".join([c.name for c in memberships]) or "Chưa tham gia"

    return (
        f"Sinh viên: {user.full_name} (MSSV: {user.student_id or 'N/A'})\n"
        f"Khoa: {user.faculty or 'N/A'} | Lớp: {user.class_name or 'N/A'}\n"
        f"Kỹ năng: {user.skills or 'Chưa khai báo'}\n"
        f"Sở thích: {user.interests or 'Chưa khai báo'}\n"
        f"CLB tham gia: {clubs_str}"
    )


@ai_tool("Kiểm tra xem sinh viên có phải thành viên của CLB hay không. Args: {user_id: int, club_id: int}")
async def check_membership(db: Optional[Session] = None, user_id: int = 1, club_id: int = 1) -> str:
    if not db:
        return "Error: Database session unavailable."
    membership = db.query(models.Membership).filter(
        models.Membership.user_id == user_id,
        models.Membership.club_id == club_id,
        models.Membership.is_active == True
    ).first()

    return f"Đã là thành viên (Vai trò: {membership.role})" if membership else "Chưa là thành viên"


# ============= COGNITIVE & ANALYTIC TOOLS =============

@ai_tool("Phân tích xung đột lịch và phòng họp của các sự kiện. Args: {date_str: str}")
async def analyze_schedule_conflicts(db: Optional[Session] = None, date_str: str = "") -> str:
    """Phát hiện xung đột lịch giữa các CLB"""
    if not db:
        return "Error: Database session unavailable."
    events = db.query(models.Event).filter(models.Event.status == "upcoming").all()
    if len(events) < 2:
        return "Không có xung đột lịch nào được ghi nhận."

    conflicts = []
    for i in range(len(events)):
        for j in range(i + 1, len(events)):
            e1, e2 = events[i], events[j]
            if e1.location == e2.location and e1.start_time and e2.start_time:
                diff = abs((e1.start_time - e2.start_time).total_seconds())
                if diff < 7200:  # Trùng trong vòng 2 tiếng
                    conflicts.append(f"Cảnh báo trùng địa điểm '{e1.location}' giữa '{e1.title}' và '{e2.title}'")

    if conflicts:
        return "PHÁT HIỆN XUNG ĐỘT LỊCH:\n" + "\n".join(conflicts)
    return "Lịch trình an toàn, không có xung đột địa điểm hoặc thời gian giữa các CLB."


@ai_tool("Đánh giá độ tương thích (Skill Match) giữa sinh viên và CLB. Args: {user_id: int, club_id: int}")
async def evaluate_skill_fit(db: Optional[Session] = None, user_id: int = 1, club_id: int = 1) -> str:
    """Tính điểm tương thích giữa kỹ năng sinh viên và yêu cầu CLB"""
    if not db:
        return "Error: Database session unavailable."
    user = db.query(models.User).filter(models.User.id == user_id).first()
    club = db.query(models.Club).filter(models.Club.id == club_id).first()
    if not user or not club:
        return "Error: Không tìm thấy thông tin."

    user_skills = set(re.findall(r'\w+', (user.skills or "").lower()))
    club_tags = set(re.findall(r'\w+', (club.ai_tags or club.description or "").lower()))

    matched = user_skills.intersection(club_tags)
    score = min(98.0, 50.0 + len(matched) * 15.0)

    return (
        f"Phân tích tương thích giữa {user.full_name} và {club.name}:\n"
        f"- Điểm tương thích ước tính: {score:.1f}%\n"
        f"- Kỹ năng khớp: {', '.join(matched) if matched else 'Tương thích tiềm năng'}\n"
        f"- Khuyến nghị: Phù hợp gia nhập để phát triển năng lực."
    )


# ============= ACTION TOOLS =============

@ai_tool("Đăng ký sinh viên tham gia sự kiện. Args: {user_id: int, event_id: int}")
async def register_user_for_event(db: Optional[Session] = None, user_id: int = 1, event_id: int = 1) -> str:
    if not db:
        return "Error: Database session unavailable."

    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        return "Error: Không tìm thấy sự kiện."

    if event.max_participants and event.current_participants >= event.max_participants:
        return "Error: Sự kiện đã đạt số lượng tối đa."

    existing = db.query(models.EventRegistration).filter(
        models.EventRegistration.user_id == user_id,
        models.EventRegistration.event_id == event_id
    ).first()

    if existing:
        return "Error: Sinh viên đã đăng ký sự kiện này trước đó."

    registration = models.EventRegistration(user_id=user_id, event_id=event_id)
    event.current_participants = (event.current_participants or 0) + 1
    db.add(registration)
    db.commit()

    return f"Thành công! Đã đăng ký cho sinh viên tham gia sự kiện '{event.title}'."


@ai_tool("Gửi đơn xin gia nhập câu lạc bộ. Args: {user_id: int, club_id: int}")
async def apply_to_club(db: Optional[Session] = None, user_id: int = 1, club_id: int = 1) -> str:
    if not db:
        return "Error: Database session unavailable."

    club = db.query(models.Club).filter(models.Club.id == club_id).first()
    if not club:
        return "Error: Không tìm thấy CLB."

    existing = db.query(models.Membership).filter(
        models.Membership.user_id == user_id,
        models.Membership.club_id == club_id
    ).first()

    if existing and existing.is_active:
        return "Error: Sinh viên hiện đã là thành viên chính thức."

    if existing:
        existing.is_active = True
    else:
        membership = models.Membership(user_id=user_id, club_id=club_id, role="member")
        db.add(membership)
        club.member_count = (club.member_count or 0) + 1

    db.commit()
    return f"Thành công! Đã tiếp nhận đăng ký tham gia CLB {club.name}."
