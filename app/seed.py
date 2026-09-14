"""
Database Seed Data Module for CLB Student Hub
Tạo dữ liệu mẫu phong phú: Admin, Sinh viên mẫu, CLBs, Sự kiện, Bài viết, Điểm rèn luyện.
Chạy trực tiếp: python -m app.seed
"""
import random
import logging
from datetime import datetime, timezone, timedelta
from re import sub
from sqlalchemy.orm import Session

from app.database import SessionLocal, init_db
from app.models import User, Club, Event, Post, Membership, UserPoints
from app.security import hash_password
from app.utils import init_default_achievements, calculate_level

logger = logging.getLogger("club_management.seed")


async def seed_data(db: Session = None):
    """Khởi tạo dữ liệu mẫu phong phú cho hệ thống"""
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        init_default_achievements(db)

        # 1. Tạo Admin
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@ictu.edu.vn",
                full_name="Quản trị viên ICTU",
                hashed_password=hash_password("admin123"),
                role="admin",
                faculty="Ban Quản lý Sinh viên",
                student_id="ADMIN001"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # 2. Tạo Demo User
        if not db.query(User).filter(User.username == "demo").first():
            demo = User(
                username="demo",
                email="demo@ictu.edu.vn",
                full_name="Sinh viên Demo",
                hashed_password=hash_password("demo123"),
                role="member",
                faculty="Công nghệ Thông tin",
                student_id="SV2024001",
                phone="0123456789",
                skills="Python, React, AI, Machine Learning",
                interests="Lập trình, Hackathon, Âm nhạc"
            )
            db.add(demo)
            db.commit()

        # 3. Tạo 50 sinh viên mẫu
        if db.query(User).count() < 10:
            last_names = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"]
            middle_names_male = ["Văn", "Hữu", "Đức", "Minh", "Quang", "Thành", "Công", "Đình", "Bảo", "Gia", "Anh", "Quốc"]
            middle_names_female = ["Thị", "Ngọc", "Hồng", "Kim", "Thanh", "Bích", "Phương", "Hoài", "Khánh", "Mai", "Diệu", "Hà"]
            first_names_male = ["An", "Bình", "Dũng", "Phong", "Hùng", "Khánh", "Nam", "Quang", "Sơn", "Tuấn", "Minh", "Long", "Phúc", "Đạt", "Huy"]
            first_names_female = ["Chi", "Linh", "Mai", "Oanh", "Phương", "Thảo", "Uyên", "Vân", "Hoa", "Yến", "Hương", "Trang", "Vy", "Nhi", "Anh"]
            faculties = ["Công nghệ Thông tin", "Kinh tế", "Kỹ thuật", "Y khoa", "Ngoại ngữ", "Luật", "Sư phạm", "Kiến trúc", "Thiết kế"]
            class_prefix = {"Công nghệ Thông tin": "DHTI", "Kinh tế": "QTKD", "Kỹ thuật": "DHKT", "Ngoại ngữ": "DHNN"}

            bios = [
                "Đam mê công nghệ và thích khám phá những điều mới mẻ. Luôn sẵn sàng học hỏi.",
                "Yêu thích hoạt động ngoại khóa, tham gia tích cực các hoạt động tình nguyện.",
                "Sinh viên năng động, sáng tạo, đam mê lập trình và phát triển bản thân.",
                "Thích đọc sách, nghe nhạc và tham gia các hoạt động thể thao."
            ]
            skills_pool = [
                "Python, JavaScript, React", "Lập trình Python, SQL", "Photoshop, Figma, UI/UX",
                "Public Speaking, Leadership", "Marketing, SEO, Content", "Guitar, Piano, Sáng tác",
                "Bóng đá, Bóng rổ, Yoga", "Tiếng Anh, IELTS 7.0"
            ]

            for i in range(50):
                username = f"sv{i+1:03d}"
                faculty = random.choice(faculties)
                student_id = f"DTC{random.randint(100000000, 999999999)}"
                prefix = class_prefix.get(faculty, "DHTI")
                class_name = f"{prefix}{random.randint(13, 18)}{random.choice(['A', 'B', 'C'])}{random.randint(1, 5)}"

                is_female = random.random() < 0.5
                last_name = random.choice(last_names)
                middle_name = random.choice(middle_names_female if is_female else middle_names_male)
                first_name = random.choice(first_names_female if is_female else first_names_male)
                full_name = f"{last_name} {middle_name} {first_name}"

                if not db.query(User).filter(User.username == username).first():
                    user = User(
                        username=username,
                        email=f"{username}@ictu.edu.vn",
                        full_name=full_name,
                        hashed_password=hash_password("sv123456"),
                        role="leader" if i < 5 else "member",
                        faculty=faculty,
                        class_name=class_name,
                        student_id=student_id,
                        phone=f"09{random.randint(10000000, 99999999)}",
                        bio=random.choice(bios),
                        skills=random.choice(skills_pool),
                        interests="Lập trình, Âm nhạc, Thể thao",
                        social_facebook=f"https://facebook.com/{username}",
                        is_public=True
                    )
                    db.add(user)
            db.commit()

        # 4. Tạo 20 CLB mẫu
        if db.query(Club).count() < 10:
            sample_clubs = [
                {"name": "CLB Lập trình IT", "category": "Học thuật", "desc": "CLB lập trình, AI, Hackathon, phát triển phần mềm.", "tags": "lập trình, AI, Python, web, React, hackathon"},
                {"name": "CLB Bóng đá Sinh viên", "category": "Thể thao", "desc": "Đội bóng đá sinh viên trường, thi đấu giải liên trường.", "tags": "bóng đá, thể thao, sức khỏe, thi đấu"},
                {"name": "CLB Văn nghệ Xì Tin", "category": "Văn nghệ", "desc": "CLB ca hát, nhảy múa, biểu diễn nghệ thuật.", "tags": "ca hát, nhảy, văn nghệ, nghệ thuật"},
                {"name": "CLB Tình nguyện Xanh", "category": "Tình nguyện", "desc": "Hoạt động tình nguyện vì cộng đồng, trồng cây, hiến máu.", "tags": "tình nguyện, cộng đồng, hiến máu, thiện nguyện"},
                {"name": "CLB Kỹ năng mềm", "category": "Kỹ năng", "desc": "Rèn luyện kỹ năng thuyết trình, giao tiếp, lãnh đạo.", "tags": "kỹ năng mềm, thuyết trình, lãnh đạo, giao tiếp"},
                {"name": "CLB Truyền thông MC", "category": "Truyền thông", "desc": "Chuyên về truyền thông, làm MC, quay phim chụp ảnh.", "tags": "truyền thông, MC, content, media, video"},
                {"name": "CLB Robotics & IoT", "category": "Học thuật", "desc": "Nghiên cứu robot, IoT, tự động hóa và STEM.", "tags": "robotics, IoT, STEM, tự động hóa, arduino"},
                {"name": "CLB Tiếng Anh", "category": "Học thuật", "desc": "Luyện tập tiếng Anh giao tiếp, IELTS, TOEIC.", "tags": "tiếng Anh, IELTS, TOEIC, ngoại ngữ"},
                {"name": "CLB Guitar & Âm nhạc", "category": "Văn nghệ", "desc": "Chơi đàn acoustic, sáng tác và biểu diễn.", "tags": "guitar, piano, âm nhạc, acoustic"},
                {"name": "CLB Startup & Khởi nghiệp", "category": "Kỹ năng", "desc": "Hỗ trợ sinh viên hiện thực hóa ý tưởng khởi nghiệp.", "tags": "startup, khởi nghiệp, kinh doanh, sáng tạo"}
            ]

            leaders = db.query(User).filter(User.role == "leader").all()
            for idx, data in enumerate(sample_clubs):
                slug = sub(r'[^\w\s-]', '', data["name"].lower()).replace(" ", "-")
                if db.query(Club).filter(Club.slug == slug).first():
                    continue
                leader = leaders[idx % len(leaders)] if leaders else admin
                club = Club(
                    name=data["name"],
                    slug=slug,
                    description=data["desc"],
                    category=data["category"],
                    member_count=random.randint(35, 180),
                    ai_summary=f"{data['name']} là nơi hội tụ các bạn sinh viên đam mê {data['category']}.",
                    ai_tags=data["tags"],
                    president_id=leader.id,
                    email=f"{slug}@ictu.edu.vn",
                    meeting_room=f"Phòng {100 + random.randint(1, 40)}",
                    mission=f"Phát triển kỹ năng chuyên môn và tinh thần đồng đội trong lĩnh vực {data['category']}.",
                    vision="Trở thành CLB kiểu mẫu dẫn đầu các phong trào sinh viên trường ICTU.",
                    is_public=True
                )
                db.add(club)
            db.commit()

        # 5. Phân bổ thành viên vào CLB
        all_users = db.query(User).filter(User.role.in_(["member", "leader"])).all()
        all_clubs = db.query(Club).all()
        existing_memberships = set((m.user_id, m.club_id) for m in db.query(Membership).all())

        for user in all_users:
            chosen_clubs = random.sample(all_clubs, min(3, len(all_clubs)))
            for club in chosen_clubs:
                if (user.id, club.id) not in existing_memberships:
                    role = "president" if user.id == club.president_id else "member"
                    m = Membership(user_id=user.id, club_id=club.id, role=role, contribution_score=random.uniform(30, 95))
                    db.add(m)
                    existing_memberships.add((user.id, club.id))
        db.commit()

        # 6. Tạo sự kiện mẫu
        if db.query(Event).count() < 10 and all_clubs:
            now = datetime.now(timezone.utc)
            event_titles = [
                ("Workshop: Lập trình AI với Python", "Hội trường A", 100),
                ("Hackathon 2026 - Bứt phá công nghệ", "Nhà thi đấu", 150),
                ("Đêm nhạc Acoustic Sinh viên", "Sân trường", 300),
                ("Ngày hội Việc làm & Kết nối Doanh nghiệp", "Hội trường B", 400),
                ("Tọa đàm: Kỹ năng Lãnh đạo & Thuyết trình", "Phòng 301", 80)
            ]
            for title, loc, max_p in event_titles:
                club = random.choice(all_clubs)
                start = now + timedelta(days=random.randint(2, 20), hours=random.randint(8, 14))
                event = Event(
                    title=title,
                    description=f"Sự kiện {title} do {club.name} tổ chức với nhiều hoạt động hấp dẫn.",
                    club_id=club.id,
                    creator_id=club.president_id or admin.id,
                    location=loc,
                    start_time=start,
                    end_time=start + timedelta(hours=3),
                    max_participants=max_p,
                    current_participants=random.randint(10, max_p // 2),
                    status="upcoming",
                    ai_success_score=random.uniform(75, 95),
                    ai_sentiment="positive"
                )
                db.add(event)
            db.commit()

        # 7. Khởi tạo điểm rèn luyện & Level
        for u in db.query(User).all():
            if not db.query(UserPoints).filter(UserPoints.user_id == u.id).first():
                base_points = 100 if u.role == "admin" else 50 if u.role == "leader" else 20
                total = base_points + random.randint(10, 150)
                _, lvl, rank_name, _ = calculate_level(total)
                up = UserPoints(
                    user_id=u.id,
                    total_points=total,
                    level=lvl,
                    rank=rank_name,
                    streak_days=random.randint(1, 15)
                )
                db.add(up)
        db.commit()

        logger.info("Seed data hoàn tất thành công!")
    except Exception as e:
        logger.error(f"Lỗi khi seed data: {e}", exc_info=True)
        db.rollback()
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    import asyncio
    init_db()
    asyncio.run(seed_data())
    print("Database seeding completed successfully!")
