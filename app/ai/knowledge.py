"""
Kiến thức sống của hệ thống CLB Hub - lấy trực tiếp từ database.

Mục đích: các prompt AI phải có số liệu CHÍNH XÁC tại thời điểm hỏi.
Vector store (rag_service) chỉ index 1 lần lúc startup nên chạy lâu sẽ cũ,
còn FAQ hardcode lại mô tả sai danh sách CLB. Vì vậy mọi câu hỏi về số liệu /
tên riêng đều được phục vụ bằng dữ liệu DB thật, không qua embedding.
"""
import re
import unicodedata
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models import Club, Event, EventRegistration, Membership, Post, User

# ============== TIỀN XỬ LÝ VĂN BẢN ==============

# Chỉ loại từ chức năng. TUYỆT ĐỐI không thêm từ có thể nằm trong tên riêng
# (ví dụ "đá" trong "CLB Bóng đá", "da" trong "Đỗ Yến Chi") vì sẽ phá vỡ việc dò tên.
STOPWORDS = {
    "cua", "la", "co", "cho", "va", "nhung", "cac", "mot", "nhu", "gi", "nao", "bao",
    "nhieu", "so", "luong", "danh", "muc", "chuyen", "de", "vao", "tai", "huong", "vai",
    "hoc", "dang", "sap", "thi", "khai", "cao", "nep", "dung", "giup", "muon", "khac",
    "o", "day", "do", "the", "ve", "tin", "su", "kien", "ho", "ket", "qua", "nhat",
    "hien", "nay", "tong", "tat", "ca", "mot", "roi", "se", "tu", "den", "tren",
    "gi", "theo", "trong", "ngoai", "ra", "nen", "hay", "bi", "duoc",
}

# "CLB" xuất hiện ở mọi tên câu lạc bộ nên vô nghĩa khi so khớp tên
GENERIC_NAME_TOKENS = {"clb", "cau", "lac", "bo"}

QUESTION_WORDS = [
    "bao nhiêu", "co bao nhiêu", "so luong", "nhu the nao", "the nao",
    "ai la", "khi nao", "o dau", "gia", "lien he", "thanh lap",
    "danh muc", "chu nhiem", "hoat dong", "su kien", "thanh vien",
]


def strip_accents(text: str) -> str:
    if not text:
        return ""
    # NFD không bóc được chữ "đ" (U+0111) nên phải thay thủ công, nếu không các từ
    # chứa đ (bóng đá, được, đều...) sẽ biến mất hoàn toàn khi so khớp tên.
    text = text.replace("đ", "d").replace("Đ", "D")
    normalized = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn").lower()


def normalize(text: str) -> str:
    text = strip_accents(text or "")
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str) -> List[str]:
    return [t for t in normalize(text).split() if t not in STOPWORDS and len(t) > 1]


def token_overlap(query_tokens: List[str], target: str) -> int:
    target_tokens = set(normalize(target).split())
    return sum(1 for t in query_tokens if t in target_tokens)


def wants_aggregate(question: str) -> bool:
    """Câu hỏi kiểu thống kê: 'có bao nhiêu CLB', 'bao nhiêu sự kiện sắp tới'"""
    q = normalize(question)
    return any(w in q for w in ("bao nhieu", "so luong", "tong so", "tat ca", "co bao nhieu", "nhieu may"))


def _fmt_dt(value: Optional[datetime]) -> str:
    if not value:
        return "chưa xác định"
    return value.strftime("%d/%m/%Y %H:%M")


# ============== KHỐI SỐ LIỆU TỔNG QUAN ==============

def build_facts_block(db: Session) -> str:
    """Số liệu chuẩn, luôn mới, dùng cho mọi câu hỏi."""
    clubs = db.query(Club).filter(Club.is_active == True).all()  # noqa: E712
    now = datetime.utcnow()
    upcoming = (
        db.query(Event)
        .filter(Event.start_time >= now, Event.status == "upcoming")
        .order_by(Event.start_time.asc())
        .all()
    )
    members = db.query(User).count()
    active_memberships = db.query(Membership).filter(Membership.is_active == True).count()  # noqa: E712
    total_registrations = db.query(EventRegistration).count()
    posts = db.query(Post).count()

    by_category: Dict[str, int] = {}
    by_category_members: Dict[str, List[Club]] = {}
    for club in clubs:
        cat = club.category or "Khác"
        by_category[cat] = by_category.get(cat, 0) + 1
        by_category_members.setdefault(cat, []).append(club)

    lines = [
        "DỮ LIỆU HỆ THỐNG (nguồn chuẩn, cập nhật trực tiếp từ database - luôn đúng):",
        "",
        "SỐ LIỆU TỔNG QUAN (mỗi dòng là một con số riêng biệt):",
        f"- Tổng số câu lạc bộ đang hoạt động: {len(clubs)}",
        f"- Tổng số tài khoản sinh viên trong hệ thống: {members}",
        f"- Tổng lượt thành viên CLB (đang active): {active_memberships}",
        f"- Tổng số sự kiện trong toàn hệ thống: {db.query(Event).count()}",
        f"- Số sự kiện sắp tới: {len(upcoming)}",
        f"- Tổng số bài viết: {posts}",
        f"- Tổng lượt đăng ký sự kiện: {total_registrations}",
        "- Phân bố theo danh mục: " + ", ".join(f"{k} ({v} CLB)" for k, v in sorted(by_category.items())),
        "",
        "TRẢ LỜI SẴN CHO CÂU HỎI THỐNG KÊ (dùng nguyên văn, không tự suy luận):",
    ]

    # Trả lời tính sẵn cho các câu hỏi so sánh/tìm nổi bật (tránh để LLM tự suy đoán)
    for cat in sorted(by_category_members):
        names = ", ".join(c.name for c in sorted(by_category_members[cat], key=lambda c: c.id))
        lines.append(f"- Danh mục '{cat}': {by_category[cat]} CLB -> {names}")
    max_members = max((c.member_count or 0 for c in clubs), default=0)
    top_clubs = [c for c in clubs if (c.member_count or 0) == max_members and max_members > 0]
    if top_clubs:
        tie = " và ".join(c.name for c in top_clubs)
        note = " - đây là hòa, các CLB nêu trên đều có số thành viên cao nhất" if len(top_clubs) > 1 else ""
        lines.append(f"- CLB có nhiều thành viên nhất: {tie} ({max_members} thành viên){note}")
    if upcoming:
        soonest = upcoming[0]
        organizer = db.query(Club).filter(Club.id == soonest.club_id).first()
        lines.append(
            f"- Sự kiện sắp tới gần nhất (sớm nhất): {soonest.title} lúc "
            f"{_fmt_dt(soonest.start_time)} tại {soonest.location or 'chưa rõ'}, "
            f"do {organizer.name if organizer else 'CLB không rõ'} tổ chức"
        )
    founded = [c for c in clubs if c.founded_date]
    if founded:
        newest = max(founded, key=lambda c: c.founded_date)
        lines.append(f"- CLB thành lập gần đây nhất: {newest.name} ({newest.founded_date:%d/%m/%Y})")
    lines += [
        "",
        "DANH SÁCH CÂU LẠC BỘ (tên | danh mục | số thành viên | chủ nhiệm):",
    ]
    for club in sorted(clubs, key=lambda c: c.id):
        president = (
            db.query(User).filter(User.id == club.president_id).first() if club.president_id else None
        )
        president_name = president.full_name if president else "chưa cập nhật"
        lines.append(f"- {club.name} | {club.category} | {club.member_count} thành viên | CN: {president_name}")

    lines.append("")
    lines.append("SỰ KIỆN SẮP TỚI (sắp xếp từ sớm đến muộn - dòng đầu là sự kiện gần nhất):")
    if upcoming:
        for event in upcoming:
            organizer = db.query(Club).filter(Club.id == event.club_id).first()
            lines.append(
                f"- {event.title} | {_fmt_dt(event.start_time)} | {event.location or 'chưa rõ'} "
                f"| {organizer.name if organizer else 'không rõ CLB'}"
            )
    else:
        lines.append("- (không có sự kiện sắp tới)")
    return "\n".join(lines)


# ============== TÌM THỰC THỂ THEO CÂU HỎI ==============

def find_clubs(db: Session, question: str, limit: int = 3) -> List[Club]:
    """Tìm CLB được nhắc tới: ưu tiên khớp tên, sau đó mới khớp mô tả/danh mục."""
    q_tokens = tokenize(question)
    if not q_tokens:
        return []

    scored: List[Tuple[int, Club]] = []
    for club in db.query(Club).all():
        score = 3 * token_overlap(q_tokens, club.name) + token_overlap(q_tokens, club.category or "")
        if score == 0:
            score = token_overlap(q_tokens, (club.description or "") + " " + (club.ai_tags or ""))
        if score > 0:
            scored.append((score, club))
    scored.sort(key=lambda x: (-x[0], x[1].id))
    return [club for _, club in scored[:limit]]


def find_events(db: Session, question: str, limit: int = 2) -> List[Event]:
    q_tokens = tokenize(question)
    if not q_tokens:
        return []
    scored: List[Tuple[int, Event]] = []
    for event in db.query(Event).all():
        score = 3 * token_overlap(q_tokens, event.title) + token_overlap(q_tokens, event.location or "")
        if score > 0:
            scored.append((score, event))
    scored.sort(key=lambda x: (-x[0], x[1].id))
    return [event for _, event in scored[:limit]]


def find_people(db: Session, question: str, limit: int = 3) -> List[User]:
    # Tên người tiếng Việt ("Đỗ Yến Chi") dễ trùng từ chức năng nên so khớp bằng token thô
    q_tokens = [t for t in normalize(question).split() if len(t) > 1]
    if not q_tokens:
        return []
    out = []
    for user in db.query(User).all():
        if token_overlap(q_tokens, (user.full_name or "") + " " + (user.username or "")) >= 2:
            out.append(user)
        if len(out) >= limit:
            break
    return out


def name_coverage(q_tokens: List[str], name: str) -> float:
    """Tỉ lệ từ khoá trong tên thực thể được câu hỏi nhắc tới (0.0 - 1.0)."""
    name_tokens = [t for t in normalize(name).split() if t not in GENERIC_NAME_TOKENS and len(t) > 1]
    if not name_tokens:
        return 0.0
    return sum(1 for t in name_tokens if t in q_tokens) / len(name_tokens)


def _contains_run(q_tokens: List[str], window: List[str]) -> bool:
    size = len(window)
    return any(q_tokens[i:i + size] == window for i in range(len(q_tokens) - size + 1))


def longest_name_run(q_tokens: List[str], name: str) -> int:
    """
    Độ dài cụm từ liên tiếp dài nhất trong tên mà câu hỏi có nhắc đúng thứ tự.
    Giúp nhận ra "CLB Bóng đá" trong câu "Ai là chủ nhiệm CLB Bóng đá?" dù tên đầy đủ là
    "CLB Bóng đá Sinh viên" (chỉ khớp 2/4 từ nên coverage thấp).
    """
    name_tokens = [t for t in normalize(name).split() if t not in GENERIC_NAME_TOKENS and len(t) > 1]
    for size in range(len(name_tokens), 1, -1):
        for i in range(len(name_tokens) - size + 1):
            if _contains_run(q_tokens, name_tokens[i:i + size]):
                return size
    return 0


def resolve_focus(db: Session, question: str):
    """
    Xác định câu hỏi đang hỏi về CLB hay sự kiện.
    Tên CLB và tên sự kiện hay trùng từ ("CLB Lập trình IT" vs "Workshop: Lập trình AI với Python")
    nên phải so sánh độ phủ từ khoá, không chỉ đếm số từ trùng.
    """
    q_tokens = tokenize(question)
    if not q_tokens:
        return None, None

    club, club_cov, club_run = None, 0.0, 0
    for candidate in db.query(Club).filter(Club.is_active == True).all():  # noqa: E712
        cov = name_coverage(q_tokens, candidate.name)
        run = longest_name_run(q_tokens, candidate.name)
        if (cov, run) > (club_cov, club_run):
            club, club_cov, club_run = candidate, cov, run

    event, event_cov, event_run = None, 0.0, 0
    for candidate in db.query(Event).all():
        cov = name_coverage(q_tokens, candidate.title)
        run = longest_name_run(q_tokens, candidate.title)
        if (cov, run) > (event_cov, event_run):
            event, event_cov, event_run = candidate, cov, run

    club_name_len = len([t for t in normalize(club.name).split() if t not in GENERIC_NAME_TOKENS and len(t) > 1]) if club else 0
    club_focused = club_cov >= 0.6 or (club_run >= 2 and club_run >= 0.5 * club_name_len)

    # Sự kiện thắng khi câu hỏi nhắc gần như trọn tên sự kiện...
    if event_cov >= 0.85 and event_cov > club_cov + 0.05:
        return None, event
    # ...hoặc nhắc đúng một cụm từ đủ dài trong tên sự kiện mà không nhắc CLB nào
    if event_run >= 2 and not club_focused:
        return None, event
    if club_focused:
        return club, None
    return None, None


# ============== CHI TIẾT THỰC THỂ ==============

def build_club_detail(db: Session, club: Club, include_description: bool = True) -> str:
    president = db.query(User).filter(User.id == club.president_id).first() if club.president_id else None
    active_memberships = (
        db.query(Membership).filter(Membership.club_id == club.id, Membership.is_active == True).count()  # noqa: E712
    )
    events = (
        db.query(Event).filter(Event.club_id == club.id).order_by(Event.start_time.desc()).limit(5).all()
    )
    lines = [
        f"CHI TIẾT CÂU LẠC BỘ: {club.name}",
        f"- Danh mục: {club.category}",
        f"- Số thành viên (theo hệ thống): {club.member_count}",
        f"- Số lượt thành viên đang active: {active_memberships}",
        f"- Chủ nhiệm: {president.full_name if president else 'chưa cập nhật'}",
        f"- Phòng sinh hoạt: {club.meeting_room or 'chưa cập nhật'}",
        f"- Ngày thành lập: {club.founded_date.strftime('%d/%m/%Y') if club.founded_date else 'chưa cập nhật'}",
        f"- Email: {club.email or 'chưa cập nhật'} | Facebook: {club.facebook or 'chưa cập nhật'}",
    ]
    if include_description:
        lines.append(f"- Mô tả: {club.description or 'chưa có'}")
    if club.mission:
        # Sứ mệnh/tầm nhìn là văn bản mẫu dài, gần như không dùng để trả lời -> cắt gọn
        lines.append(f"- Sứ mệnh: {club.mission[:110]}")
    if events:
        lines.append(f"- Sự kiện ĐÃ GHI NHẬN trong hệ thống: {len(events)} (danh sách dưới đây là duy nhất được phép nhắc tới):")
        for event in events:
            lines.append(f"  · {event.title} ({_fmt_dt(event.start_time)}) tại {event.location or 'chưa rõ địa điểm'}")
    else:
        lines.append("- Sự kiện ĐÃ GHI NHẬN trong hệ thống: 0 (chưa có sự kiện nào được ghi nhập cho CLB này)")
    return "\n".join(lines)


def build_event_detail(db: Session, event: Event) -> str:
    organizer = db.query(Club).filter(Club.id == event.club_id).first()
    registrations = db.query(EventRegistration).filter(EventRegistration.event_id == event.id).count()
    return "\n".join([
        f"CHI TIẾT SỰ KIỆN: {event.title}",
        f"- CLB tổ chức: {organizer.name if organizer else 'không rõ'}",
        f"- Bắt đầu: {_fmt_dt(event.start_time)} | Kết thúc: {_fmt_dt(event.end_time)}",
        f"- Địa điểm: {event.location or 'chưa cập nhật'}",
        f"- Sức chứa tối đa: {event.max_participants}",
        f"- Số lượt đăng ký thực tế trong hệ thống: {registrations}",
        f"- Trạng thái: {event.status}",
        f"- Mô tả: {event.description or 'chưa có'}",
    ])


def build_user_detail(db: Session, user: User) -> str:
    club_rows = (
        db.query(Membership, Club)
        .join(Club, Club.id == Membership.club_id)
        .filter(Membership.user_id == user.id, Membership.is_active == True)  # noqa: E712
        .all()
    )
    club_names = ", ".join(f"{club.name} ({m.role})" for m, club in club_rows) or "chưa tham gia CLB nào"
    return "\n".join([
        f"THÔNG TIN SINH VIÊN: {user.full_name}",
        f"- Tài khoản: @{user.username} | Email: {user.email}",
        f"- Khoa: {user.faculty or 'chưa cập nhật'} | Lớp: {user.class_name or 'chưa cập nhật'}",
        f"- Vai trò hệ thống: {user.role} | Điểm: {getattr(user, 'points', 0)}",
        f"- CLB đang tham gia: {club_names}",
    ])


# ============== KHỐI KIẾN THỨC HOÀN CHỈNH ==============

def build_knowledge_block(db: Session, question: str) -> str:
    """Gộp: số liệu tổng quan + chi tiết thực thể được nhắc tới trong câu hỏi."""
    sections = [build_facts_block(db)]

    focus_club, focus_event = resolve_focus(db, question)

    if focus_event:
        sections.append("SỰ KIỆN ĐƯỢC HỎI VỀ (chi tiết chính xác):")
        sections.append(build_event_detail(db, focus_event))
        organizer = db.query(Club).filter(Club.id == focus_event.club_id).first()
        if organizer and organizer.id != getattr(focus_club, "id", None):
            sections.append(f"CLB TỔ CHỨC SỰ KIỆN NÀY: {organizer.name}")
    else:
        # Câu hỏi có nhắc "sự kiện/workshop/..." mà không nêu tên CLB -> không gắn CLB ngẫu nhiên
        q_norm = normalize(question)
        mentions_event = any(h in q_norm for h in ("su kien", "event", "workshop", "hoi nghi", "lich "))
        clubs = [focus_club] if focus_club else ([] if mentions_event else find_clubs(db, question))
        if clubs:
            sections.append("THỰC THỂ ĐƯỢC HỎI VỀ (chi tiết chính xác):")
            sections.extend(
                build_club_detail(db, club, include_description=not focus_club) for club in clubs
            )
        if not focus_club and mentions_event:
            # Câu hỏi không nhắc rõ CLB nào -> tìm sự kiện toàn cục
            events = find_events(db, question)
            if events:
                sections.append("SỰ KIỆN ĐƯỢC HỎI VỀ (chi tiết chính xác):")
                sections.extend(build_event_detail(db, event) for event in events)

    people = find_people(db, question)
    if people:
        sections.append("SINH VIÊN ĐƯỢC HỎI VỀ:")
        sections.extend(build_user_detail(db, user) for user in people)

    return "\n\n".join(sections)


KNOWLEDGE_RULES = (
    "\n\nQUY TẮC TRẢ LỜI (bắt buộc):\n"
    "1. Mọi con số, tên CLB, tên sự kiện, tên người phải lấy từ khối 'DỮ LIỆU HỆ THỐNG' ở trên.\n"
    "2. Tuyệt đối không tự bịa số liệu, không suy đoán, không dùng số liệu trong trí nhớ của bạn.\n"
    "3. Nếu khối dữ liệu không có thông tin cần hỏi, phải trả lời đúng câu: "
    "'Hệ thống hiện chưa có thông tin về <nội dung>'. Không được vẽ ra thông tin chung chung.\n"
    "4. Khi được hỏi về một CLB/sự kiện cụ thể, ưu tiên dùng phần 'THỰC THỂ ĐƯỢC HỎI VỀ'.\n"
    "5. Chỉ trả lời đúng những gì được hỏi: lấy con số có sẵn từ 'SỐ LIỆU TỔNG QUAN' hoặc "
    "'TRẢ LỜI SẴN', không liệt kê lại toàn bộ khối dữ liệu.\n"
    "6. Khi liệt kê CLB/sự kiện theo danh mục, chép đúng danh sách ở mục 'TRẢ LỜI SẴN', "
    "không tự đếm và không lặp lại tên.\n"
    "7. Không được tự đặt tên workshop/khóa học/sự kiện. Chỉ được nhắc tên sự kiện nằm trong danh sách "
    "'Sự kiện ĐÃ GHI NHẬN' của đúng CLB đó. Nếu câu hỏi hỏi về một loại sự kiện cụ thể "
    "(workshop, hackathon, khóa học...) mà danh sách không có mục nào đúng loại đó, phải trả lời "
    "rằng CLB đó chưa ghi nhận sự kiện loại đó trong hệ thống - tuyệt đối không bịa ra một cái tên.\n"
    "8. Câu mô tả CLB có thể nhắc 'tổ chức workshop/hackathon' theo nghĩa chung; đó KHÔNG phải là "
    "sự kiện cụ thể trong hệ thống, nên không được dùng làm căn cứ để kể ra tên sự kiện.\n"
    "9. Trả lời bằng tiếng Việt, ngắn gọn, dùng bullet khi có nhiều ý, không cần lời dẫn dài."
)
