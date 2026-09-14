"""
Test suite cho AI Cognitive Thought Engine
Kiểm thử trích xuất <think>, 4-Stage Reasoning Pipeline, Tool Calling và Local Fallback.
"""
import pytest
from app.ai.thought_engine import thought_engine, ThoughtStep
from app.ai.tools import registry
from app.models import User, Club, Event
from app.security import hash_password


def test_extract_thinking_with_tags():
    """Kiểm tra trích xuất suy luận từ cặp thẻ <think>...</think>"""
    raw_response = "<think>Phân tích dữ liệu: Người dùng quan tâm đến lập trình Python.</think>Xin chào! Tôi có thể gợi ý CLB Lập trình IT cho bạn."
    thinking, clean_text = thought_engine.extract_thinking(raw_response)

    assert "Phân tích dữ liệu" in thinking
    assert "<think>" not in clean_text
    assert "Xin chào! Tôi có thể gợi ý CLB Lập trình IT" in clean_text


def test_extract_thinking_without_tags():
    """Trường hợp model không trả về thẻ <think>"""
    raw_response = "Xin chào bạn, tôi là trợ lý AI."
    thinking, clean_text = thought_engine.extract_thinking(raw_response)

    assert thinking == ""
    assert clean_text == raw_response


def test_tool_registry_has_tools():
    """Kiểm tra danh sách công cụ được đăng ký"""
    descriptions = registry.get_tool_descriptions()
    assert len(descriptions) > 0
    assert "search_clubs" in descriptions
    assert "get_upcoming_events" in descriptions


@pytest.mark.asyncio
async def test_tool_execution(db_session):
    """Kiểm tra thực thi tool trên Database"""
    # Tạo club mẫu
    club = Club(
        name="CLB Test AI",
        slug="clb-test-ai",
        category="Học thuật",
        description="CLB nghiên cứu AI và Machine Learning",
        ai_tags="AI, Python, ML",
        member_count=50,
        is_active=True
    )
    db_session.add(club)
    db_session.commit()

    # Chạy tool search_clubs
    result = await registry.execute("search_clubs", {"query": "AI", "limit": 5}, db=db_session)
    assert isinstance(result, str)
    assert len(result) > 0


def test_cognitive_fallback(db_session):
    """Kiểm tra quy trình suy luận fallback của Thought Engine"""
    # Chuẩn bị dữ liệu mẫu
    club = Club(
        name="CLB Lập trình ICTU",
        slug="clb-lap-trinh-ictu",
        category="Học thuật",
        description="Nơi chia sẻ kiến thức CNTT",
        member_count=120,
        is_active=True
    )
    db_session.add(club)
    db_session.commit()

    result = thought_engine.cognitive_fallback(
        message="Làm thế nào để phát triển kỹ năng AI và tham gia CLB phù hợp?",
        user_profile={"skills": "Python, Math", "interests": "Machine Learning", "faculty": "CNTT"},
        db=db_session
    )

    assert "reply" in result
    assert len(result["reply"]) > 0
    assert "is_fallback" in result
    assert result["is_fallback"] == True
    assert "steps" in result


def test_parse_thought_stages():
    """Kiểm tra phân tích các bước suy luận"""
    thinking_text = """
    1. Deconstruct & Understand: Phân tích yêu cầu của sinh viên
    2. Evidence & Tool Retrieval: Tìm kiếm CLB phù hợp
    3. Critical Reflection: Đánh giá độ tương thích
    4. Strategic Synthesis: Đưa ra khuyến nghị
    """
    stages = thought_engine.parse_thought_stages(thinking_text)
    assert len(stages) > 0
    assert all(isinstance(stage, ThoughtStep) for stage in stages)

