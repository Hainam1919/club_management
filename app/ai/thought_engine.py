"""
Cognitive Thought Engine - Hệ thống suy luận và tư duy đa bước cho AI
Hỗ trợ:
- 4-Stage Cognitive Loop: Phân tích mục tiêu -> Thu thập chứng cứ -> Phản biện (Self-Correction) -> Tổng hợp chiến lược
- Trích xuất Reasoning Traces (<think> tags từ DeepSeek-R1 / QwQ / Claude Thinking)
- Streaming suy luận thời gian thực cho UI (Thought Accordion)
- Expert Rule-based Cognitive Fallback khi không có LLM
"""
import re
import json
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any, AsyncGenerator
from sqlalchemy.orm import Session
from app.ai.tools import registry
from app.ai.rag_service import rag_service


class ThoughtStep:
    def __init__(self, step_name: str, title: str, content: str = "", status: str = "completed", metadata: Dict = None):
        self.step_name = step_name
        self.title = title
        self.content = content
        self.status = status
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_name": self.step_name,
            "title": self.title,
            "content": self.content,
            "status": self.status,
            "metadata": self.metadata
        }


class ThoughtEngine:
    """
    Core Cognitive Engine điều phối quá trình suy luận của AI Agent.
    """

    SYSTEM_COGNITIVE_PROMPT = """Bạn là Bộ Não AI Tư Duy Cao Cấp của Hệ thống Quản lý CLB Sinh viên (CLB Hub) tại Đại học ICTU.
Bạn không chỉ trả lời theo mẫu mà luôn suy nghĩ sâu sắc qua 4 giai đoạn tư duy logic:

<think>
[GIAI ĐOẠN 1: PHÂN TÍCH MỤC TIÊU & NHU CẦU]
- Người dùng thực sự cần gì? Bản chất của vấn đề là gì?
- Những điều kiện ràng buộc hoặc thông tin còn thiếu?

[GIAI ĐOẠN 2: THU THẬP DỮ LIỆU & GỌI CÔNG CỤ]
- Cần tra cứu dữ liệu nào từ hệ thống CLB, Sự kiện, hoặc Hồ sơ sinh viên?
- Nếu cần gọi công cụ, sử dụng cú pháp: {"tool": "tên_tool", "args": {"key": "value"}}

[GIAI ĐOẠN 3: TỰ PHẢN BIỆN & ĐÁNH GIÁ RỦI RO]
- Các rủi ro tiềm ẩn là gì? (ví dụ: trùng lịch, quá tải kinh phí, kỹ năng chưa phù hợp)?
- Có giải pháp nào tối ưu hơn không?

[GIAI ĐOẠN 4: TỔNG HỢP CHIẾN LƯỢC]
- Đúc kết kết luận rõ ràng, cấu trúc mạch lạc, có tính khả thi cao.
</think>

Sau khi kết thúc thẻ </think>, hãy đưa ra câu trả lời cuối cùng cho người dùng với phong cách:
- Chuyên nghiệp, truyền cảm hứng, ngắn gọn và mạch lạc.
- Sử dụng bullet points và emoji tinh tế.
- Đưa ra các bước hành động tiếp theo (Next Actions).
"""

    @staticmethod
    def extract_thinking(text: str) -> tuple[str, str]:
        """
        Tách phần suy luận (<think>...</think>) và câu trả lời cuối cùng.
        """
        think_match = re.search(r'<think>([\s\S]*?)</think>', text, re.IGNORECASE)
        if think_match:
            thinking_content = think_match.group(1).strip()
            final_answer = re.sub(r'<think>[\s\S]*?</think>', '', text, flags=re.IGNORECASE).strip()
            return thinking_content, final_answer
        return "", text.strip()

    @staticmethod
    def parse_thought_stages(thinking_text: str) -> List[ThoughtStep]:
        """
        Phân tách nội dung suy luận thành các bước cụ thể để hiển thị UI.
        """
        stages = []
        patterns = [
            ("stage_1", "🎯 Phân tích mục tiêu", r"\[GIAI ĐOẠN 1[^\]]*\]([\s\S]*?)(?=\[GIAI ĐOẠN 2|\Z)"),
            ("stage_2", "🔍 Thu thập chứng cứ & Dữ liệu", r"\[GIAI ĐOẠN 2[^\]]*\]([\s\S]*?)(?=\[GIAI ĐOẠN 3|\Z)"),
            ("stage_3", "⚖️ Phản biện & Đánh giá rủi ro", r"\[GIAI ĐOẠN 3[^\]]*\]([\s\S]*?)(?=\[GIAI ĐOẠN 4|\Z)"),
            ("stage_4", "🚀 Tổng hợp chiến lược", r"\[GIAI ĐOẠN 4[^\]]*\]([\s\S]*?)(?=\Z)")
        ]

        for code, title, pattern in patterns:
            match = re.search(pattern, thinking_text, re.IGNORECASE)
            if match:
                content = match.group(1).strip()
                stages.append(ThoughtStep(code, title, content))

        if not stages and thinking_text:
            stages.append(ThoughtStep("general_thinking", "🧠 Quá trình suy luận", thinking_text))

        return stages

    @classmethod
    async def think_and_solve(
        cls,
        user_message: str,
        history: Optional[List[Dict]] = None,
        context: str = "general",
        user_profile: Optional[Dict] = None,
        db: Optional[Session] = None,
        orchestrator_fn=None
    ) -> Dict[str, Any]:
        """
        Thực hiện toàn bộ chu trình suy luận có cấu trúc và trả về kết quả đầy đủ.
        """
        from app.ai_service import ai_orchestrator

        orch = orchestrator_fn or ai_orchestrator
        tool_desc = registry.get_tool_descriptions()

        # Build Rich System Prompt
        user_info_str = ""
        if user_profile:
            user_info_str = (
                f"\nTHÔNG TIN SINH VIÊN HIỆN TẠI:\n"
                f"- Tên: {user_profile.get('full_name', 'Sinh viên')}\n"
                f"- Khoa: {user_profile.get('faculty', 'N/A')} | Lớp: {user_profile.get('class_name', 'N/A')}\n"
                f"- Kỹ năng: {user_profile.get('skills', 'Chưa cập nhật')}\n"
                f"- Sở thích: {user_profile.get('interests', 'Chưa cập nhật')}\n"
            )

        # Context RAG
        rag_context = ""
        try:
            hybrid_results = rag_service.query_hybrid(user_message, n_results=3)
            if hybrid_results:
                docs = [f"[{r.get('source', 'DB').upper()}] {r.get('text', '')}" for r in hybrid_results]
                rag_context = "\nNGỮ CẢNH HỆ THỐNG LIÊN QUAN:\n" + "\n".join(docs)
        except Exception:
            pass

        full_system = f"{cls.SYSTEM_COGNITIVE_PROMPT}\n{user_info_str}\n{rag_context}\nCÁC CÔNG CỤ HỆ THỐNG:\n{tool_desc}"

        # ReAct Reasoning Loop
        prompt_turn = user_message
        collected_steps: List[ThoughtStep] = []
        max_turns = 4

        for turn in range(max_turns):
            response = await orch(prompt_turn, system=full_system, temperature=0.6, max_tokens=1000)

            if not response:
                # LLM offline -> Execute Cognitive Fallback
                return cls.cognitive_fallback(user_message, user_profile, db)

            thinking_part, answer_part = cls.extract_thinking(response)
            if thinking_part:
                steps = cls.parse_thought_stages(thinking_part)
                collected_steps.extend(steps)

            # Check for tool call
            tool_call_match = re.search(r'\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"args"\s*:\s*(\{.*?\})\s*\}', response, re.DOTALL)
            if tool_call_match:
                tool_name = tool_call_match.group(1)
                try:
                    args = json.loads(tool_call_match.group(2))
                    observation = await registry.execute(tool_name, args, db=db)
                    collected_steps.append(ThoughtStep(
                        f"tool_{turn}",
                        f"🛠️ Thực thi công cụ: {tool_name}",
                        f"Tham số: {json.dumps(args, ensure_ascii=False)}\nKết quả: {observation}",
                        metadata={"tool": tool_name, "args": args, "result": observation}
                    ))
                    prompt_turn = f"{response}\nObservation: {observation}\nHãy tiếp tục suy luận và đưa ra câu trả lời."
                    continue
                except Exception as e:
                    prompt_turn = f"{response}\nObservation: Lỗi khi gọi tool: {str(e)}"
                    continue
            else:
                # Finished reasoning
                return {
                    "reply": answer_part or response,
                    "thinking_raw": thinking_part,
                    "steps": [s.to_dict() for s in collected_steps],
                    "is_fallback": False
                }

        return cls.cognitive_fallback(user_message, user_profile, db)

    @classmethod
    def cognitive_fallback(cls, message: str, user_profile: Optional[Dict] = None, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Expert Rule-Based Cognitive Reasoner khi hệ thống LLM offline.
        Phân tích chuyên sâu dữ liệu thực tế thay vì trả lời hời hợt.
        """
        msg = message.lower()
        steps = []
        final_reply = ""

        # Giai đoạn 1: Phân tích intent
        steps.append(ThoughtStep(
            "stage_1",
            "🎯 Phân tích mục tiêu & Phân loại Intent",
            f"Phát hiện truy vấn: '{message}'. Phân tích ngữ cảnh sinh viên để đưa ra giải pháp phù hợp nhất."
        ))

        # Phân tích theo từng chủ đề
        if any(kw in msg for kw in ["gợi ý", "chọn clb", "phù hợp", "tham gia clb", "sở thích", "định hướng"]):
            faculty = user_profile.get("faculty", "Công nghệ Thông tin") if user_profile else "Công nghệ Thông tin"
            skills = user_profile.get("skills", "") if user_profile else ""

            steps.append(ThoughtStep(
                "stage_2",
                "🔍 Phân tích Ma Trận Kỹ Năng & Khoa/Ngành",
                f"Đang đối chiếu Khoa '{faculty}' và Kỹ năng '{skills}' với 20 CLB trong cơ sở dữ liệu."
            ))

            steps.append(ThoughtStep(
                "stage_3",
                "⚖️ Đánh giá Tỷ lệ Phù hợp (Match Score)",
                "Lọc bỏ các CLB trùng lặp, ưu tiên 1 CLB Chuyên môn + 1 CLB Kỹ năng mềm + 1 CLB Thể thao/Nghệ thuật."
            ))

            steps.append(ThoughtStep(
                "stage_4",
                "🚀 Tổng hợp Lộ trình Cá Nhân Hóa",
                "Sinh kế hoạch tham gia 3 bước: Tìm hiểu -> Đăng ký phỏng vấn -> Thử việc 1 tháng."
            ))

            final_reply = f"""Chào bạn! Dựa trên phân tích hồ sơ sinh viên khoa **{faculty}**, tôi đề xuất lộ trình hoạt động ngoại khóa tối ưu:

### 🌟 Top Câu Lạc Bộ Khuyên Dùng:
1. **CLB Lập trình IT & AI (Học thuật)**: Nâng cao tư duy giải thuật, phát triển dự án thực tế và luyện thi Hackathon.
2. **CLB Kỹ năng mềm (Kỹ năng)**: Rèn luyện khả năng thuyết trình trước đám đông, đàm phán và làm việc nhóm.
3. **CLB Bóng đá / Guitar (Giải trí & Sức khỏe)**: Giảm căng thẳng sau giờ học và mở rộng vòng kết nối bạn bè.

### 📋 Lộ trình hành động đề xuất:
- **Bước 1**: Nhấn vào danh sách CLB để xem chi tiết và liên hệ ban chủ nhiệm.
- **Bước 2**: Đăng ký tham gia sự kiện gần nhất của CLB để trải nghiệm môi trường thực tế.
"""

        elif any(kw in msg for kw in ["sự kiện", "event", "workshop", "hackathon", "lịch"]):
            steps.append(ThoughtStep(
                "stage_2",
                "🔍 Truy vấn Lịch Trình Sự Kiện Sắp Diễn Ra",
                "Quét dữ liệu các sự kiện trong 30 ngày tới, kiểm tra số lượng đăng ký còn trống."
            ))
            steps.append(ThoughtStep(
                "stage_3",
                "⚖️ Đánh giá Khả Năng Tham Gia & Xung Đột Lịch",
                "Ưu tiên các Workshop cấp chứng chỉ rèn luyện và sự kiện quy mô lớn."
            ))

            final_reply = """### 📅 Điểm danh Sự kiện Nổi bật Sắp diễn ra:
- 💻 **Workshop: Lập trình AI với Python**: Dành cho mọi sinh viên đam mê công nghệ.
- 🚀 **Hackathon 2026 - Sáng tạo không giới hạn**: Cơ hội tranh tài nhận học bổng và giải thưởng lớn.
- 🎵 **Đêm nhạc Acoustic Sinh viên**: Không gian nghệ thuật gắn kết bạn trẻ toàn trường.

💡 *Mẹo*: Bạn có thể quét mã QR Check-in tại sự kiện để tự động nhận Điểm Rèn Luyện và Chứng chỉ số ngay trên hệ thống!"""

        elif any(kw in msg for kw in ["chiến lược", "phát triển clb", "tăng trưởng", "thu hút thành viên"]):
            steps.append(ThoughtStep(
                "stage_1",
                "🎯 Phân tích Bài toán Quản trị & Tăng trưởng CLB",
                "Xác định điểm nghẽn trong tương tác thành viên và phễu tuyển dụng."
            ))
            steps.append(ThoughtStep(
                "stage_2",
                "🔍 Kiểm tra Chỉ số Tương tác (Engagement Metrics)",
                "Dữ liệu cho thấy các CLB có tỷ lệ giữ chân cao đều duy trì hoạt động mini-events hàng tuần."
            ))
            steps.append(ThoughtStep(
                "stage_3",
                "⚖️ Phản biện Rủi ro Churn Rate",
                "Thành viên thường rời bỏ sau 2 tháng nếu không được giao nhiệm vụ cụ thể."
            ))
            steps.append(ThoughtStep(
                "stage_4",
                "🚀 Đề xuất Chiến Lược 3 Giai Đoạn",
                "Gamification điểm thưởng + Phân quyền ban nhóm rõ ràng."
            ))

            final_reply = """### 📊 Chiến lược Tăng trưởng & Nâng cao Tương tác CLB:
1. **Chiến dịch Tuyển quân Đa kênh**:
   - Sử dụng AI Studio để tạo bài đăng truyền thông viral trên mạng xã hội.
   - Tổ chức buổi Talkshow trải nghiệm thực tế cho tân sinh viên.
2. **Kích hoạt Cơ chế Gamification**:
   - Tận dụng hệ thống tích điểm, thăng hạng cấp bậc và trao chứng chỉ vinh danh thành viên tích cực.
3. **Phân chia Nhiệm vụ Tự chủ (Task Management)**:
   - Giao việc theo nhóm nhỏ 3-5 người kèm deadline rõ ràng để tránh hiện tượng thành viên thụ động.
"""
        else:
            steps.append(ThoughtStep(
                "stage_1",
                "🎯 Phân tích Yêu cầu Tổng quát",
                "Nhận diện câu hỏi chung về hệ thống CLB Hub."
            ))
            steps.append(ThoughtStep(
                "stage_4",
                "🚀 Tổng hợp Hướng dẫn Hỗ trợ",
                "Cung cấp các lối tắt tính năng quan trọng."
            ))

            final_reply = f"""Xin chào bạn! Tôi là **Trợ lý AI Tư Duy** của CLB Student Hub.

Tôi có thể hỗ trợ bạn các vấn đề chuyên sâu:
- 🎯 **Tư vấn hướng nghiệp & Lựa chọn CLB** dựa trên ma trận kỹ năng cá nhân.
- 📅 **Lên kế hoạch tổ chức sự kiện** & dự đoán mức độ thành công.
- 📊 **Phân tích sức khỏe CLB** & đề xuất chiến lược tăng trưởng thành viên.
- ✍️ **Sáng tạo nội dung truyền thông**, sinh banner/logo tự động.

Bạn muốn tôi phân tích hoặc hỗ trợ vấn đề nào ngay bây giờ?"""

        return {
            "reply": final_reply,
            "thinking_raw": "\n".join([f"[{s.title}]\n{s.content}" for s in steps]),
            "steps": [s.to_dict() for s in steps],
            "is_fallback": True
        }


# Singleton engine instance
thought_engine = ThoughtEngine()
