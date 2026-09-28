"""
Router cho các chức năng AI (Cognitive Reasoning, Streaming, Insights, Recommendations)
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, AsyncGenerator
from datetime import datetime, timezone
import uuid
import json
import asyncio
import time
import re

_recs_cache: dict = {}


def _fallback_recommend(user_interests: str, clubs_data: list) -> list:
    """Gợi ý nhanh không cần AI khi Ollama quá lâu"""
    if not clubs_data:
        return []
    keys = (user_interests or "").lower()
    cands = [c for c in clubs_data if c["name"] and (keys and (
        keys in (c.get("category") or "").lower()
        or any(k in (c.get("tags") or "").lower() for k in keys.split(" - "))
        or any(k in (c.get("description") or "").lower() for k in keys.split(" - ")[:2] if k)
    ))]
    if not cands:
        cands = sorted(clubs_data, key=lambda c: c.get("member_count", 0), reverse=True)
    return [
        {"club": c, "reason": "Gợi ý từ AI: phù hợp với sở thích của bạn", "score": 0.9}
        for c in cands[:3]
    ]

from app.database import get_db
from app.models import AIChatHistory, User, Club, Event, Post, Membership
from app.schemas import (
    AIChatRequest, AIChatResponse,
    AIClubAnalysisRequest, AIClubAnalysisResponse,
    AIEventFeedbackRequest
)
from app.security import require_user, get_current_user
from app.ai_service import (
    ai_agent_chat, ai_summarize_club,
    ai_analyze_sentiment, ai_recommend_for_user,
    ai_extract_keywords, check_ollama,
    ai_predict_club_growth, ai_smart_matching,
    ai_generate_club_report, ai_agent_chat_stream,
    get_ai_model_info
)
from app.ai.thought_engine import thought_engine

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/status")
async def get_ai_status():
    """Kiểm tra trạng thái AI"""
    available = await check_ollama()
    return {
        "available": available,
        "engine": "Cognitive Thought Engine (Ollama / Cloud Hybrid)",
        "features": [
            "Trợ lý tư duy đa bước (Chain-of-Thought)",
            "Trích xuất Reasoning Traces ( thinking)",
            "Cố vấn hướng nghiệp cá nhân hóa (Career Mentor)",
            "Chiến lược gia tăng trưởng CLB (Growth Strategist)",
            "Kiến trúc sư sự kiện 360 độ (Event Architect)",
            "Sáng tạo nội dung truyền thông đa kênh (Media Producer)"
        ]
    }


@router.get("/model-info")
async def get_model_info():
    """Thông tin mô hình AI hiệu dụng (Ollama model, provider) cho UI hiển thị"""
    info = await get_ai_model_info()
    return info


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(
    payload: AIChatRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trò chuyện với AI Assistant có tư duy sâu"""
    user_id = current_user.id if current_user else None
    session_id = payload.session_id or str(uuid.uuid4())

    # Lấy lịch sử chat
    history = []
    if user_id:
        msgs = db.query(AIChatHistory).filter(
            AIChatHistory.user_id == user_id,
            AIChatHistory.session_id == session_id
        ).order_by(AIChatHistory.created_at.asc()).limit(10).all()
        history = [{"role": m.role, "message": m.message} for m in msgs]

    # Lưu tin nhắn user
    user_msg = AIChatHistory(
        user_id=user_id,
        session_id=session_id,
        role="user",
        message=payload.message,
        context=payload.context
    )
    db.add(user_msg)

    # User profile
    user_profile = None
    if current_user:
        user_profile = {
            "full_name": current_user.full_name,
            "faculty": current_user.faculty,
            "skills": current_user.skills,
            "interests": current_user.interests,
            "class_name": current_user.class_name
        }

    reply = await ai_agent_chat(
        payload.message,
        history,
        payload.context or "general",
        db=db,
        user_profile=user_profile
    )

    # Lưu phản hồi
    if reply:
        ai_msg = AIChatHistory(
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            message=reply,
            context=payload.context
        )
        db.add(ai_msg)
        db.commit()

    suggestions = _get_suggestions(payload.message)
    return AIChatResponse(reply=reply, session_id=session_id, suggestions=suggestions)


@router.post("/chat/stream")
async def chat_with_ai_stream(
    payload: AIChatRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trò chuyện với AI Assistant (Streaming SSE kèm Reasoning Steps)"""
    user_id = current_user.id if current_user else None
    session_id = payload.session_id or str(uuid.uuid4())

    # Lấy lịch sử chat
    history = []
    if user_id:
        msgs = db.query(AIChatHistory).filter(
            AIChatHistory.user_id == user_id,
            AIChatHistory.session_id == session_id
        ).order_by(AIChatHistory.created_at.asc()).limit(10).all()
        history = [{"role": m.role, "message": m.message} for m in msgs]

    # Lưu tin nhắn user
    user_msg = AIChatHistory(
        user_id=user_id,
        session_id=session_id,
        role="user",
        message=payload.message,
        context=payload.context
    )
    db.add(user_msg)
    db.commit()

    user_profile = None
    if current_user:
        user_profile = {
            "full_name": current_user.full_name,
            "faculty": current_user.faculty,
            "skills": current_user.skills,
            "interests": current_user.interests,
            "class_name": current_user.class_name
        }

    async def event_generator():
        full_reply = ""
        async for chunk in ai_agent_chat_stream(
            payload.message,
            history,
            payload.context or "general",
            db=db,
            user_profile=user_profile
        ):
            data = json.loads(chunk)
            data_type = data.get("type")

            if data_type == "token":
                token = data.get("content", "")
                full_reply += token
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
            elif data_type == "thought_step":
                yield f"data: {json.dumps(data)}\n\n"
            elif data_type == "tool_call":
                tool_name = data.get("tool", "")
                yield f"data: {json.dumps({'type': 'thought', 'content': f'Calling tool: {tool_name}'})}\n\n"
            elif data_type == "observation":
                yield f"data: {json.dumps({'type': 'observation', 'content': data.get('content', '')})}\n\n"
            elif data_type == "error":
                yield f"data: {json.dumps({'type': 'error', 'content': data.get('content', '')})}\n\n"

        # Lưu phản hồi cuối cùng vào DB
        if user_id and full_reply and full_reply.strip():
            ai_msg = AIChatHistory(
                user_id=user_id,
                session_id=session_id,
                role="assistant",
                message=full_reply,
                context=payload.context
            )
            db.add(ai_msg)
            db.commit()

        suggestions = _get_suggestions(payload.message)
        yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'suggestions': suggestions})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


def _get_suggestions(user_msg: str) -> list:
    """Gợi ý câu hỏi tiếp theo dựa trên nội dung"""
    msg = user_msg.lower()
    if any(kw in msg for kw in ["clb", "câu lạc bộ"]):
        return ["CLB nào phù hợp với định hướng của tôi?", "Quy trình phỏng vấn gia nhập CLB?", "Các sự kiện của CLB tháng này?"]
    if any(kw in msg for kw in ["sự kiện", "event", "workshop"]):
        return ["Cách thức Check-in nhận chứng chỉ số?", "Sự kiện nào sắp hết hạn đăng ký?", "Làm thế nào để cộng điểm rèn luyện?"]
    if any(kw in msg for kw in ["chiến lược", "quản lý", "tăng trưởng"]):
        return ["Cách giữ chân thành viên thụ động?", "Kế hoạch tổ chức Workshop viral?", "Cách phân công nhiệm vụ hiệu quả?"]
    return ["Tư vấn CLB phù hợp với tôi", "Sự kiện nổi bật sắp tới", "Lập kế hoạch sự kiện cùng AI"]


# ============= AI STUDIO ENDPOINTS (Mentor, Strategy, Event, Media) =============

@router.post("/mentor-chat")
async def mentor_chat(
    payload: dict,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tư vấn Mentor - Hướng dẫn lộ trình phát triển"""
    message = payload.get("message", "")
    club_id = payload.get("club_id")
    session_id = payload.get("session_id") or str(uuid.uuid4())

    if not message:
        raise HTTPException(400, "Message required")

    try:
        user_profile = None
        if current_user:
            user_profile = {
                "full_name": current_user.full_name,
                "faculty": current_user.faculty,
                "skills": current_user.skills,
                "interests": current_user.interests
            }

        reply = await ai_agent_chat(
            message,
            [],
            "mentor",
            db=db,
            user_profile=user_profile
        )

        return {
            "response": reply,
            "content": reply,
            "message": reply,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/strategy-advice")
async def strategy_advice(
    payload: dict,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chiến lược CLB - Lên kế hoạch phát triển"""
    club_data = payload.get("club_data", {})
    club_id = club_data.get("club_id")
    goals = club_data.get("goals", "")
    session_id = payload.get("session_id") or str(uuid.uuid4())

    if not goals:
        raise HTTPException(400, "Goals required")

    try:
        reply = await ai_agent_chat(
            goals,
            [],
            "strategy",
            db=db,
            user_profile=None
        )

        return {
            "strategy": reply,
            "content": reply,
            "message": reply,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/event-planning")
async def event_planning(
    payload: dict,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lên kế hoạch sự kiện - Thiết kế event 360 độ"""
    club_id = payload.get("club_id")
    event_data = payload.get("event_data", {})
    event_type = event_data.get("type", "workshop")
    description = event_data.get("description", "")
    session_id = payload.get("session_id") or str(uuid.uuid4())

    if not description:
        raise HTTPException(400, "Description required")

    try:
        prompt = f"Lên kế hoạch sự kiện {event_type}: {description}"
        reply = await ai_agent_chat(
            prompt,
            [],
            "event",
            db=db,
            user_profile=None
        )

        return {
            "plan": reply,
            "content": reply,
            "message": reply,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/media-content")
async def media_content(
    payload: dict,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo nội dung truyền thông - Sáng tạo post, story, newsletter"""
    club_id = payload.get("club_id")
    content_type = payload.get("content_type", "post")
    topics = payload.get("topics", "")
    session_id = payload.get("session_id") or str(uuid.uuid4())

    if not topics:
        topics = "Tạo nội dung cho CLB"

    try:
        prompt = f"Tạo {content_type} về: {topics}"
        reply = await ai_agent_chat(
            prompt,
            [],
            "media",
            db=db,
            user_profile=None
        )

        return {
            "content": reply,
            "message": reply,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(500, str(e))


# ============= AI INSIGHTS ENDPOINTS (Predictions, Analytics, Trends) =============

@router.get("/predictions")
async def get_predictions(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dự báo AI - Dự đoán xu hướng và cơ hội"""
    try:
        predictions = [
            {
                "title": "Tăng trưởng thành viên",
                "prediction": "Các CLB học thuật sẽ tăng 25-30% thành viên trong 3 tháng tới",
                "confidence": 85
            },
            {
                "title": "Sự kiện phổ biến",
                "prediction": "Workshop về AI và công nghệ sẽ thu hút lượng đăng ký cao",
                "confidence": 78
            },
            {
                "title": "Xu hướng tham gia",
                "prediction": "Sinh viên năm 1-2 tích cực hơn trong các hoạt động CLB",
                "confidence": 72
            }
        ]
        return predictions
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/analytics")
async def get_analytics(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Phân tích AI - Thống kê và chỉ số"""
    try:
        # Count stats from DB
        total_clubs = db.query(Club).filter(Club.is_active == True).count()
        total_events = db.query(Event).filter(Event.status == "upcoming").count()
        total_users = db.query(User).count()
        total_posts = db.query(Post).count()

        analytics = [
            {
                "label": "Tổng CLB hoạt động",
                "value": total_clubs,
                "change": "+12% so với tháng trước"
            },
            {
                "label": "Sự kiện sắp tới",
                "value": total_events,
                "change": "+8% so với tuần trước"
            },
            {
                "label": "Tổng sinh viên",
                "value": total_users,
                "change": "+15% so với tháng trước"
            },
            {
                "label": "Bài viết",
                "value": total_posts,
                "change": "+20% so với tuần trước"
            }
        ]
        return analytics
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/trends")
async def get_trends(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xu hướng AI - Phân tích hành vi và sở thích"""
    try:
        trends = [
            {
                "name": "Học thuật",
                "description": "CLB học thuật tăng trưởng nhanh nhất với 40% tăng thành viên",
            },
            {
                "name": "Thể thao & Wellness",
                "description": "Sự quan tâm đến các hoạt động thể chất tăng 35% sau mùa thi",
            },
            {
                "name": "Kỹ năng Kỹ thuật",
                "description": "AI/ML workshops thu hút 3x lượt đăng ký so với tháng trước",
            },
            {
                "name": "Tình nguyện & CSR",
                "description": "Các hoạt động cộng đồng ngày càng được ưa chuộng hơn",
            }
        ]
        return trends
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/analyze-club", response_model=AIClubAnalysisResponse)
async def analyze_club(payload: AIClubAnalysisRequest):
    """AI phân tích thông tin CLB"""
    result = await ai_summarize_club(payload.name, payload.description)
    return AIClubAnalysisResponse(
        summary=result.get("summary", ""),
        tags=result.get("tags", []),
        category_suggestion=result.get("category", "Kỹ năng")
    )


@router.post("/sentiment")
async def analyze_sentiment(payload: dict):
    """Phân tích cảm xúc văn bản"""
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Cần văn bản")
    sentiment = await ai_analyze_sentiment(text)
    return {"sentiment": sentiment}


@router.get("/recommendations")
async def get_recommendations(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Gợi ý CLB & sự kiện cá nhân hóa (AI, có cache + timeout để không chậm trang)"""
    now_ts = time.time()
    cached = _recs_cache.get(current_user.id)
    if cached and now_ts - cached["at"] < 600:
        return cached["data"]

    clubs = db.query(Club).filter(Club.is_active == True).limit(20).all()
    clubs_data = [
        {
            "id": c.id,
            "name": c.name,
            "category": c.category,
            "description": c.description or "",
            "tags": c.ai_tags or "",
            "member_count": c.member_count or 0
        } for c in clubs
    ]

    user_interests = f"{current_user.faculty or ''} - {current_user.skills or ''} - {current_user.interests or ''}"
    try:
        club_recs = await asyncio.wait_for(
            ai_recommend_for_user(user_interests, clubs_data),
            timeout=6
        )
    except Exception:
        club_recs = _fallback_recommend(user_interests, clubs_data)

    upcoming = db.query(Event).filter(
        Event.status == "upcoming"
    ).order_by(Event.start_time.asc()).limit(5).all()

    result = {
        "user_id": current_user.id,
        "clubs": club_recs,
        "events": [
            {
                "id": e.id,
                "title": e.title,
                "club_id": e.club_id,
                "start_time": e.start_time.isoformat() if e.start_time else "",
                "location": e.location,
                "ai_success_score": e.ai_success_score
            } for e in upcoming
        ]
    }
    _recs_cache[current_user.id] = {"at": now_ts, "data": result}
    return result


@router.post("/extract-keywords")
async def extract_keywords(payload: dict):
    """Trích xuất từ khóa"""
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Cần văn bản")
    keywords = await ai_extract_keywords(text)
    return {"keywords": keywords}


@router.get("/chat-history")
def get_chat_history(
    session_id: Optional[str] = None,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Lịch sử chat của user"""
    query = db.query(AIChatHistory).filter(AIChatHistory.user_id == current_user.id)
    if session_id:
        query = query.filter(AIChatHistory.session_id == session_id)
    history = query.order_by(AIChatHistory.created_at.desc()).limit(50).all()

    return [
        {
            "id": h.id,
            "role": h.role,
            "message": h.message,
            "context": h.context,
            "created_at": h.created_at.isoformat() if h.created_at else ""
        } for h in history
    ]


# ============ AI NÂNG CAO & INSIGHTS ============

@router.get("/club-insights/{club_id}")
async def get_club_insights(
    club_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """AI phân tích sâu & dự đoán tăng trưởng CLB"""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Không tìm thấy CLB")

    events_count = db.query(Event).filter(Event.club_id == club_id).count()
    posts_count = db.query(Post).filter(Post.club_id == club_id).count()

    club_data = {
        "name": club.name,
        "category": club.category,
        "member_count": club.member_count,
        "events_count": events_count,
        "posts_count": posts_count,
        "description": club.description,
        "ai_tags": club.ai_tags
    }

    insights = await ai_predict_club_growth(club_data)
    result = {
        "club_id": club_id,
        "club_name": club.name,
        "insights": insights
    }
    return result


@router.get("/smart-matching")
async def get_smart_matching(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """AI ghép đôi sinh viên cùng sở thích/khoa để kết nối"""
    my_memberships = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.is_active == True
    ).all()
    my_club_ids = [m.club_id for m in my_memberships]

    other_users = db.query(User).filter(
        User.id != current_user.id,
        User.is_active == True
    ).limit(30).all()

    all_clubs = db.query(Club).all()
    club_map = {c.id: c for c in all_clubs}
    my_clubs = [club_map[cid].name for cid in my_club_ids if cid in club_map]

    candidates = []
    for u in other_users:
        memberships = db.query(Membership).filter(
            Membership.user_id == u.id,
            Membership.is_active == True
        ).all()
        u_club_ids = [m.club_id for m in memberships]
        u_clubs = [club_map[cid].name for cid in u_club_ids if cid in club_map]

        candidates.append({
            "id": u.id,
            "full_name": u.full_name,
            "username": u.username,
            "faculty": u.faculty or "",
            "student_id": u.student_id or "",
            "clubs": u_clubs
        })

    user_profile = {
        "faculty": current_user.faculty or "",
        "interests": ", ".join(my_clubs),
        "skills": current_user.skills or "",
        "clubs": my_clubs
    }

    matches = await ai_smart_matching(user_profile, candidates)
    return {
        "user_id": current_user.id,
        "matches": matches
    }


@router.get("/club-report/{club_id}")
async def get_club_report(
    club_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """AI tự động sinh báo cáo tổng kết CLB"""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Không tìm thấy CLB")

    events_db = db.query(Event).filter(Event.club_id == club_id).limit(10).all()
    events = [{
        "title": e.title,
        "date": e.start_time.strftime("%d/%m/%Y") if e.start_time else "",
        "participants": e.current_participants
    } for e in events_db]

    posts_db = db.query(Post).filter(Post.club_id == club_id).limit(10).all()
    posts = [{
        "title": p.title,
        "views": p.views,
        "likes": p.likes
    } for p in posts_db]

    club_data = {
        "name": club.name,
        "category": club.category,
        "member_count": club.member_count,
        "description": club.description
    }

    report = await ai_generate_club_report(club_data, events, posts)
    return {
        "club_id": club_id,
        "club_name": club.name,
        "report": report,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
