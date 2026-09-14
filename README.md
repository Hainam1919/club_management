# 🎓 CLB Student Hub - Hệ thống Quản lý Câu lạc bộ Sinh viên tích hợp AI

Hệ thống quản lý câu lạc bộ sinh viên hoàn chỉnh với **tích hợp AI thật** (Ollama + llama3.2), giao diện hiện đại, backend FastAPI mạnh mẽ.

## ✨ Tính năng nổi bật

### 🤖 AI Features (Tích hợp thật với Ollama)
- **Trợ lý AI trò chuyện** - Tư vấn CLB, sự kiện, hoạt động sinh viên
- **AI tóm tắt & phân loại CLB** - Tự động tạo mô tả, gợi ý tags & danh mục
- **AI dự đoán thành công sự kiện** - Phân tích scoring 0-100%
- **AI phân tích cảm xúc** - Đánh giá feedback tích cực/tiêu cực
- **AI gợi ý cá nhân hóa** - Đề xuất CLB theo sở thích
- **AI sinh nội dung** - Tự động viết bài cho CLB
- **AI trích xuất từ khóa** - SEO optimization

### 🎨 Giao diện
- **Modern UI/UX** - Thiết kế hiện đại, chuyên nghiệp
- **Responsive** - Tương thích mọi thiết bị
- **Glassmorphism navbar** - Hiệu ứng kính mờ cao cấp
- **AI Floating Chat** - Trợ lý AI luôn sẵn sàng
- **Animation mượt mà** - Trải nghiệm người dùng tốt nhất

### 🛠 Công nghệ
- **Backend**: Python + FastAPI + SQLAlchemy + SQLite
- **AI**: Ollama (llama3.2:3b) + Fallback thông minh
- **Auth**: JWT + Bcrypt
- **Frontend**: Vanilla JS + CSS3 (không phụ thuộc framework)

## 📁 Cấu trúc dự án

```
club_management/
├── app/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Cấu hình SQLite
│   ├── models.py            # Models: User, Club, Event, Post...
│   ├── schemas.py           # Pydantic schemas
│   ├── security.py          # JWT + Bcrypt
│   ├── ai_service.py        # ⭐ Dịch vụ AI (Ollama)
│   └── routers/
│       ├── auth.py          # /api/auth/*
│       ├── clubs.py         # /api/clubs/*
│       ├── events.py        # /api/events/*
│       ├── posts.py         # /api/posts/*
│       ├── ai.py            # /api/ai/*  ⭐
│       └── stats.py         # /api/stats/*
├── frontend/
│   ├── index.html
│   ├── css/style.css        # 1000+ dòng CSS
│   └── js/
│       ├── api.js           # API client
│       ├── app.js           # App controller
│       ├── pages.js         # 12+ trang
│       └── ai.js            # AI chat module
├── data/                    # SQLite database
├── requirements.txt
└── README.md
```

## 🚀 Cài đặt & Chạy

### 1. Cài đặt dependencies
```bash
cd club_management
pip install -r requirements.txt
```

### 2. (Tùy chọn) Cài Ollama để dùng AI thật
```bash
# macOS
brew install ollama
ollama serve
ollama pull llama3.2:3b
```

> **Lưu ý**: Nếu không có Ollama, hệ thống vẫn hoạt động với **AI fallback thông minh** (rule-based + keyword analysis).

### 3. Khởi động server
```bash
cd club_management
python -m uvicorn app.main:app --reload --port 9000
```

### 4. Truy cập
- **Giao diện**: http://localhost:9000
- **API Docs**: http://localhost:9000/docs
- **API ReDoc**: http://localhost:9000/redoc

## 👤 Tài khoản demo

| Tài khoản | Mật khẩu | Vai trò |
|-----------|----------|---------|
| `admin`   | `admin123` | Admin |
| `demo`    | `demo123`  | Sinh viên |

## 🌐 API Endpoints chính

### Auth
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login-json` - Đăng nhập
- `GET /api/auth/me` - Thông tin user

### Clubs
- `GET /api/clubs` - Danh sách CLB
- `GET /api/clubs/{id}` - Chi tiết
- `POST /api/clubs` - Tạo (AI phân tích)
- `POST /api/clubs/{id}/join` - Tham gia

### Events
- `GET /api/events` - Danh sách
- `GET /api/events/upcoming` - Sắp tới
- `POST /api/events` - Tạo (AI dự đoán)
- `POST /api/events/{id}/register` - Đăng ký

### AI ⭐
- `POST /api/ai/chat` - Chat với AI
- `POST /api/ai/analyze-club` - AI phân tích CLB
- `POST /api/ai/sentiment` - Phân tích cảm xúc
- `GET /api/ai/recommendations` - Gợi ý cá nhân
- `POST /api/ai/extract-keywords` - Trích xuất từ khóa

## 🎯 Điểm nhấn khi bàn giao

1. **AI thật 100%** - Tích hợp Ollama local, không fake
2. **Fallback thông minh** - Vẫn hoạt động khi không có Ollama
3. **Code sạch, có cấu trúc** - RESTful API chuẩn
4. **UI/UX chuyên nghiệp** - Modern, mượt mà
5. **Đầy đủ chức năng** - CRUD, auth, search, filter
6. **Documentation đầy đủ** - README + API docs tự động
7. **Database mẫu** - Có sẵn dữ liệu demo

## 🛡️ Bảo mật

- Mật khẩu hash với **bcrypt**
- Xác thực **JWT** với expiry 7 ngày
- Phân quyền **admin/leader/member**
- Validation đầu vào với **Pydantic**
- CORS protection

## 📝 License

Built for educational purposes. © 2026.
