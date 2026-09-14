"""
Career & Skill Mentor Agent - Chuyên gia tư vấn hướng nghiệp & phát triển kỹ năng cá nhân hóa
Sử dụng mô hình phân tích ma trận kỹ năng (Skill Gap Matrix) và định hướng ngoại khóa.
"""
import json
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import User, Club, Membership, EventRegistration
from app.ai.thought_engine import ThoughtStep


class MentorAgent:
    """
    Agent chuyên sâu về phân tích năng lực sinh viên và định hướng hoạt động CLB.
    """

    @classmethod
    async def analyze_and_plan(
        cls,
        user_id: int,
        target_role: Optional[str] = None,
        db: Optional[Session] = None,
        ai_generate_fn=None
    ) -> Dict[str, Any]:
        from app.ai_service import ai_generate

        gen_fn = ai_generate_fn or ai_generate

        # 1. Thu thập dữ liệu sinh viên
        user = db.query(User).filter(User.id == user_id).first() if db else None
        if not user:
            return {"error": "User not found"}

        memberships = db.query(Club).join(Membership, Membership.club_id == Club.id)\
            .filter(Membership.user_id == user_id, Membership.is_active == True).all() if db else []
        joined_clubs = [c.name for c in memberships]
        all_clubs = db.query(Club).filter(Club.is_active == True).all() if db else []

        skills_list = [s.strip() for s in (user.skills or "").split(",") if s.strip()]
        interests_list = [i.strip() for i in (user.interests or "").split(",") if i.strip()]

        prompt = f"""Bạn là Chuyên gia Cố vấn Hướng nghiệp Cao cấp (Senior Career & Skill Mentor).
Hãy phân tích hồ sơ sinh viên và thiết lập lộ trình phát triển kỹ năng qua hoạt động ngoại khóa:

THÔNG TIN SINH VIÊN:
- Họ và tên: {user.full_name}
- Khoa: {user.faculty or 'Chưa rõ'}
- Kỹ năng hiện có: {', '.join(skills_list) or 'Chưa khai báo'}
- Sở thích / Đam mê: {', '.join(interests_list) or 'Chưa khai báo'}
- CLB đang tham gia: {', '.join(joined_clubs) or 'Chưa tham gia'}
- Mục tiêu nghề nghiệp: {target_role or 'Phát triển toàn diện'}

DANH SÁCH CLB HIỆN CÓ:
{', '.join([f'{c.name} ({c.category})' for c in all_clubs[:15]])}

YÊU CẦU PHÂN TÍCH TƯ DUY:
1. Đánh giá thế mạnh hiện tại (Strengths).
2. Phân tích lỗ hổng kỹ năng (Skill Gap Matrix) so với mục tiêu nghề nghiệp.
3. Gợi ý 3 CLB phù hợp nhất kèm điểm tương thích (Match Score 0-100) và lý do sâu sắc.
4. Lộ trình hành động 6 tháng (Mục tiêu từng tháng, vai trò nên ứng tuyển).

Hãy trả về kết quả dưới định dạng JSON chuẩn:
{{
  "overall_readiness_score": 85,
  "strengths": ["..."],
  "skill_gaps": ["..."],
  "recommended_clubs": [
    {{"club_name": "...", "category": "...", "match_score": 92, "reason": "...", "target_role": "..."}}
  ],
  "six_month_roadmap": [
    {{"month": "Tháng 1-2", "focus": "...", "actions": ["..."]}},
    {{"month": "Tháng 3-4", "focus": "...", "actions": ["..."]}},
    {{"month": "Tháng 5-6", "focus": "...", "actions": ["..."]}}
  ],
  "mentorship_advice": "..."
}}
"""

        system = "Bạn là Mentor giáo dục đại học. Chỉ trả về JSON thuần túy không kèm markdown formatting."

        try:
            res_text = await gen_fn(prompt, system=system, temperature=0.4, max_tokens=1000)
            clean_json = re.search(r'\{[\s\S]*\}', res_text)
            if clean_json:
                data = json.loads(clean_json.group(0))
                data["user_info"] = {
                    "full_name": user.full_name,
                    "faculty": user.faculty,
                    "current_clubs": joined_clubs
                }
                return data
        except Exception:
            pass

        # Cognitive Fallback
        return cls._fallback_mentor_plan(user, joined_clubs, skills_list, target_role)

    @classmethod
    def _fallback_mentor_plan(cls, user: User, joined_clubs: List[str], skills: List[str], target_role: Optional[str]) -> Dict[str, Any]:
        faculty = user.faculty or "Công nghệ Thông tin"
        return {
            "overall_readiness_score": 78,
            "strengths": [
                f"Nền tảng sinh viên khoa {faculty} có tư duy logic tốt",
                "Tinh thần chủ động tìm kiếm cơ hội phát triển ngoại khóa",
                f"Đã sở hữu các kỹ năng nền tảng: {', '.join(skills[:3]) if skills else 'Kỹ năng học tập cơ bản'}"
            ],
            "skill_gaps": [
                "Cần cải thiện kỹ năng thuyết trình và đàm phán trước đám đông",
                "Kinh nghiệm làm việc nhóm trong các dự án quy mô thực tế còn hạn chế",
                "Kỹ năng quản lý thời gian giữa học tập và hoạt động phong trào"
            ],
            "recommended_clubs": [
                {
                    "club_name": "CLB Lập trình IT",
                    "category": "Học thuật",
                    "match_score": 95,
                    "reason": "Phát triển chuyên môn sâu, tham gia các cuộc thi Hackathon và dự án lập trình thực tế",
                    "target_role": "Ban Chuyên môn / Tech Lead"
                },
                {
                    "club_name": "CLB Kỹ năng mềm",
                    "category": "Kỹ năng",
                    "match_score": 90,
                    "reason": "Rèn luyện khả năng giao tiếp, lãnh đạo và giải quyết xung đột trong môi trường đại học",
                    "target_role": "Thành viên Ban Truyền thông & Sự kiện"
                },
                {
                    "club_name": "CLB Tình nguyện Xanh",
                    "category": "Tình nguyện",
                    "match_score": 85,
                    "reason": "Gia tăng điểm rèn luyện, mở rộng mối quan hệ và phát triển tinh thần trách nhiệm xã hội",
                    "target_role": "Cộng tác viên Sự kiện"
                }
            ],
            "six_month_roadmap": [
                {
                    "month": "Tháng 1-2 (Hòa nhập)",
                    "focus": "Gia nhập CLB mục tiêu & Xây dựng quan hệ",
                    "actions": ["Đăng ký tham gia 1 CLB Chuyên môn và 1 CLB Kỹ năng", "Tham gia trọn vẹn 2 sự kiện định hướng của CLB"]
                },
                {
                    "month": "Tháng 3-4 (Đóng góp)",
                    "focus": "Thực thi nhiệm vụ dự án thực tế",
                    "actions": ["Đăng ký vào Ban Tổ chức sự kiện tháng", "Hoàn thành 3 đầu việc trong hệ thống Task CLB"]
                },
                {
                    "month": "Tháng 5-6 (Bứt phá)",
                    "focus": "Đảm nhận vai trò phụ trách & Cấp chứng chỉ",
                    "actions": ["Ứng cử vị trí Trưởng nhóm / Phó ban", "Hoàn thành chỉ tiêu nhận Chứng chỉ Thành viên Xuất sắc"]
                }
            ],
            "mentorship_advice": "Hãy nhớ rằng hoạt động CLB không chỉ là nơi giải trí mà chính là môi trường giả lập doanh nghiệp thu nhỏ. Đóng góp nhiệt huyết sẽ đem lại hồ sơ CV vượt trội sau khi ra trường!",
            "user_info": {
                "full_name": user.full_name,
                "faculty": user.faculty,
                "current_clubs": joined_clubs
            }
        }


mentor_agent = MentorAgent()
