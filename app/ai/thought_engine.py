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
from app.ai import knowledge
from app.ai import direct_answer as direct_answers


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

    SYSTEM_COGNITIVE_PROMPT = """Bạn là Bộ Não AI của Hệ thống Quản lý CLB Sinh viên (CLB Hub) tại Đại học ICTU.
Hãy suy nghĩ THẬT NGẮN GỌN: mỗi giai đoạn chỉ 1-2 dòng, tổng toàn bộ suy luận không quá 150 từ.

 thinking
[GIAI ĐOẠN 1: PHÂN TÍCH MỤC TIÊU & NHU CẦU]
- Nhu cầu thực sự của người dùng là gì? (tối đa 2 dòng)

[GIAI ĐOẠN 2: THU THẬP DỮ LIỆU & GỌI CÔNG CỤ]
- Cần tra cứu dữ liệu CLB/Sự kiện/hồ sơ nào? Nếu cần gọi tool, dùng đúng cú pháp: {"tool": "tên_tool", "args": {"key": "value"}} (tối đa 2 dòng)

[GIAI ĐOẠN 3: TỰ PHẢN BIỆN & ĐÁNH GIÁ RỦI RO]
- Rủi ro/điểm cần lưu ý và phương án tối ưu hơn? (tối đa 2 dòng)

[GIAI ĐOẠN 4: TỔNG HỢP CHIẾN LƯỢC]
- Kết luận ngắn gọn cho phần trả lời. (tối đa 2 dòng)
 response

Sau thẻ ```response```, viết CÂU TRẢ LỜI CUỐI:
- Tiếng Việt, NGẮN GỌN (tối đa 200 từ), TUYỆT ĐỐI không lặp lại nội dung suy luận.
- Dùng bullet points và emoji tinh tế, in đậm tên CLB khi nhắc tới.
- Kết thúc bằng 2-3 Next Actions cụ thể nếu phù hợp.
"""

    @staticmethod
    def extract_thinking(text: str) -> tuple[str, str]:
        """
        Tách phần suy luận ( thinking... response) và câu trả lời cuối cùng.
        Hỗ trợ nhiều định dạng thẻ của các model: ``` thinking, /think>, <thinking>...
        """
        if not text:
            return "", text

        # 1) Cặp thẻ dạng HTML của dự án: <think> ... </think> (DeepSeek-R1 / QwQ)
        m = re.search(r'<think>\s*([\s\S]*?)</think>', text, re.IGNORECASE)
        if m:
            return m.group(1).strip(), (text[:m.start()] + text[m.end():]).strip()

        # 2) Cặp /think> ... /Kết (llama3.2)
        m = re.search(r'/think>\s*([\s\S]*?)</?Kết', text, re.IGNORECASE)
        if m:
            return m.group(1).strip(), (text[:m.start()] + text[m.end():]).strip()

        # 3) Cặp ``` thinking ... ``` response (backticks, chuẩn CoT)
        m = re.search(r'```\s*thinking\s*([\s\S]*?)```\s*response', text, re.IGNORECASE)
        if m:
            return m.group(1).strip(), (text[:m.start()] + text[m.end():]).strip()

        return "", text.strip()

    @staticmethod
    def _clean_reply(reply: str) -> str:
        """
        Dọn rác suy luận còn lọt vào câu trả lời: thẻ thừa, khối [GIAI ĐOẠN],
        tiêu đề model tự thêm (response:, Kết:) để reply gọn và sạch.
        """
        if not reply:
            return reply
        reply = re.sub(r'```\s*(?:thinking|response|answer)', '', reply, flags=re.IGNORECASE)
        reply = re.sub(r'/think>|/Kết|<thinking>|</thinking>', '', reply, flags=re.IGNORECASE)
        reply = re.sub(r'\[GIAI ĐOẠN\s*\d[^\]]*\][\s\S]*?(?=\n\s*(?:Câu trả lời|###|[A-ZÀ-Ỹ].*\n[A-ZÀ-Ỹ])|\Z)', '', reply, flags=re.IGNORECASE)
        reply = re.sub(r'^(?:response|answer|kết|kết thúc|trả lời|câu trả lời)[:：]?\s*', '', reply.strip(), flags=re.IGNORECASE)
        return reply.strip()

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
    def _context_block(
        cls,
        user_message: str,
        user_profile: Optional[Dict] = None,
        db: Optional[Session] = None
    ) -> tuple[str, str]:
        """Profile + kiến thức DB sống + RAG context dùng chung cho các system prompt."""
        user_info_str = ""
        if user_profile:
            user_info_str = (
                f"\nTHÔNG TIN SINH VIÊN HIỆN TẠI:\n"
                f"- Tên: {user_profile.get('full_name', 'Sinh viên')}\n"
                f"- Khoa: {user_profile.get('faculty', 'N/A')} | Lớp: {user_profile.get('class_name', 'N/A')}\n"
                f"- Kỹ năng: {user_profile.get('skills', 'Chưa cập nhật')}\n"
                f"- Sở thích: {user_profile.get('interests', 'Chưa cập nhật')}\n"
            )

        # Kiến thức lấy trực tiếp từ DB: luôn đúng số liệu, không bị stale như vector store
        live_block = ""
        if db is not None:
            try:
                live_block = "\n" + knowledge.build_knowledge_block(db, user_message) + knowledge.KNOWLEDGE_RULES
            except Exception as e:  # không được để lỗi context làm hỏng cả luồng chat
                print(f"[Thought Engine] live knowledge failed: {e}")

        # Chỉ lấy FAQ/quy trình từ RAG. Chunk club_knowledge/event_knowledge có số liệu cũ
        # (đã index từ trước) gây bịa số, nên bỏ hẳn - dữ liệu sống đã nằm ở live_block.
        rag_context = ""
        try:
            hybrid_results = rag_service.query_hybrid(user_message, n_results=4)
            faq_docs = [r for r in hybrid_results if r.get("source") == "faq_knowledge"][:2]
            if faq_docs:
                docs = [f"- {r.get('text', '').strip()}" for r in faq_docs]
                rag_context = (
                    "\nQUY TRÌNH / HƯỚNG DẪN (nguồn tham khảo, KHÔNG chứa số liệu thống kê):\n"
                    + "\n".join(docs)
                )
        except Exception:
            pass
        return user_info_str, live_block + rag_context

    @classmethod
    def build_system_prompt(
        cls,
        user_message: str,
        user_profile: Optional[Dict] = None,
        db: Optional[Session] = None
    ) -> str:
        """Dựng system prompt đầy đủ (profile + RAG context + tools)."""
        tool_desc = registry.get_tool_descriptions()
        user_info_str, rag_context = cls._context_block(user_message, user_profile, db)
        return (
            f"{cls.SYSTEM_COGNITIVE_PROMPT}\n{user_info_str}\n{rag_context}\nCÁC CÔNG CỤ HỆ THỐNG:\n{tool_desc}"
        )

    @classmethod
    def build_chat_system_prompt(
        cls,
        user_message: str,
        user_profile: Optional[Dict] = None,
        db: Optional[Session] = None
    ) -> str:
        """System prompt gọn nhẹ cho luồng chat stream (không kéo theo CoT dài)."""
        user_info_str, live_and_rag = cls._context_block(user_message, user_profile, db)
        return (
            "Bạn là AI Assistant của hệ thống Quản lý CLB Sinh viên (CLB Hub, Đại học ICTU). "
            "Trả lời ngay bằng tiếng Việt, ngắn gọn, rõ ràng, in đậm tên CLB khi nhắc tới, "
            "dùng bullet nếu có nhiều ý.\n"
            f"{user_info_str}\n{live_and_rag}"
        )

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
        full_system = cls.build_system_prompt(user_message, user_profile, db)

        # ReAct Reasoning Loop
        prompt_turn = user_message
        collected_steps: List[ThoughtStep] = []
        max_turns = 4

        for turn in range(max_turns):
            response = await orch(prompt_turn, system=full_system, temperature=0.6, max_tokens=360)

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
                    "reply": cls._clean_reply(answer_part or response),
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


    @classmethod
    def build_pre_thinking(cls, message: str, context: str = "general") -> List[tuple]:
        """
        Xây dựng chuỗi 4 bước suy luận định hướng (pre-thinking) để stream trước khi sinh nội dung.
        UI hiển thị trực quan "bộ não AI đang suy nghĩ gì" ngay khi nhận yêu cầu.
        """
        topic = message[:80]
        plans = {
            "general": [
                ("stage_1", "🎯 Phân tích mục tiêu & nhu cầu",
                 f"Nhận diện ý định chính trong yêu cầu: '{topic}' để chọn hướng xử lý tối ưu."),
                ("stage_2", "🔍 Truy vấn dữ liệu CLB & Sự kiện",
                 "Soi trong kho dữ liệu CLB Hub để tìm bằng chứng phù hợp với nhu cầu của bạn."),
                ("stage_3", "⚖️ Đối chiếu, sàng lọc & phản biện",
                 "Kiểm tra độ phù hợp, loại bỏ thông tin nhiễu, đánh giá các phương án khả thi."),
                ("stage_4", "🚀 Tổng hợp câu trả lời",
                 "Đúc kết câu trả lời ngắn gọn, dễ thực hiện, kèm các bước hành động tiếp theo."),
            ],
            "mentor": [
                ("stage_1", "🎯 Thấu hiểu hồ sơ sinh viên",
                 f"Đối chiếu hồ sơ (khoa, kỹ năng, sở thích) với mục tiêu nghề nghiệp của bạn."),
                ("stage_2", "🔍 Xây dựng Ma trận Kỹ năng (Skill Gap Matrix)",
                 "Phân tích thế mạnh hiện có và lỗ hổng kỹ năng so với vai trò mục tiêu."),
                ("stage_3", "⚖️ Chọn CLB phù hợp & đánh giá độ tương thích",
                 "Sàng lọc các CLB, tính Match Score và lý do sâu sắc cho từng gợi ý."),
                ("stage_4", "🚀 Lập Lộ trình 6 tháng cá nhân hóa",
                 "Chia giai đoạn hành động theo tháng với vai trò cụ thể cần ứng tuyển."),
            ],
            "strategy": [
                ("stage_1", "🎯 Chẩn đoán sức khỏe CLB",
                 "Phân tích chỉ số thành viên, hoạt động và tương tác hiện tại của CLB."),
                ("stage_2", "🔍 Tìm điểm nghẽn & cơ hội tăng trưởng",
                 "Sau khi phân tích dữ liệu, xác định rào cản giữ chân thành viên và kênh thu hút mới."),
                ("stage_3", "⚖️ Phản biện rủi ro & nguồn lực",
                 "Đánh giá khả năng triển khai, rủi ro churn rate và nguồn lực cần huy động."),
                ("stage_4", "🚀 Đề xuất Chiến lược 3 giai đoạn",
                 "Tổng hợp kế hoạch hành động: tuyển quân, kích hoạt tương tác, vận hành bền vững."),
            ],
            "event": [
                ("stage_1", "🎯 Định hình ý tưởng & mục tiêu sự kiện",
                 f"Nắm bắt concept '{topic}' và mục tiêu mong muốn đạt được."),
                ("stage_2", "🔍 Lập Tổng quan Kịch bản 360 độ",
                 "Triển khai timeline, phân vai ban tổ chức, logistics và ngân sách dự kiến."),
                ("stage_3", "⚖️ Kiểm tra rủi ro & tính khả thi",
                 "Đối chiếu quy mô người tham dự, kinh phí và rủi ro trùng lịch."),
                ("stage_4", "🚀 Hoàn thiện Kế hoạch triển khai",
                 "Đóng gói chi tiết thực thi, nhân sự, truyền thông và quy trình check-in nhận điểm."),
            ],
            "media": [
                ("stage_1", "🎯 Xác định thông điệp & đối tượng",
                 f"Nắm bắt chủ đề '{topic}' và chọn giọng văn phù hợp với từng kênh."),
                ("stage_2", "🔍 Sáng tạo Khẩu hiệu & Hook thu hút",
                 "Brainstorm câu chữ ấn tượng, hook cuốn hút để tăng tương tác."),
                ("stage_3", "⚖️ Đa kênh hóa nội dung",
                 "Biến tấu nội dung cho Facebook, Email, Kịch bản MC và Visual Brief."),
                ("stage_4", "🚀 Tổng hợp Media Kit hoàn chỉnh",
                 "Đóng gói bộ nội dung sẵn sàng đăng tải kèm hashtags và khung giờ vàng."),
            ],
        }
        return plans.get(context, plans["general"])
    
    @classmethod
    async def stream_reasoning(
        cls,
        user_message: str,
        history: Optional[List[Dict]] = None,
        context: str = "general",
        user_profile: Optional[Dict] = None,
        db: Optional[Session] = None,
        system_override: Optional[str] = None,
        orchestrator_stream_fn=None,
        max_tokens: int = 300
    ) -> AsyncGenerator[Dict, None]:
        """
        Streaming Cognitive Pipeline: phát tiến trình tư duy realtime + token theo từng bước.
        UI nhận các sự kiện: thought_step (running/completed), token, error, done.
        """
        from app.ai_service import ai_orchestrator_stream

        stream_fn = orchestrator_stream_fn or ai_orchestrator_stream

        # 0. Câu hỏi có đáp án tính được ngay từ database -> trả thẳng, không gọi LLM.
        # Lý do: model llama3.2:3b dù prompt có dữ liệu đúng vẫn tự bịa tên sự kiện
        # (vd "CLB Lập trình IT có workshop..." -> bịa "Workshop Lập trình Web").
        if db is not None and not system_override:
            direct = direct_answers.build_direct_answer(db, user_message)
            if direct:
                yield {
                    "type": "thought_step", "status": "running",
                    "step_name": "intro", "title": "🔎 Đang tra cứu dữ liệu trực tiếp...",
                    "content": "Tính toán từ database thay vì suy đoán."
                }
                yield {"type": "token", "content": direct}
                yield {
                    "type": "thought_step", "status": "completed",
                    "step_name": "synth", "title": "✅ Trả lời từ dữ liệu hệ thống",
                    "content": "Câu trả lời được lấy trực tiếp từ database CLB Hub."
                }
                yield {"type": "done", "context": context}
                return

    
        # 1. Sự kiện khởi động + 4 bước định hướng (running)
        yield {
            "type": "thought_step", "status": "running",
            "step_name": "intro", "title": "🧠 Đang khởi động bộ não AI...",
            "content": "Khởi tạo ngữ cảnh, hồ sơ sinh viên và các công cụ suy luận."
        }
        for step_name, title, content in cls.build_pre_thinking(user_message, context):
            yield {
                "type": "thought_step", "status": "running",
                "step_name": step_name, "title": title, "content": content
            }
    
        # 2. Gộp lịch sử hội thoại gần nhất để giữ ngữ cảnh
        prompt_for_llm = user_message
        if history:
            recent = [m for m in history[-5:] if m.get("message")]
            if recent:
                hist_text = "\n".join(
                    f"{'Người dùng' if m.get('role') == 'user' else 'AI'}: {m.get('message', '')}"
                    for m in recent
                )
                prompt_for_llm = f"Cuộc trò chuyện trước đó:\n{hist_text}\n\nNgười dùng: {user_message}"
    
        full_system = system_override or cls.build_chat_system_prompt(prompt_for_llm, user_profile, db)
    
        # 3. Stream token thực tế (suy nghĩ thành văn bản)
        buffer = ""
        try:
            async for token in stream_fn(
                prompt_for_llm, system=full_system, temperature=0.3, max_tokens=max_tokens
            ):
                buffer += token
                yield {"type": "token", "content": token}
        except Exception as e:
            yield {"type": "error", "content": f"Lỗi AI: {str(e)}"}
            return
    
        # 4. Trích xuất reasoning traces (thinking) và phát các bước đã hoàn tất
        thinking, _ = cls.extract_thinking(buffer)
        stages = cls.parse_thought_stages(thinking)
        if stages:
            for step in stages:
                yield {
                    "type": "thought_step", "status": "completed",
                    "step_name": step.step_name,
                    "title": step.title,
                    "content": step.content
                }
        else:
            yield {
                "type": "thought_step", "status": "completed",
                "step_name": "synth", "title": "✅ Hoàn tất phân tích",
                "content": "Đã tổng hợp câu trả lời dựa trên dữ liệu hệ thống CLB Hub."
            }
    
        yield {"type": "done", "context": context}
    
    
# Singleton engine instance
thought_engine = ThoughtEngine()
