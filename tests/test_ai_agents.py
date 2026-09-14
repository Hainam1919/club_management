"""
Test suite cho 4 Cognitive Specialized Agents:
1. Career & Skill Mentor Agent
2. Club Growth Strategist Agent
3. Autonomous Event Architect Agent
4. Creative Media Producer Agent
"""
import pytest
from app.ai.agents import (
    mentor_agent,
    strategist_agent,
    event_architect_agent,
    media_agent,
)
from app.models import User, Club, Event, Membership
from app.security import hash_password


@pytest.mark.asyncio
async def test_career_mentor_agent(db_session, regular_user):
    """Kiểm thử Agent 1: Cố vấn Hướng nghiệp & Lộ trình 6 tháng"""
    result = await mentor_agent.analyze_and_plan(
        user_id=regular_user.id,
        target_role="AI Engineer & Tech Lead",
        db=db_session
    )

    assert result is not None
    assert "strengths" in result or "overall_readiness_score" in result or "user_info" in result


@pytest.mark.asyncio
async def test_club_strategist_agent(db_session):
    """Kiểm thử Agent 2: Chiến lược gia Tăng trưởng CLB"""
    club = Club(
        name="CLB Robotics",
        slug="clb-robotics",
        category="Học thuật",
        description="Nghiên cứu robotics & IoT",
        member_count=45,
        is_active=True
    )
    db_session.add(club)
    db_session.commit()
    db_session.refresh(club)

    result = await strategist_agent.diagnose_and_strategize(
        club_id=club.id,
        db=db_session
    )

    assert result is not None
    assert len(result) > 0


@pytest.mark.asyncio
async def test_event_architect_agent(db_session):
    """Kiểm thử Agent 3: Kiến trúc sư Sự kiện 360 độ"""
    result = await event_architect_agent.design_event_blueprint(
        title="AI Hackathon 2026",
        concept="Cuộc thi lập trình ứng dụng AI cho sinh viên",
        expected_attendees=150,
        estimated_budget_vnd=10000000,
        db=db_session
    )

    assert result is not None
    assert len(result) > 0


@pytest.mark.asyncio
async def test_media_producer_agent():
    """Kiểm thử Agent 4: Sáng tạo Nội dung Đa kênh"""
    result = await media_agent.create_multi_channel_content(
        title="Lễ Khai mạc Giải Bóng Đá Sinh Viên ICTU",
        topic_details="Giải đấu quy tụ 16 đội bóng toàn trường với giải thưởng hấp dẫn",
        target_audience="Toàn thể sinh viên",
        tone="genz_energetic"
    )

    assert result is not None
    assert len(result) > 0


def test_ai_pro_endpoints(client, auth_headers, db_session, regular_user):
    """Kiểm thử các API endpoints trong /api/ai-pro"""
    # 1. Mentor Plan Endpoint
    resp = client.post(
        "/api/ai-pro/mentor-plan",
        json={"target_role": "Fullstack Developer"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "roadmap" in data or "six_month_roadmap" in data or "strengths" in data

    # 2. Event Blueprint Endpoint
    resp = client.post(
        "/api/ai-pro/event-blueprint",
        json={
            "title": "Workshop Machine Learning",
            "concept": "Thực hành xây dựng mô hình AI cơ bản",
            "expected_attendees": 80,
            "estimated_budget_vnd": 3000000
        },
        headers=auth_headers
    )
    assert resp.status_code == 200
    assert "timeline" in resp.json() or "content" in resp.json() or len(resp.json()) > 0

    # 3. Media Kit Endpoint
    resp = client.post(
        "/api/ai-pro/media-kit",
        json={
            "title": "Tuyển thành viên CLB Âm Nhạc",
            "topic_details": "Chào đón tất cả các bạn đam mê ca hát và nhạc cụ",
            "tone": "genz_energetic"
        },
        headers=auth_headers
    )
    assert resp.status_code == 200
    assert len(resp.json()) > 0

    # 4. Generate SVG Image Endpoint
    resp = client.post(
        "/api/ai-pro/generate-image",
        json={
            "prompt": "CLB Lập Trình Python AI",
            "image_type": "banner",
            "style": "tech"
        },
        headers=auth_headers
    )
    assert resp.status_code == 200
    assert "svg" in resp.json()
    assert "<svg" in resp.json()["svg"]

    # 5. Predictive Insights
    resp = client.get("/api/ai-pro/predictive-insights", headers=auth_headers)
    assert resp.status_code == 200
    assert "insights" in resp.json()
