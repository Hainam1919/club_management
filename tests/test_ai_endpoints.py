"""
Test suite cho AI Base Endpoints (/api/ai/...)
"""
import pytest
from app.models import Club, Event


def test_ai_status(client):
    """Kiểm tra status AI"""
    resp = client.get("/api/ai/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "available" in data
    assert "engine" in data
    assert "features" in data
    assert len(data["features"]) >= 4


def test_ai_chat_endpoint(client, auth_headers):
    """Kiểm tra endpoint chat AI có lưu lịch sử"""
    resp = client.post(
        "/api/ai/chat",
        json={"message": "Xin chào, hãy giới thiệu các CLB học thuật?", "context": "general"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    assert "session_id" in data


def test_ai_analyze_club_endpoint(client):
    """Kiểm tra phân tích CLB"""
    resp = client.post(
        "/api/ai/analyze-club",
        json={"name": "CLB AI ICTU", "description": "Câu lạc bộ nghiên cứu trí tuệ nhân tạo và khoa học dữ liệu."}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "summary" in data
    assert "tags" in data


def test_ai_sentiment_endpoint(client):
    """Kiểm tra phân tích cảm xúc"""
    resp = client.post(
        "/api/ai/sentiment",
        json={"text": "Sự kiện hôm nay rất tuyệt vời, tôi học được rất nhiều điều bổ ích!"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["sentiment"] in ["positive", "neutral", "negative"]


def test_ai_recommendations_endpoint(client, auth_headers, db_session):
    """Kiểm tra gợi ý CLB và sự kiện"""
    club = Club(
        name="CLB Lập Trình CNTT",
        slug="clb-lap-trinh-cntt",
        category="Học thuật",
        description="Nơi học lập trình và AI",
        ai_tags="Python, AI, Code",
        is_active=True
    )
    db_session.add(club)
    db_session.commit()

    resp = client.get("/api/ai/recommendations", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "clubs" in data
    assert "events" in data
