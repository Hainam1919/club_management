"""
Creative Media Producer Agent - Chuyên gia sáng tạo nội dung & truyền thông đa kênh
Tự động sinh: Bài đăng mạng xã hội (Facebook/Instagram), Email thông báo chính thức, Kịch bản MC, Khẩu hiệu (Slogan) và Hashtags tối ưu tương tác.
"""
import json
import re
from typing import Dict, Any, List, Optional


class MediaAgent:
    """
    Agent sáng tạo nội dung truyền thông cho các chiến dịch CLB.
    """

    @classmethod
    async def create_multi_channel_content(
        cls,
        title: str,
        topic_details: str,
        target_audience: str = "Sinh viên toàn trường",
        tone: str = "genz_energetic",  # genz_energetic, formal_academic, inspiring, exciting
        ai_generate_fn=None
    ) -> Dict[str, Any]:
        from app.ai_service import ai_generate

        gen_fn = ai_generate_fn or ai_generate

        tone_descriptions = {
            "genz_energetic": "Trẻ trung, bắt trend, sử dụng emoji sống động, dí dỏm, thu hút giới trẻ",
            "formal_academic": "Trang trọng, chuẩn mực, học thuật, phù hợp báo cáo và thông báo trường",
            "inspiring": "Truyền cảm hứng mạnh mẽ, khơi dậy tinh thần dấn thân, giàu cảm xúc",
            "exciting": "Hào hứng, kích thích sự tò mò, nhấn mạnh tính cấp bách (FOMO)"
        }
        chosen_tone_desc = tone_descriptions.get(tone, tone_descriptions["genz_energetic"])

        prompt = f"""Bạn là Giám đốc Sáng tạo Nội dung & Truyền thông (Creative Media Director).
Hãy sáng tạo gói nội dung truyền thông đa kênh (Multi-Channel Media Kit) cho sự kiện/hoạt động CLB sau:

THÔNG TIN ĐẦU VÀO:
- Tiêu đề chính: {title}
- Nội dung chi tiết: {topic_details}
- Đối tượng mục tiêu: {target_audience}
- Phong cách & Giọng văn (Tone of Voice): {chosen_tone_desc}

YÊU CẦU NỘI DUNG:
1. 3 Khẩu hiệu (Slogans) ấn tượng, dễ nhớ.
2. Bài đăng Facebook chuẩn SEO & Tương tác cao (Có Hook cuốn hút, Thân bài rõ ràng, Call to Action mạnh mẽ, Emojis).
3. Email thư mời chính thức gửi Giảng viên & Sinh viên.
4. Kịch bản lời dẫn mở màn MC (MC Opening Script) khoảng 1-2 phút.
5. Bộ 10 Hashtags tối ưu thuật toán hiển thị.
6. Gợi ý Concept hình ảnh / Poster (Visual Brief).

Trả về kết quả dưới định dạng JSON chuẩn:
{{
  "slogans": ["...", "...", "..."],
  "facebook_post": {{
    "headline": "...",
    "body": "...",
    "cta": "...",
    "hashtags": ["..."]
  }},
  "formal_email": {{
    "subject": "...",
    "salutation": "...",
    "content": "...",
    "signoff": "..."
  }},
  "mc_opening_script": "...",
  "visual_concept_brief": "...",
  "best_posting_time": "11:30 - 12:30 hoặc 19:30 - 21:00"
}}
"""

        system = "Bạn là Chuyên gia Copywriting & Social Media. Chỉ trả về JSON thuần túy không kèm văn bản bên ngoài."

        try:
            res_text = await gen_fn(prompt, system=system, temperature=0.7, max_tokens=1200)
            clean_json = re.search(r'\{[\s\S]*\}', res_text)
            if clean_json:
                return json.loads(clean_json.group(0))
        except Exception:
            pass

        return cls._fallback_media_kit(title, topic_details, target_audience, tone)

    @classmethod
    def _fallback_media_kit(cls, title: str, details: str, audience: str, tone: str) -> Dict[str, Any]:
        return {
            "slogans": [
                f"{title} - Bứt phá giới hạn, khẳng định chất riêng!",
                "Kết nối đam mê - Kiến tạo tương lai cùng CLB Hub!",
                "Sân chơi của những người tiên phong!"
            ],
            "facebook_post": {
                "headline": f"🔥 CHÍNH THỨC PHÁT ĐỘNG: {title.upper()} - SỰ KIỆN KHÔNG THỂ BỎ LỠ!",
                "body": f"""Chào cả nhà thân yêu! 👋

Các bạn đã sẵn sàng cho một trải nghiệm bùng nổ cùng {title} chưa? 🚀

✨ ĐIỀU GÌ ĐANG CHỜ ĐÓN BẠN?
{details[:250]}

🎁 QUYỀN LỢI ĐẶC QUYỀN KHI THAM GIA:
✅ Nhận ngay Chứng chỉ số và Điểm rèn luyện chính thức
✅ Cơ hội mở rộng kết nối với các bạn sinh viên tài năng
✅ Tham gia Minigame nhận phần quà công nghệ hấp dẫn

⏰ Thời gian & Địa điểm: Đã cập nhật chi tiết trên hệ thống CLB Hub!
📍 Đăng ký ngay hôm nay để giữ cho mình tấm vé ưu tiên nhé!""",
                "cta": "👉 ĐĂNG KÝ NGAY TẠI: https://clbhub.ictu.edu.vn/events",
                "hashtags": ["#CLBHub", "#ICTU", f"#{title.replace(' ', '')}", "#SinhVienNangDong", "#Event2026"]
            },
            "formal_email": {
                "subject": f"[THƯ MỜI THAM DỰ] {title} - Đại học Công nghệ & Truyền thông",
                "salutation": "Kính gửi Quý Thầy/Cô và các bạn Sinh viên thân mến,",
                "content": f"""Ban Tổ chức trân trọng kính mời Quý vị và các bạn sinh viên tham dự chương trình '{title}'.

Sự kiện được tổ chức nhằm tạo diễn đàn trao đổi chuyên môn, kết nối sinh viên và nâng cao kỹ năng thực tiễn trong môi trường đại học.

Nội dung trọng tâm:
{details[:200]}

Sự hiện diện của Quý vị là niềm vinh hạnh to lớn cho Ban Tổ chức chúng tôi.""",
                "signoff": "Trân trọng,\nBan Tổ chức CLB Student Hub"
            },
            "mc_opening_script": f"""(Âm nhạc mở màn sôi động dần lắng xuống)
MC: "Xin nhiệt liệt chào mừng toàn thể Quý thầy cô, các vị khách quý và đặc biệt là toàn thể các bạn sinh viên ưu tú đã có mặt tại chương trình {title} ngày hôm nay!
(Khán giả vỗ tay)
Lời đầu tiên, cho phép MC xin được gửi tới tất cả quý vị lời chúc sức khỏe và lời chào nồng nhiệt nhất! Chúc cho sự kiện của chúng ta hôm nay sẽ diễn ra thành công rực rỡ và để lại nhiều dấu ấn khó phai!"
""",
            "visual_concept_brief": "Tone màu chủ đạo: Xanh neon & Tím công nghệ (Cyberpunk / Modern Glassmorphism). Hình ảnh trung tâm: Biểu tượng kết nối và con người năng động vươn tới tương lai.",
            "best_posting_time": "11:30 - 12:30 hoặc 19:30 - 21:00 (Khung giờ sinh viên online cao nhất)"
        }


media_agent = MediaAgent()
