"""
Cấu hình cơ sở dữ liệu SQLite với SQLAlchemy
Sử dụng DATABASE_URL từ config (environment-based)
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Support both SQLite and PostgreSQL
_connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=_connect_args,
    echo=settings.APP_ENV == "development",
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Khởi tạo cơ sở dữ liệu"""
    from app import models
    Base.metadata.create_all(bind=engine)


# Indexes tăng tốc các truy vấn thường gặp (create_all không tạo index,
# nên tạo trực tiếp bằng DDL idempotent)
_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_events_club ON events (club_id)",
    "CREATE INDEX IF NOT EXISTS idx_events_start ON events (start_time)",
    "CREATE INDEX IF NOT EXISTS idx_posts_club ON posts (club_id)",
    "CREATE INDEX IF NOT EXISTS idx_posts_created ON posts (created_at)",
    "CREATE INDEX IF NOT EXISTS idx_memberships_club ON memberships (club_id)",
    "CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships (user_id)",
    "CREATE INDEX IF NOT EXISTS idx_event_regs_event ON event_registrations (event_id)",
    "CREATE INDEX IF NOT EXISTS idx_event_regs_user ON event_registrations (user_id)",
    "CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id)",
    "CREATE INDEX IF NOT EXISTS idx_notif_user_read ON notifications (user_id, is_read)",
    "CREATE INDEX IF NOT EXISTS idx_comments_target ON comments (target_type, target_id)",
    "CREATE INDEX IF NOT EXISTS idx_ai_chat_user ON ai_chat_history (user_id)",
    "CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs (user_id)",
    "CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes (poll_id)",
    "CREATE INDEX IF NOT EXISTS idx_checkins_event ON event_checkins (event_id)",
    "CREATE INDEX IF NOT EXISTS idx_docs_club ON documents (club_id)",
]


def ensure_indexes():
    """Tạo index + tối ưu SQLite (WAL) nếu chưa có — không phá dữ liệu hiện có"""
    if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        return
    with engine.connect() as conn:
        conn.exec_driver_sql("PRAGMA journal_mode=WAL")
        conn.exec_driver_sql("PRAGMA synchronous=NORMAL")
        for stmt in _INDEXES:
            conn.exec_driver_sql(stmt)
