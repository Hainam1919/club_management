"""
Mô hình cơ sở dữ liệu cho hệ thống quản lý câu lạc bộ
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    """Người dùng hệ thống (Admin, Chủ nhiệm, Thành viên)"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="member")  # admin, leader, member
    avatar = Column(String(255), default="")
    student_id = Column(String(20), unique=True, index=True)  # DTCxxxxxxxxx
    class_name = Column(String(50))  # Tên lớp: DHTI15A1, etc.
    phone = Column(String(15))
    faculty = Column(String(100))
    bio = Column(Text)  # Giới thiệu bản thân
    skills = Column(String(500))  # Kỹ năng (phân cách dấu phẩy)
    interests = Column(String(500))  # Sở thích
    social_facebook = Column(String(255))
    social_instagram = Column(String(255))
    social_github = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)  # Hiển thị thông tin công khai
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

    # Relationships
    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")
    events_created = relationship("Event", back_populates="creator")
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")


class Club(Base):
    """Câu lạc bộ"""
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    description = Column(Text)
    category = Column(String(50))  # Học thuật, Thể thao, Văn nghệ, Tình nguyện...
    logo = Column(String(255), default="")
    banner = Column(String(255), default="")
    founded_date = Column(DateTime, default=datetime.utcnow)
    president_id = Column(Integer, ForeignKey("users.id"))
    email = Column(String(100))
    facebook = Column(String(255))
    meeting_room = Column(String(100))
    member_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)  # Hiển thị công khai
    mission = Column(Text)  # Sứ mệnh
    vision = Column(Text)  # Tầm nhìn
    achievements = Column(Text)  # Thành tích nổi bật
    created_at = Column(DateTime, default=datetime.utcnow)

    # AI Generated fields
    ai_summary = Column(Text)  # Tóm tắt AI tạo
    ai_tags = Column(String(500))  # Tags do AI gợi ý

    # Relationships
    memberships = relationship("Membership", back_populates="club", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="club", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="club", cascade="all, delete-orphan")


class Membership(Base):
    """Thành viên trong câu lạc bộ"""
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    role = Column(String(30), default="member")  # president, vice_president, member
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    contribution_score = Column(Float, default=0.0)  # Điểm đóng góp do AI đánh giá

    user = relationship("User", back_populates="memberships")
    club = relationship("Club", back_populates="memberships")


class Event(Base):
    """Sự kiện của câu lạc bộ"""
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"))
    location = Column(String(200))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    max_participants = Column(Integer, default=0)  # 0 = không giới hạn
    current_participants = Column(Integer, default=0)
    status = Column(String(20), default="upcoming")  # upcoming, ongoing, completed, cancelled
    cover_image = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    # AI insights
    ai_sentiment = Column(String(20))  # Phân tích cảm xúc
    ai_success_score = Column(Float, default=0.0)  # Điểm dự đoán thành công

    club = relationship("Club", back_populates="events")
    creator = relationship("User", back_populates="events_created")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")


class EventRegistration(Base):
    """Đăng ký tham gia sự kiện"""
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    registered_at = Column(DateTime, default=datetime.utcnow)
    attended = Column(Boolean, default=False)
    feedback = Column(Text)
    rating = Column(Integer)  # 1-5

    event = relationship("Event", back_populates="registrations")


class Post(Base):
    """Bài viết / Thông báo của CLB"""
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_type = Column(String(20), default="news")  # news, announcement, recruitment
    cover_image = Column(String(255), default="")
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # AI fields
    ai_category = Column(String(50))
    ai_keyword = Column(String(255))

    club = relationship("Club", back_populates="posts")
    author = relationship("User", back_populates="posts")


class AIChatHistory(Base):
    """Lịch sử chat với AI Assistant"""
    __tablename__ = "ai_chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(String(100), index=True)
    role = Column(String(20))  # user, assistant
    message = Column(Text, nullable=False)
    context = Column(String(100))  # Bối cảnh: club, event, general
    created_at = Column(DateTime, default=datetime.utcnow)


class AIRecommendation(Base):
    """Gợi ý từ AI"""
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_type = Column(String(30))  # club, event, post
    item_id = Column(Integer)
    score = Column(Float, default=0.0)
    reason = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    """Thông báo trong hệ thống"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(30))  # event, club, post, system, ai
    title = Column(String(200), nullable=False)
    message = Column(Text)
    icon = Column(String(50))
    link = Column(String(255))  # URL/page để navigate
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ActivityLog(Base):
    """Nhật ký hoạt động hệ thống"""
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action = Column(String(50), nullable=False)  # create_club, join_event, etc.
    target_type = Column(String(30))  # club, event, post
    target_id = Column(Integer)
    description = Column(String(500))
    metadata_json = Column(Text)  # JSON string
    ip_address = Column(String(45))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class NotificationPreference(Base):
    """User preferences cho notifications"""
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    # Kênh nhận
    in_app = Column(Boolean, default=True)  # Trong app
    email = Column(Boolean, default=False)  # Email
    # Loại thông báo
    notif_event = Column(Boolean, default=True)  # Sự kiện
    notif_club = Column(Boolean, default=True)  # CLB
    notif_comment = Column(Boolean, default=True)  # Bình luận/reaction
    notif_achievement = Column(Boolean, default=True)  # Thành tích
    notif_follow = Column(Boolean, default=True)  # Follow
    quiet_hours_start = Column(String(5), default="22:00")  # HH:MM
    quiet_hours_end = Column(String(5), default="07:00")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Comment(Base):
    """Bình luận trên bài viết / sự kiện"""
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(String(30), nullable=False)  # post, event
    target_id = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Poll(Base):
    """Bình chọn / Khảo sát trong CLB"""
    __tablename__ = "polls"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(String(500), nullable=False)
    description = Column(Text)
    is_multiple = Column(Boolean, default=False)  # Chọn nhiều đáp án
    is_anonymous = Column(Boolean, default=False)
    closes_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    options = relationship(
        "PollOption",
        back_populates="poll",
        cascade="all, delete-orphan",
        order_by="PollOption.order_index"
    )


class PollOption(Base):
    """Lựa chọn trong poll"""
    __tablename__ = "poll_options"

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False, index=True)
    poll = relationship("Poll", back_populates="options")
    text = Column(String(200), nullable=False)
    vote_count = Column(Integer, default=0)
    order_index = Column(Integer, default=0)


class PollVote(Base):
    """Vote của user cho poll"""
    __tablename__ = "poll_votes"

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("poll_options.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    voted_at = Column(DateTime, default=datetime.utcnow)


class EventCheckIn(Base):
    """Check-in QR code cho sự kiện"""
    __tablename__ = "event_checkins"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    qr_code = Column(String(100), unique=True, index=True)
    checked_in_at = Column(DateTime, default=datetime.utcnow)
    check_in_method = Column(String(20), default="qr")  # qr, manual


class EventRating(Base):
    """Đánh giá sự kiện sau khi tham gia"""
    __tablename__ = "event_ratings"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    review = Column(Text)
    would_recommend = Column(Boolean, default=True)
    aspects = Column(String(500))  # JSON: organization, content, venue
    created_at = Column(DateTime, default=datetime.utcnow)


class Message(Base):
    """Tin nhắn nội bộ giữa thành viên"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # null = group
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)  # nhóm CLB
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class MentorConnection(Base):
    """Kết nối Mentor - Mentee"""
    __tablename__ = "mentor_connections"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    status = Column(String(20), default="pending")  # pending, active, ended
    started_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)


class Document(Base):
    """Tài liệu CLB"""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False, index=True)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    file_url = Column(String(500))
    file_type = Column(String(50))  # pdf, doc, image, video
    category = Column(String(50))
    download_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Achievement(Base):
    """Huy hiệu / Thành tích"""
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)  # first_join, event_master, etc.
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    icon = Column(String(50))  # emoji hoặc icon class
    points = Column(Integer, default=10)
    rarity = Column(String(20), default="common")  # common, rare, epic, legendary
    category = Column(String(30))  # activity, social, leadership


class UserAchievement(Base):
    """Huy hiệu của người dùng"""
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)
    progress = Column(Float, default=100.0)  # % hoàn thành


class UserPoints(Base):
    """Điểm thưởng & Level của người dùng"""
    __tablename__ = "user_points"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    total_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    experience = Column(Integer, default=0)  # XP trong level hiện tại
    rank = Column(String(30), default="Tân binh")  # Tân binh, Đồng, Bạc, Vàng, Kim cương
    streak_days = Column(Integer, default=0)  # Số ngày liên tục hoạt động
    last_activity = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Reaction(Base):
    """Reactions đa dạng (like, love, haha, wow, sad, angry)"""
    __tablename__ = "reactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(String(30), nullable=False)  # post, event, comment
    target_id = Column(Integer, nullable=False)
    reaction_type = Column(String(20), default="like")  # like, love, haha, wow, sad, angry
    created_at = Column(DateTime, default=datetime.utcnow)


class Follow(Base):
    """Follow user hoặc CLB"""
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    target_type = Column(String(20), nullable=False)  # user, club
    target_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ClubTask(Base):
    """Nhiệm vụ của CLB"""
    __tablename__ = "club_tasks"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="todo")  # todo, in_progress, done
    priority = Column(String(20), default="medium")  # low, medium, high
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class FileUpload(Base):
    """File uploads (avatar, banner, attachments)"""
    __tablename__ = "file_uploads"

    id = Column(Integer, primary_key=True, index=True)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50))  # image, document, video
    mime_type = Column(String(100))
    file_size = Column(Integer)
    target_type = Column(String(30))  # avatar, club_logo, club_banner, post, event
    target_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmailLog(Base):
    """Log emails đã gửi"""
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    to_email = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text)
    email_type = Column(String(50))  # notification, reminder, newsletter
    status = Column(String(20), default="pending")  # pending, sent, failed
    sent_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserActivity(Base):
    """Real-time user activity tracking"""
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # online, viewing, typing
    target_type = Column(String(50))
    target_id = Column(Integer)
    last_seen = Column(DateTime, default=datetime.utcnow, index=True)


class Certificate(Base):
    """Chứng nhận thành viên"""
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False, index=True)
    certificate_type = Column(String(50), nullable=False)  # member, active, excellent, completion
    title = Column(String(255), nullable=False)
    description = Column(Text)
    issued_date = Column(DateTime, default=datetime.utcnow)
    verify_code = Column(String(50), unique=True, index=True)  # QR verify
    issued_by = Column(Integer, ForeignKey("users.id"))
    is_public = Column(Boolean, default=True)


class EventGallery(Base):
    """Album ảnh sự kiện"""
    __tablename__ = "event_gallery"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    caption = Column(String(500))
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class QAQuestion(Base):
    """Hỏi đáp trong CLB"""
    __tablename__ = "qa_questions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False, index=True)
    question = Column(String(500), nullable=False)
    answer = Column(Text)
    answered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    answered_at = Column(DateTime, nullable=True)
    upvotes = Column(Integer, default=0)
    is_answered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AIGeneratedImage(Base):
    """AI sinh ảnh cho CLB (banner, logo)"""
    __tablename__ = "ai_generated_images"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt = Column(String(500), nullable=False)
    image_type = Column(String(30))  # banner, logo, post_cover, event_cover
    image_url = Column(String(500))
    style = Column(String(50))  # modern, minimalist, vibrant, professional
    created_at = Column(DateTime, default=datetime.utcnow)


class AIInsightReport(Base):
    """Báo cáo AI nâng cao (predictive)"""
    __tablename__ = "ai_insight_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(50), nullable=False)  # trend, prediction, anomaly, recommendation
    target_type = Column(String(30))
    target_id = Column(Integer)
    title = Column(String(255), nullable=False)
    summary = Column(Text)
    data_json = Column(Text)  # JSON: chi tiết data
    confidence = Column(Float, default=0.0)  # 0-1
    created_at = Column(DateTime, default=datetime.utcnow)
