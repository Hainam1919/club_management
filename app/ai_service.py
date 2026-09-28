"""
Dịch vụ AI tích hợp Hybrid Cognitive Architecture (Local Ollama + Cloud AI)
Hỗ trợ:
- ThoughtEngine: Suy luận đa bước & trích xuất Reasoning Traces
- Multi-Agent Orchestration: Mentor, Strategist, Event Architect, Media Producer
- Agentic Tool Calling & Vector RAG
- Streaming Real-time SSE
"""
import httpx
import json
import re
import os
from typing import Optional, List, Dict, Any, AsyncGenerator
from sqlalchemy.orm import Session

from app.ai.rag_service import rag_service
from app.ai.tools import registry
from app.ai.thought_engine import thought_engine, ThoughtEngine
from app.ai.agents.mentor_agent import mentor_agent
from app.ai.agents.strategist_agent import strategist_agent
from app.ai.agents.event_architect_agent import event_architect_agent
from app.ai.agents.media_agent import media_agent

from dotenv import load_dotenv
load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
FALLBACK_MODEL = os.getenv("OLLAMA_MODEL_FALLBACK", "llama3.2:3b")
# Ollama mặc định chỉ 4096 token -> prompt dài sẽ bị cắt ngang, model "mất thông tin" và trả lời sai
NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "8192"))


def _ollama_options(temperature: float, max_tokens: int) -> Dict[str, Any]:
    return {"temperature": temperature, "num_predict": max_tokens, "num_ctx": NUM_CTX}

# Cloud API Keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


# ============= CORE AI ORCHESTRATOR =============

async def check_ollama() -> bool:
    """Kiểm tra Ollama có đang chạy không"""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return r.status_code == 200
    except Exception:
        return False


async def ai_orchestrator(
    prompt: str,
    provider: str = "ollama",
    model: Optional[str] = None,
    system: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 800
) -> str:
    """
    Hybrid AI Orchestrator - Điều phối giữa các LLM providers.
    """
    # Auto-detect best provider
    if ANTHROPIC_API_KEY and provider == "anthropic":
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                r = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={"x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                    json={
                        "model": model or "claude-3-5-sonnet-20240620",
                        "max_tokens": max_tokens,
                        "system": system or "",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": temperature
                    }
                )
                if r.status_code == 200:
                    return r.json()['content'][0]['text'].strip()
        except Exception as e:
            print(f"[AI Service] Anthropic error: {e}")

    if OPENAI_API_KEY and provider == "openai":
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                r = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                    json={
                        "model": model or "gpt-4o",
                        "messages": [{"role": "system", "content": system or ""}, {"role": "user", "content": prompt}],
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    }
                )
                if r.status_code == 200:
                    return r.json()['choices'][0]['message']['content'].strip()
        except Exception as e:
            print(f"[AI Service] OpenAI error: {e}")

    # Default Ollama
    payload = {
        "model": model or DEFAULT_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": _ollama_options(temperature, max_tokens),
        "keep_alive": os.getenv("OLLAMA_KEEP_ALIVE", "72h")
    }
    if system:
        payload["system"] = system

    models_to_try = list(dict.fromkeys([model or DEFAULT_MODEL, FALLBACK_MODEL]))
    last_error = ""
    for m in models_to_try:
        payload["model"] = m
        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                r = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
                if r.status_code == 200:
                    return r.json().get("response", "").strip()
                if r.status_code == 404:
                    last_error = f"model '{m}' not found"
                    continue
                return ""
        except Exception as e:
            last_error = str(e)
            print(f"[AI Service] Ollama error: {e}")
            continue

    print(f"[AI Service] Ollama failed: {last_error}")
    return ""


async def ai_orchestrator_stream(
    prompt: str,
    provider: str = "ollama",
    model: Optional[str] = None,
    system: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 800
) -> AsyncGenerator[str, None]:
    """
    Hybrid AI Orchestrator (Streaming version)
    """
    payload = {
        "model": model or DEFAULT_MODEL,
        "prompt": prompt,
        "stream": True,
        "options": _ollama_options(temperature, max_tokens),
        "keep_alive": os.getenv("OLLAMA_KEEP_ALIVE", "72h")
    }
    if system:
        payload["system"] = system

    models_to_try = list(dict.fromkeys([model or DEFAULT_MODEL, FALLBACK_MODEL]))
    for m in models_to_try:
        payload["model"] = m
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                async with client.stream("POST", f"{OLLAMA_BASE_URL}/api/generate", json=payload) as r:
                    if r.status_code == 200:
                        async for line in r.aiter_lines():
                            if line:
                                chunk = json.loads(line)
                                token = chunk.get("response", "")
                                if token:
                                    yield token
                                if chunk.get("done"):
                                    return
                        return
                    if r.status_code == 404:
                        continue
        except Exception:
            break

    # Fallback to non-streaming response if stream fails
    fallback_res = await ai_orchestrator(prompt, provider, model, system, temperature, max_tokens)
    if fallback_res:
        yield fallback_res


# ============= AGENTIC REASONING INTERFACES =============

async def ai_agent_chat(
    user_message: str,
    history: Optional[List[Dict]] = None,
    context: str = "general",
    system_override: Optional[str] = None,
    user_profile: Optional[Dict] = None,
    db: Optional[Session] = None
) -> str:
    """
    AI Chat sử dụng Cognitive Thought Engine và tự động gọi công cụ.
    """
    result = await thought_engine.think_and_solve(
        user_message=user_message,
        history=history,
        context=context,
        user_profile=user_profile,
        db=db,
        orchestrator_fn=ai_orchestrator
    )
    return result.get("reply", "")


async def ai_agent_chat_stream(
    user_message: str,
    history: Optional[List[Dict]] = None,
    context: str = "general",
    system_override: Optional[str] = None,
    user_profile: Optional[Dict] = None,
    db: Optional[Session] = None
) -> AsyncGenerator[str, None]:
    """
    Agentic AI Chat Streaming thực sự: token hiện dần theo thời gian thực,
    kèm tiến trình tư duy (Thought Steps) để UI không bị "treo".
    Delegate trực tiếp tới ThoughtEngine.stream_reasoning (Cognitive Streaming Pipeline).
    """
    async for event in thought_engine.stream_reasoning(
        user_message=user_message,
        history=history,
        context=context,
        user_profile=user_profile,
        db=db,
        system_override=system_override,
        orchestrator_stream_fn=ai_orchestrator_stream
    ):
        yield json.dumps(event)


async def get_ai_model_info() -> Dict[str, Any]:
    """
    Lấy thông tin mô hình AI hiệu dụng: Ollama online hay không, model mặc định,
    danh sách model đã tải, engine version.
    """
    available = await check_ollama()
    loaded_models: List[str] = []
    if available:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                if r.status_code == 200:
                    loaded_models = [m.get("name", "") for m in r.json().get("models", [])][:8]
        except Exception:
            pass

    return {
        "available": available,
        "engine": "Cognitive Thought Engine v2.6",
        "provider": "ollama" if available else "expert-rule-fallback",
        "default_model": DEFAULT_MODEL,
        "loaded_models": loaded_models,
        "features": [
            "Streaming Chain-of-Thought Realtime",
            "4-Stage Cognitive Loop + Tool Calling",
            "4 Specialized Agents (Mentor / Strategist / Event / Media)",
            "Predictive Insights & Analytics"
        ]
    }


async def agent_thought_stream(
    agent_kind: str,
    title: str,
    plan_lines: Optional[Dict[str, str]] = None,
    run_agent_fn=None
) -> AsyncGenerator[Dict, None]:
    """
    Streaming wrapper cho 4 AI Pro Agents:
    - Phát các bước suy luận định hướng (thought_step) theo thời gian thực.
    - Chạy agent thật, sau đó emit kết quả JSON dưới sự kiện "result".
    - Kết thúc bằng sự kiện "done".
    """
    plan_lines = plan_lines or {}
    steps = [
        ("stage_1", "🎯 Phân tích yêu cầu & bối cảnh",
         f"Nhận diện chủ đề '{title}' và thông tin đầu vào để lập kế hoạch."),
        ("stage_2", "🔍 Lập bản đồ dữ liệu & công cụ",
         plan_lines.get("retrieve", "Đối chiếu dữ liệu hệ thống CLB, thành viên và lịch sử hoạt động.")),
        ("stage_3", "⚖️ Gợi ý chiến lược & kiểm tra rủi ro",
         plan_lines.get("critique", "Đánh giá phương án khả thi, rủi ro và chọn hướng tối ưu.")),
        ("stage_4", "🚀 Tạo kết quả hoàn chỉnh",
         plan_lines.get("synthesize", "Đúc kết thành kế hoạch có cấu trúc, sẵn sàng sử dụng.")),
    ]

    for step_name, step_title, content in steps:
        yield {
            "type": "thought_step", "status": "running",
            "step_name": step_name, "title": step_title, "content": content
        }

    try:
        result = await run_agent_fn() if run_agent_fn else {}
        yield {"type": "result", "agent": agent_kind, "content": result}
    except Exception as e:
        yield {"type": "error", "content": f"Lỗi {agent_kind}: {str(e)}"}
    finally:
        yield {"type": "done", "agent": agent_kind}


# ============= DOMAIN SPECIFIC AI CAPABILITIES =============

async def ai_generate(
    prompt: str,
    model: str = DEFAULT_MODEL,
    system: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 800
) -> str:
    return await ai_orchestrator(prompt, provider="ollama", model=model, system=system, temperature=temperature, max_tokens=max_tokens)


async def ai_summarize_club(name: str, description: str) -> Dict[str, Any]:
    prompt = f"""Hãy phân tích sâu câu lạc bộ sau:
Tên CLB: {name}
Mô tả: {description}

Yêu cầu:
1. Tạo tóm tắt ngắn gọn, thu hút (2-3 câu).
2. Gợi ý 5 tags phân loại.
3. Xác định danh mục chính (Học thuật, Thể thao, Văn nghệ, Tình nguyện, Kỹ năng, Truyền thông).

Trả về JSON: {{"summary": "...", "tags": ["tag1", "tag2"], "category": "..."}}
"""
    result = await ai_orchestrator(prompt, system="Chỉ trả về JSON thuần túy.", temperature=0.4)
    try:
        match = re.search(r'\{[\s\S]*\}', result)
        if match:
            return json.loads(match.group(0))
    except Exception:
        pass

    return {
        "summary": f"{name} là câu lạc bộ năng động tại ICTU, tạo môi trường học tập và rèn luyện kỹ năng toàn diện cho sinh viên.",
        "tags": ["sinh viên", "ictu", "hoạt động", "phát triển"],
        "category": "Kỹ năng"
    }


async def ai_analyze_sentiment(text: str) -> str:
    prompt = f"Phân tích cảm xúc: '{text}'. Trả về đúng 1 từ: positive / neutral / negative."
    result = await ai_orchestrator(prompt, temperature=0.1, max_tokens=10)
    lowered = result.lower()
    if "positive" in lowered or "tích cực" in lowered:
        return "positive"
    if "negative" in lowered or "tiêu cực" in lowered:
        return "negative"
    return "neutral"


async def ai_predict_event_success(title: str, description: str, location: str, max_participants: int, duration_hours: float) -> float:
    prompt = f"""Đánh giá khả năng thành công của sự kiện:
- Tiêu đề: {title}
- Mô tả: {description}
- Địa điểm: {location}
- Số lượng: {max_participants}
- Thời lượng: {duration_hours} giờ

Dự đoán tỷ lệ % thành công (từ 0 đến 100). Chỉ trả về duy nhất con số."""
    result = await ai_orchestrator(prompt, temperature=0.2, max_tokens=10)
    match = re.search(r'\d+(\.\d+)?', result)
    return float(match.group(0)) if match else 85.0


async def ai_recommend_for_user(user_interests: str, clubs_data: List[Dict]) -> List[Dict]:
    clubs_text = "\n".join([f"{idx+1}. {c['name']} ({c['category']}): {c['description'][:100]}" for idx, c in enumerate(clubs_data[:10])])
    prompt = f"""Sở thích sinh viên: {user_interests}

Danh sách CLB:
{clubs_text}

Chọn TOP 3 CLB phù hợp nhất. Trả về JSON:
{{"recommendations": [{{"index": 1, "reason": "...", "score": 0.95}}]}}"""

    result = await ai_orchestrator(prompt, temperature=0.5, max_tokens=400)
    try:
        match = re.search(r'\{[\s\S]*\}', result)
        if match:
            data = json.loads(match.group(0))
            recs = []
            for r in data.get("recommendations", []):
                idx = r.get("index", 1) - 1
                if 0 <= idx < len(clubs_data):
                    recs.append({
                        "club": clubs_data[idx],
                        "reason": r.get("reason", "Phù hợp với định hướng"),
                        "score": r.get("score", 0.9)
                    })
            if recs:
                return recs
    except Exception:
        pass

    return [
        {"club": clubs_data[0], "reason": "CLB hoạt động tích cực, phù hợp với mọi sinh viên", "score": 0.95}
    ] if clubs_data else []


async def ai_extract_keywords(text: str) -> str:
    prompt = f"Trích xuất 5 từ khóa quan trọng nhất từ văn bản sau (phân cách bằng dấu phẩy):\n{text[:400]}"
    result = await ai_orchestrator(prompt, temperature=0.3, max_tokens=60)
    return result.strip() if result else "sinh viên, clb, hoạt động"


async def ai_predict_club_growth(club_data: Dict, history: Optional[List[Dict]] = None) -> Dict[str, Any]:
    prompt = f"""Dự đoán xu hướng tăng trưởng của CLB {club_data.get('name')}:
Dữ liệu: {json.dumps(club_data, ensure_ascii=False)}

Trả về JSON:
{{"trend": "Tăng trưởng mạnh", "predicted_members": 150, "health_score": 88, "recommendations": ["..."]}}"""

    result = await ai_orchestrator(prompt, temperature=0.4, max_tokens=400)
    try:
        match = re.search(r'\{[\s\S]*\}', result)
        if match:
            return json.loads(match.group(0))
    except Exception:
        pass

    return {
        "trend": "Tăng trưởng ổn định",
        "predicted_members": club_data.get("member_count", 50) + 15,
        "health_score": 85,
        "recommendations": [
            "Đẩy mạnh truyền thông trên mạng xã hội trước mùa tuyển quân",
            "Tổ chức thêm các workshop trải nghiệm cho tân sinh viên"
        ]
    }


async def ai_smart_matching(user_profile: Dict, candidates: List[Dict]) -> List[Dict]:
    prompt = f"""Ghép đôi sinh viên cùng sở thích/khoa để cùng tham gia CLB:
Hồ sơ sinh viên: {json.dumps(user_profile, ensure_ascii=False)}
Danh sách ứng viên: {json.dumps(candidates[:8], ensure_ascii=False)}

Trả về JSON:
{{"matches": [{{"id": 1, "match_score": 90, "common_interests": ["..."]}}]}}"""

    result = await ai_orchestrator(prompt, temperature=0.5, max_tokens=400)
    try:
        match = re.search(r'\{[\s\S]*\}', result)
        if match:
            return json.loads(match.group(0)).get("matches", [])
    except Exception:
        pass

    return []


async def ai_generate_club_report(club_data: Dict, events: List[Dict], posts: List[Dict]) -> str:
    prompt = f"""Viết báo cáo tổng kết hoạt động chuyên nghiệp cho CLB {club_data.get('name')}:
- Quy mô: {club_data.get('member_count')} thành viên
- Sự kiện ({len(events)}): {json.dumps(events[:5], ensure_ascii=False)}
- Bài viết ({len(posts)}): {json.dumps(posts[:5], ensure_ascii=False)}

Cấu trúc:
1. Đánh giá tổng quan & Thành tựu nổi bật
2. Hoạt động sự kiện & Mức độ tương tác
3. Tồn tại, Hạn chế
4. Phương hướng & Kế hoạch học kỳ tới"""

    result = await ai_orchestrator(prompt, temperature=0.5, max_tokens=900)
    return result if result else f"Báo cáo tổng kết hoạt động CLB {club_data.get('name')} hoàn thành xuất sắc các mục tiêu đề ra."


async def ai_generate_post_content(title: str, topic: str, club_name: Optional[str] = None) -> str:
    """Sinh nội dung bài viết tự động"""
    prompt = f"""Viết nội dung bài viết thu hút cho bài đăng CLB:
Tiêu đề: {title}
Chủ đề: {topic}
{f"CLB: {club_name}" if club_name else ""}

Yêu cầu:
1. Nội dung ngắn gọn, hấp dẫn (100-150 từ)
2. Có call-to-action rõ ràng
3. Phong cách trẻ trung, gần gũi sinh viên
4. Có emoji trang trí"""

    result = await ai_orchestrator(prompt, temperature=0.7, max_tokens=300)
    return result.strip() if result else f"Hãy tham gia {club_name or 'CLB'} để cùng phát triển bản thân! {title}"


# Legacy wrapper
async def ai_chat_assistant(user_message: str, history: Optional[List[Dict]] = None, context: str = "general", system_override: Optional[str] = None) -> str:
    return await ai_agent_chat(user_message, history, context, system_override)
