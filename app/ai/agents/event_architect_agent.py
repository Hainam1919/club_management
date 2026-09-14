"""
Autonomous Event Architect Agent - Chuyên gia kiến trúc & lập kế hoạch sự kiện 360 độ
Lập kế hoạch sự kiện từ A-Z: Timeline chi tiết, Dự toán ngân sách, Ma trận phân công nhân sự, Đánh giá rủi ro SWOT và Dự báo tỷ lệ thành công.
"""
import json
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import Club, Event


class EventArchitectAgent:
    """
    Agent tự động thiết kế kế hoạch sự kiện hoàn chỉnh cho CLB sinh viên.
    """

    @classmethod
    async def design_event_blueprint(
        cls,
        title: str,
        concept: str,
        club_id: Optional[int] = None,
        expected_attendees: int = 100,
        estimated_budget_vnd: int = 5000000,
        db: Optional[Session] = None,
        ai_generate_fn=None
    ) -> Dict[str, Any]:
        from app.ai_service import ai_generate

        gen_fn = ai_generate_fn or ai_generate

        club_name = "CLB Sinh Viên"
        if db and club_id:
            c = db.query(Club).filter(Club.id == club_id).first()
            if c:
                club_name = c.name

        prompt = f"""Bạn là Tổng Đạo Diễn & Chuyên Gia Thiết Kế Sự Kiện Đại Học (Senior Event Architect).
Hãy lập một bản kế hoạch tổ chức sự kiện toàn diện (Master Event Blueprint) theo yêu cầu sau:

THÔNG TIN ĐẦU VÀO:
- Tên sự kiện: {title}
- Ý tưởng cốt lõi (Concept): {concept}
- Đơn vị tổ chức: {club_name}
- Quy mô dự kiến: {expected_attendees} người tham dự
- Ngân sách ước tính: {estimated_budget_vnd:,} VNĐ

YÊU CẦU KIẾN TRÚC TƯ DUY:
1. Xác định Mục tiêu SMART của sự kiện.
2. Timeline chi tiết các mốc (Trước sự kiện 2 tuần -> Ngày diễn ra theo từng khung giờ -> Sau sự kiện).
3. Bảng phân bổ ngân sách dự toán chi tiết (Hội trường, Âm thanh, Truyền thông, Quà tặng, Dự phòng).
4. Ma trận phân công nhân sự (Ban Nội dung, Ban Hậu cần, Ban Truyền thông, Ban Đối ngoại).
5. Phân tích rủi ro & Phương án dự phòng (Risk Matrix & Contingency Plans).
6. Dự đoán điểm thành công (% Success Score) và công thức đo lường KPI.

Trả về kết quả dưới định dạng JSON chuẩn:
{{
  "event_title": "{title}",
  "tagline": "...",
  "smart_objectives": ["..."],
  "timeline_stages": [
    {{"stage": "Giai đoạn Chuẩn bị (T-14 ngày)", "tasks": ["..."]}},
    {{"stage": "Ngày diễn ra sự kiện (D-Day)", "tasks": ["..."]}},
    {{"stage": "Giai đoạn Tổng kết (T+3 ngày)", "tasks": ["..."]}}
  ],
  "agenda_d_day": [
    {{"time": "08:00 - 08:30", "activity": "Đón tiếp & QR Check-in", "person_in_charge": "Ban Hậu cần"}},
    {{"time": "08:30 - 09:00", "activity": "Khai mạc & Phát biểu", "person_in_charge": "Ban Nội dung"}},
    {{"time": "09:00 - 11:00", "activity": "Hoạt động chính", "person_in_charge": "Toàn ban"}},
    {{"time": "11:00 - 11:30", "activity": "Bế mạc, Trao giải & Chụp ảnh lưu niệm", "person_in_charge": "Ban Truyền thông"}}
  ],
  "budget_allocation": [
    {{"item": "...", "amount_vnd": 0, "percentage": "..."}}
  ],
  "staffing_matrix": [
    {{"team": "Ban Nội dung", "headcount": 3, "responsibilities": "..."}},
    {{"team": "Ban Truyền thông", "headcount": 4, "responsibilities": "..."}},
    {{"team": "Ban Hậu cần", "headcount": 5, "responsibilities": "..."}}
  ],
  "risk_matrix": [
    {{"risk": "...", "severity": "Cao/Trung bình/Thấp", "mitigation": "..."}}
  ],
  "ai_success_score": 92.5,
  "kpi_metrics": ["..."]
}}
"""

        system = "Bạn là Chuyên gia Lập kế hoạch Sự kiện. Chỉ trả về JSON thuần túy không kèm markdown bên ngoài."

        try:
            res_text = await gen_fn(prompt, system=system, temperature=0.5, max_tokens=1200)
            clean_json = re.search(r'\{[\s\S]*\}', res_text)
            if clean_json:
                return json.loads(clean_json.group(0))
        except Exception:
            pass

        return cls._fallback_blueprint(title, concept, club_name, expected_attendees, estimated_budget_vnd)

    @classmethod
    def _fallback_blueprint(cls, title: str, concept: str, club_name: str, attendees: int, budget: int) -> Dict[str, Any]:
        return {
            "event_title": title,
            "tagline": f"Bùng nổ đam mê cùng {club_name}",
            "smart_objectives": [
                f"Thu hút ít nhất {attendees} sinh viên tham gia trực tiếp",
                "Đạt 90% phản hồi tích cực (4-5 sao) trên hệ thống đánh giá",
                "Tạo độ nhận diện truyền thông với 2,000+ lượt tiếp cận trên mạng xã hội"
            ],
            "timeline_stages": [
                {
                    "stage": "Giai đoạn Chuẩn bị (T-14 ngày)",
                    "tasks": [
                        "Duyệt kịch bản chi tiết và phân công trưởng các ban",
                        "Liên hệ đặt hội trường và trang thiết bị âm thanh ánh sáng",
                        "Mở cổng đăng ký online và phát động chiến dịch truyền thông giai đoạn 1"
                    ]
                },
                {
                    "stage": "Ngày diễn ra sự kiện (D-Day)",
                    "tasks": [
                        "Setup sân khấu, backdrop và hệ thống QR Check-in trước 2 tiếng",
                        "Rehearsal chạy thử toàn bộ kịch bản MC và clip trình chiếu",
                        "Kiểm soát luồng người tham dự và điều phối các phiên thảo luận"
                    ]
                },
                {
                    "stage": "Giai đoạn Tổng kết (T+3 ngày)",
                    "tasks": [
                        "Đăng bài truyền thông cảm ơn và album ảnh sự kiện",
                        "Xuất chứng chỉ số tham gia cho người check-in và cộng điểm rèn luyện",
                        "Họp rút kinh nghiệm và quyết toán ngân sách"
                    ]
                }
            ],
            "agenda_d_day": [
                {"time": "08:00 - 08:30", "activity": "Đón tiếp đại biểu, sinh viên & Check-in QR", "person_in_charge": "Ban Hậu cần"},
                {"time": "08:30 - 08:45", "activity": "Tiết mục văn nghệ mở màn & Tuyên bố lý do", "person_in_charge": "Ban Văn nghệ & MC"},
                {"time": "08:45 - 10:30", "activity": f"Nội dung trọng tâm: {concept[:60]}", "person_in_charge": "Ban Nội dung"},
                {"time": "10:30 - 11:00", "activity": "Minigame Q&A, Trao quà và Chứng nhận", "person_in_charge": "Ban Tổ chức"},
                {"time": "11:00 - 11:30", "activity": "Chụp ảnh lưu niệm toàn đoàn & Bế mạc", "person_in_charge": "Ban Truyền thông"}
            ],
            "budget_allocation": [
                {"item": "Âm thanh, Ánh sáng & Hội trường", "amount_vnd": int(budget * 0.35), "percentage": "35%"},
                {"item": "Quà tặng, Teabreak & Nước uống", "amount_vnd": int(budget * 0.30), "percentage": "30%"},
                {"item": "In ấn Backdrop, Poster & Truyền thông", "amount_vnd": int(budget * 0.20), "percentage": "20%"},
                {"item": "Quỹ Dự phòng phát sinh", "amount_vnd": int(budget * 0.15), "percentage": "15%"}
            ],
            "staffing_matrix": [
                {"team": "Ban Nội dung", "headcount": 3, "responsibilities": "Xây dựng kịch bản MC, diễn giả, quản lý timeline"},
                {"team": "Ban Truyền thông", "headcount": 4, "responsibilities": "Chụp ảnh, quay video, livestream, viết bài"},
                {"team": "Ban Hậu cần", "headcount": 6, "responsibilities": "Bàn check-in, chuẩn bị quà tặng, điều phối an ninh"}
            ],
            "risk_matrix": [
                {"risk": "Thời tiết xấu hoặc sự cố mất điện/mạng", "severity": "Trung bình", "mitigation": "Chuẩn bị sẵn máy phát dự phòng và 4G di động"},
                {"risk": "Số lượng người tham gia vượt quá sức chứa hội trường", "severity": "Cao", "mitigation": "Giới hạn số lượng đăng ký tối đa trên form và có luồng phát trực tiếp"},
                {"risk": "Diễn giả hoặc MC đến muộn", "severity": "Thấp", "mitigation": "Bố trí MC dự phòng và chuẩn bị sẵn minigame giao lưu mở màn"}
            ],
            "ai_success_score": 88.0,
            "kpi_metrics": [
                f"{attendees} lượt Check-in hợp lệ",
                "Tối thiểu 50 đánh giá phản hồi trên ứng dụng",
                "Hoàn thành trong khung ngân sách cho phép"
            ]
        }


event_architect_agent = EventArchitectAgent()
