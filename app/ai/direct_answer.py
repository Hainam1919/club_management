"""
Trả lời trực tiếp từ database cho các câu hỏi có đáp án xác định.

Lý do: model llama3.2:3b dù có dữ liệu đúng trong prompt vẫn tự bịa tên
(ví dụ kê ra "Workshop Lập trình Web" cho CLB chưa có workshop nào).
Các câu hỏi về số liệu / thuộc tính / danh sách thì tính ra được ngay từ DB,
nên không cần LLM: kết quả chính xác tuyệt đối, tốc độ tức thì.
Câu hỏi mở (gợi ý, so sánh chủ quan, tư vấn) vẫn để LLM trả lời.
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.models import Club, Event, EventRegistration, Membership, Post, User
from app.ai.knowledge import (
    find_people,
    longest_name_run,
    name_coverage,
    normalize,
    resolve_focus,
    tokenize,
)

# Từ khoá nói rõ câu hỏi là muốn "danh sách" (liệt kê nhiều mục)
_LIST_WORDS = ("liet ke", "liệt kê", "danh sach", "co nhung clb", "nhung clb", "la toan bo")
# Từ khoá hỏi về loại sự kiện cụ thể
_EVENT_TYPES = {
    "workshop": "workshop",
    "hackathon": "hackathon",
    "khoa hoc": "khóa học",
    "training": "khoá huấn luyện",
    "giai": "giải",
    "danh gia": "giải",
    "thieu": "thi",
    "le": "lễ",
    "dien": "diễn",
    "giao luu": "giao lưu",
    "tu van": "tư vấn",
    "tham quan": "tham quan",
    "hien thuong": "hiện thực",
    "hoi thao": "hội thảo",
    "seminar": "seminar",
    "offline": "offline",
    "online": "online",
}
_TYPE_WORDS = {
    "workshop", "hackathon", "khoa hoc", "khoa hoc", "training", "giai", "danh gia",
    "thieu", "le", "dien", "giao luu", "tu van", "tham quan", "hien thuong", "hoi thao",
    "seminar", "offline", "online", "meeting", "webinar", "camp", "tour",
}


def _clubs(db: Session):
    return db.query(Club).filter(Club.is_active == True).all()  # noqa: E712


def _president_of(db: Session, club: Club) -> str:
    if not club.president_id:
        return "chưa cập nhật"
    president = db.query(User).filter(User.id == club.president_id).first()
    return president.full_name if president else "chưa cập nhật"


def _active_member_count(db: Session, club: Club) -> int:
    return db.query(Membership).filter(
        Membership.club_id == club.id, Membership.is_active == True  # noqa: E712
    ).count()


def _upcoming_events(db: Session):
    from datetime import datetime

    return (
        db.query(Event)
        .filter(Event.start_time >= datetime.utcnow(), Event.status == "upcoming")
        .order_by(Event.start_time.asc())
        .all()
    )


def _fmt(value) -> str:
    return value.strftime("%d/%m/%Y %H:%M") if value else "chưa rõ"


def _mentions_category(db: Session, question: str) -> Optional[str]:
    """Tìm danh mục CLB được hỏi tới (khớp khi câu hỏi chứa đủ từ của tên danh mục)."""
    q_tokens = set(normalize(question).split())
    categories = [row[0] for row in db.query(Club.category).distinct().all() if row[0]]
    best = None
    for category in categories:
        tokens = [t for t in normalize(category).split() if len(t) > 1]
        if tokens and all(t in q_tokens for t in tokens):
            if best is None or len(tokens) > len(normalize(best).split()):
                best = category
    return best


# ============== TỪNG NHÓM CÂU HỎI ==============

def _answer_counts(db: Session, question: str) -> Optional[str]:
    q = normalize(question)
    clubs = _clubs(db)
    if not any(w in q for w in ("bao nhieu", "so luong", "tong so", "co bao", "tat ca bao")):
        return None

    members = db.query(User).count()
    active = db.query(Membership).filter(Membership.is_active == True).count()  # noqa: E712
    total_events = db.query(Event).count()
    upcoming = _upcoming_events(db)
    registrations = db.query(EventRegistration).count()
    posts = db.query(Post).count()
    club = db.query(Club).filter(Club.name == "CLB Hub").first()

    wants = {
        "clb": any(w in q for w in ("clb", "cau lac bo", "club")),
        "nguoi": any(w in q for w in ("sinh vien", "nguoi", "tai khoan", "member")),
        "su kien": ("su kien" in q or "event" in q or "workshop" in q or "lich" in q)
        and "dang ky" not in q,
        "dang ky": "dang ky" in q,
        "bai viet": "bai viet" in q or "post" in q,
    }
    lines = []
    if wants["clb"]:
        lines.append(f"- Tổng số câu lạc bộ đang hoạt động: **{len(clubs)}**")
    if wants["nguoi"]:
        lines.append(
            f"- Tài khoản sinh viên: **{members}** | lượt thành viên CLB đang active: **{active}**"
        )
    if wants["su kien"]:
        lines.append(f"- Tổng số sự kiện: **{total_events}** | sự kiện sắp tới: **{len(upcoming)}**")
    if wants["dang ky"]:
        lines.append(f"- Tổng lượt đăng ký sự kiện: **{registrations}**")
    if wants["bai viet"]:
        lines.append(f"- Tổng số bài viết: **{posts}**")
    if not lines:
        return None
    return "Theo dữ liệu hệ thống CLB Hub:\n" + "\n".join(lines)


def _answer_category(db: Session, question: str) -> Optional[str]:
    q = normalize(question)
    category = _mentions_category(db, question)
    if not category:
        return None
    members = [c for c in _clubs(db) if c.category == category]
    if not members:
        return None
    if any(w in q for w in _LIST_WORDS):
        body = "\n".join(
            f"- **{c.name}**: {c.member_count} thành viên | chủ nhiệm: {_president_of(db, c)}"
            for c in sorted(members, key=lambda c: c.id)
        )
        return f"Danh mục **{category}** có {len(members)} CLB:\n{body}"
    return f"Danh mục **{category}** có **{len(members)} CLB** trong hệ thống."


def _answer_top_club(db: Session, question: str) -> Optional[str]:
    q = normalize(question)
    clubs = _clubs(db)
    superlative = "nhat" in q and any(w in q for w in ("nhieu", "lon", "to", "it"))
    if superlative and ("thanh vien" in q or "member" in q or "clb" in q):
        values = [(c.member_count or 0) for c in clubs] or [0]
        fewest = any(w in q for w in ("it nhat", "it nhat", "nho nhat", "it "))
        target = min(values) if fewest else max(values)
        if target <= 0:
            return None
        top = [c for c in clubs if (c.member_count or 0) == target]
        if not top:
            return None
        if len(top) <= 3:
            names = " và ".join(c.name for c in top)
        else:
            names = ", ".join(c.name for c in top[:3]) + f" và {len(top) - 3} CLB khác"
        word = "ít" if fewest else "nhiều"
        tie = f" (hòa, {len(top)} CLB đều có số thành viên {word} nhất)" if len(top) > 1 else ""
        return f"CLB có số thành viên {word} nhất: **{names}** — **{target}** thành viên{tie}."
    if any(w in q for w in ("moi nhat", "gan nhat", "mo nhat")) and "clb" in q:
        founded = [c for c in clubs if c.founded_date]
        if not founded:
            return None
        newest = max(founded, key=lambda c: c.founded_date)
        return f"CLB thành lập gần đây nhất: **{newest.name}** ({_fmt(newest.founded_date)})."
    return None


def _answer_soonest_event(db: Session, question: str) -> Optional[str]:
    q = normalize(question)
    upcoming = _upcoming_events(db)
    if not upcoming or "su kien" not in q:
        return None
    if not any(w in q for w in ("gan nhat", "som nhat", "toi nhat", "truoc", "dau tien", "sap toi", "sau cung")):
        return None
    soonest = upcoming[0]
    organizer = db.query(Club).filter(Club.id == soonest.club_id).first()
    return (
        f"Sự kiện sắp tới gần nhất: **{soonest.title}**\n"
        f"- Thời gian: {_fmt(soonest.start_time)}\n"
        f"- Địa điểm: {soonest.location or 'chưa rõ'}\n"
        f"- CLB tổ chức: {organizer.name if organizer else 'chưa rõ'}"
    )


def _answer_club_facts(db: Session, question: str) -> Optional[str]:
    """Câu hỏi về một CLB cụ thể: số thành viên, chủ nhiệm, phòng, mô tả, sự kiện."""
    club, _ = resolve_focus(db, question)
    if club is None:
        return None
    q = normalize(question)
    events = db.query(Event).filter(Event.club_id == club.id).order_by(Event.start_time.desc()).all()
    active = _active_member_count(db, club)
    parts = []

    asks_members = any(w in q for w in ("thanh vien", "bao nhieu", "co bao", "so luong", "member", "nguoi"))
    asks_president = any(w in q for w in ("chu nhiem", "chu tri", "nguoi lam", "lam chu", "cn ", "ai la"))
    asks_room = any(w in q for w in ("phong", "dia diem", "o dau", "hop o", "meet"))
    asks_events = any(w in q for w in ("su kien", "workshop", "hackathon", "to chuc", "event", "lich", "da to chuc", "gi da"))
    asks_desc = any(w in q for w in ("mo ta", "gioi thieu", "lam gi", "ve gi", "hoat dong"))
    wants_list = any(w in q for w in _LIST_WORDS)

    if not (asks_members or asks_president or asks_room or asks_events or asks_desc):
        return None

    if asks_president:
        parts.append(f"Chủ nhiệm **{club.name}** là **{_president_of(db, club)}**.")
    if asks_members:
        parts.append(
            f"**{club.name}** có **{club.member_count}** thành viên "
            f"(số lượt thành viên đang active trong hệ thống: {active})."
        )
    if asks_room:
        parts.append(f"Phòng sinh hoạt của **{club.name}**: **{club.meeting_room or 'chưa cập nhật'}**.")
    if asks_desc:
        parts.append(f"Mô tả: {club.description or 'chưa có mô tả'}")

    if asks_events:
        # Câu hỏi có nhắc loại sự kiện cụ thể không? (vd "có workshop nào không")
        wanted_type = None
        for key, label in _EVENT_TYPES.items():
            if key in q:
                wanted_type = label
                break
        matching = events
        if wanted_type:
            matching = [e for e in events if wanted_type in normalize(e.title)]
            if matching:
                names = ", ".join(e.title for e in matching)
                parts.append(
                    f"**{club.name}** có {len(matching)} {wanted_type} đã ghi nhận: {names}."
                )
            else:
                parts.append(
                    f"**{club.name}** chưa ghi nhận sự kiện nào loại \"{wanted_type}\" trong hệ thống."
                )
        elif events:
            if wants_list or len(events) > 1:
                body = "\n".join(
                    f"- {e.title} ({_fmt(e.start_time)}) tại {e.location or 'chưa rõ địa điểm'}"
                    for e in events
                )
                parts.append(f"Sự kiện đã ghi nhận của **{club.name}** ({len(events)} sự kiện):\n{body}")
            else:
                only = events[0]
                parts.append(
                    f"**{club.name}** có 1 sự kiện đã ghi nhận: **{only.title}** "
                    f"({_fmt(only.start_time)}) tại {only.location or 'chưa rõ địa điểm'}."
                )
        else:
            parts.append(f"**{club.name}** chưa ghi nhận sự kiện nào trong hệ thống.")

    if not parts:
        return None
    return "\n".join(parts)


def _answer_event_facts(db: Session, question: str) -> Optional[str]:
    _, event = resolve_focus(db, question)
    if event is None:
        return None
    q = normalize(question)
    organizer = db.query(Club).filter(Club.id == event.club_id).first()
    asks_organizer = any(w in q for w in ("do clb nao", "to chuc", "clb nao", "ai to chuc", "to chuc boi"))
    asks_when = any(w in q for w in ("khi nao", "bao gio", "luc", "thoi gian", "ngay"))
    asks_where = any(w in q for w in ("o dau", "dia diem", "dia chi", "hop o", "online"))
    if not (asks_organizer or asks_when or asks_where):
        return None
    lines = [f"Sự kiện **{event.title}**:"]
    if asks_organizer:
        lines.append(f"- CLB tổ chức: **{organizer.name if organizer else 'chưa rõ'}**")
    if asks_when:
        lines.append(f"- Bắt đầu: {_fmt(event.start_time)} | Kết thúc: {_fmt(event.end_time)}")
    if asks_where:
        lines.append(f"- Địa điểm: {event.location or 'chưa rõ'}")
    return "\n".join(lines)


def _answer_user_facts(db: Session, question: str) -> Optional[str]:
    """Câu hỏi về một sinh viên cụ thể: tham gia CLB nào, làm chủ nhiệm CLB nào."""
    q = normalize(question)
    people = find_people(db, question, limit=1)
    if not people:
        return None
    user = people[0]
    asks_clubs = any(w in q for w in ("tham gia", "nhan vien", "hoat dong o", "thuoc clb", "la thanh vien"))
    asks_president = any(w in q for w in ("chu nhiem", "chu tri", "lam chu", "cn "))
    if not (asks_clubs or asks_president):
        return None
    lines = []
    if asks_president:
        clubs = db.query(Club).filter(Club.president_id == user.id).all()
        if clubs:
            lines.append(
                f"**{user.full_name}** là chủ nhiệm của: {', '.join(c.name for c in clubs)}."
            )
        else:
            lines.append(f"**{user.full_name}** hiện không là chủ nhiệm CLB nào.")
    if asks_clubs:
        rows = (
            db.query(Membership, Club)
            .join(Club, Club.id == Membership.club_id)
            .filter(Membership.user_id == user.id, Membership.is_active == True)  # noqa: E712
            .all()
        )
        if rows:
            lines.append(
                f"**{user.full_name}** đang là thành viên của: "
                + ", ".join(f"{club.name} ({membership.role})" for membership, club in rows)
                + "."
            )
        else:
            lines.append(f"**{user.full_name}** chưa là thành viên CLB nào.")
    return "\n".join(lines) if lines else None


# ============== ĐIỂM VÀO ==============

# Thứ tự có ý nghĩa: câu hỏi nêu đích danh CLB/sự kiện phải được trả lời trước
# câu hỏi thống kê tổng, nếu không "CLB X có bao nhiêu thành viên" sẽ bị trả về
# tổng số CLB của cả hệ thống.
_HANDLERS = (
    _answer_club_facts,
    _answer_event_facts,
    _answer_category,
    _answer_counts,
    _answer_top_club,
    _answer_soonest_event,
    _answer_user_facts,
)


def build_direct_answer(db: Session, question: str) -> Optional[str]:
    """
    Trả về câu trả lời chính xác lấy thẳng từ DB, hoặc None nếu câu hỏi
    cần suy luận mở thì giao cho LLM trả lời.
    """
    if not question or not question.strip():
        return None
    for handler in _HANDLERS:
        try:
            answer = handler(db, question)
        except Exception:
            answer = None
        if answer:
            return answer
    return None
