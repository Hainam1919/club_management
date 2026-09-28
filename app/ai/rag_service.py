"""
RAG Service nâng cấp cho hệ thống CLB Student Hub.
Sử dụng ChromaDB với chiến lược Hybrid Retrieval, Reranking và Semantic Chunking.
"""
import chromadb
from chromadb.utils import embedding_functions
import os
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import re

# Đường dẫn lưu trữ Vector DB
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./data/chroma_db")

# ============= KIẾN THỨC TỔNG QUAN VỀ HỆ THỐNG CLB (ICTU) =============
# Các chunk kiến thức chung giúp AI trả lời câu hỏi về quy trình, vai trò,
# lợi ích và cách dùng hệ thống mà không cần truy vấn từng CLB cụ thể.
GENERAL_CLUB_KNOWLEDGE = [
    {
        "id": "faq_join_process",
        "text": (
            "QUY TRÌNH THAM GIA CÂU LẠC BỘ TẠI ĐẠI HỌC ICTU\n"
            "Bước 1: Xem danh sách CLB trên hệ thống CLB Student Hub và chọn CLB phù hợp với sở thích, khoa và kỹ năng của bạn.\n"
            "Bước 2: Bấm nút 'Gửi đơn xin gia nhập' (Apply) cho CLB đó.\n"
            "Bước 3: Tham dự vòng phỏng vấn hoặc buổi giới thiệu (intro) do ban chủ nhiệm CLB tổ chức.\n"
            "Bước 4: Trải qua thời gian thử việc (thường 1 tháng), sau đó trở thành thành viên chính thức.\n"
            "Sinh viên có thể tham gia nhiều CLB cùng lúc nhưng nên cân đối thời gian học tập."
        ),
    },
    {
        "id": "faq_roles",
        "text": (
            "VAI TRÒ VÀ BAN CHỦ NHIỆM CÂU LẠC BỘ\n"
            "Mỗi CLB có một Chủ nhiệm (President) chịu trách nhiệm chính, Phó chủ nhiệm (Vice President) phụ trách điều hành, "
            "các Trưởng ban / Leader phụ trách mảng hoạt động cụ thể, và các Thành viên (Member).\n"
            "Ban chủ nhiệm có nhiệm vụ lên kế hoạch hoạt động, tuyển thành viên, tổ chức sự kiện và báo cáo hoạt động cho Ban Quản lý Sinh viên."
        ),
    },
    {
        "id": "faq_benefits",
        "text": (
            "LỢI ÍCH KHI THAM GIA CÂU LẠC BỘ\n"
            "Tham gia CLB giúp sinh viên: phát triển kỹ năng chuyên môn và kỹ năng mềm; xây dựng mạng lưới bạn bè cùng sở thích; "
            "mở rộng trải nghiệm thực tế (sự kiện, workshop, dự án); rèn luyện tinh thần làm việc nhóm và trách nhiệm; "
            "được tích lũy điểm rèn luyện và nhận chứng chỉ số, khen thưởng cho những thành viên tích cực."
        ),
    },
    {
        "id": "faq_categories",
        "text": (
            "CÁC DANH MỤC CÂU LẠC BỘ TẠI ICTU\n"
            "Hệ thống phân loại CLB theo 6 danh mục chính:\n"
            "- Học thuật: CLB Lập trình, Robotics & IoT, Tiếng Anh, Cờ vua, Sách & Tri thức.\n"
            "- Thể thao: CLB Bóng đá, Bóng rổ, Yoga & Thiền.\n"
            "- Văn nghệ: CLB Văn nghệ, Guitar & Âm nhạc, Phim ảnh & Nhiếp ảnh, Thiết kế Đồ họa.\n"
            "- Tình nguyện: CLB Tình nguyện Xanh, Du lịch & Khám phá, Bảo vệ Môi trường, Công tác Xã hội.\n"
            "- Kỹ năng: CLB Kỹ năng mềm, Startup & Khởi nghiệp, Marketing & SEO.\n"
            "- Truyền thông: CLB Truyền thông MC."
        ),
    },
    {
        "id": "faq_events",
        "text": (
            "TỔ CHỨC VÀ THAM GIA SỰ KIỆN\n"
            "CLB tạo sự kiện trên hệ thống với thông tin: tiêu đề, mô tả, địa điểm, thời gian bắt đầu, sức chứa tối đa.\n"
            "Sinh viên đăng ký tham gia sự kiện (nếu còn chỗ). Mỗi sự kiện có điểm dự đoán thành công do AI đánh giá.\n"
            "Tại buổi diễn ra, sinh viên Check-in qua mã QR để tự động cộng điểm rèn luyện và nhận chứng chỉ số.\n"
            "Sau sự kiện, sinh viên có thể gửi đánh giá cảm xúc (feedback) để hệ thống phân tích."
        ),
    },
    {
        "id": "faq_points",
        "text": (
            "ĐIỂM, LEVEL VÀ GAMIFICATION\n"
            "Hệ thống tích điểm (Points) cho các hoạt động: tham gia sự kiện, đăng ký CLB, sử dụng AI, đóng góp nội dung.\n"
            "Điểm tích lũy quy đổi thành Level và Rank (cấp bậc) của sinh viên. Thành viên tích cực sẽ được thăng hạng, "
            "nhận huy hiệu và chứng chỉ vinh danh. Chế độ này khuyến khích sinh viên tham gia liên tục (streak)."
        ),
    },
    {
        "id": "faq_ai_help",
        "text": (
            "CÁC TÍNH NĂNG AI CỦA HỆ THỐNG GỒM\n"
            "- Smart Chat: trợ lý tư vấn CLB, sự kiện, hướng nghiệp.\n"
            "- AI Studio Pro: Mentor cá nhân (lộ trình phát triển), Chiến lược gia (tăng trưởng CLB), "
            "Kiến trúc sư sự kiện (lên kế hoạch 360 độ), Nhà sản xuất truyền thông (tạo nội dung).\n"
            "- Sinh ảnh AI: banner, logo, poster SVG theo phong cách.\n"
            "- Predictive Insights: dự đoán xu hướng và gợi ý cá nhân hóa.\n"
            "- Phân tích cảm xúc và trích xuất từ khóa từ văn bản."
        ),
    },
    {
        "id": "faq_tips",
        "text": (
            "MẸO CHỌN CÂU LẠC BỘ PHÙ HỢP\n"
            "Mỗi sinh viên nên chọn 1 CLB chuyên môn (khớp ngành/khoa, ví dụ sinh viên khoa Công nghệ Thông tin nên chọn CLB Lập trình IT), "
            "1 CLB kỹ năng mềm và 1 CLB thể thao hoặc nghệ thuật để cân bằng.\n"
            "Xem kỹ mô tả, sứ mệnh, thành tích và phòng sinh hoạt của CLB để hiểu văn hoá trước khi ứng tuyển."
        ),
    },
]

class RAGService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        self.emb_fn = embedding_functions.DefaultEmbeddingFunction()

    def get_or_create_collection(self, name: str):
        return self.client.get_or_create_collection(
            name=name,
            embedding_function=self.emb_fn
        )

    def clear_collection(self, name: str):
        """Xóa toàn bộ dữ liệu trong collection để re-index"""
        try:
            collection = self.client.get_collection(name)
            collection.delete(where={})
        except:
            pass

    def add_documents(self, collection_name: str, documents: List[str], metadatas: List[Dict], ids: List[str]):
        collection = self.get_or_create_collection(collection_name)
        collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

    def _calculate_keyword_score(self, query: str, document: str) -> float:
        """Tính điểm tương đồng dựa trên từ khóa (Simulated BM25)"""
        query_words = set(re.findall(r'\w+', query.lower()))
        doc_words = set(re.findall(r'\w+', document.lower()))
        intersection = query_words.intersection(doc_words)
        return len(intersection) / (len(query_words) + 1e-6)

    def query(self, collection_name: str, query_text: str, n_results: int = 3) -> List[Dict[str, Any]]:
        """Truy vấn Vector Search cơ bản"""
        collection = self.get_or_create_collection(collection_name)
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results
        )

        formatted_results = []
        if results['documents']:
            for i in range(len(results['documents'][0])):
                formatted_results.append({
                    "text": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "distance": results['distances'][0][i] if results['distances'] else None
                })
        return formatted_results

    def query_hybrid(self, query_text: str, n_results: int = 3) -> List[Dict[str, Any]]:
        """
        Hybrid Retrieval nâng cấp:
        1. Truy vấn Vector Search từ nhiều nguồn.
        2. Reranking: Tái sắp xếp kết quả dựa trên điểm từ khóa (Keyword Scoring).
        3. Lọc bỏ nhiễu và trả về top-n chính xác nhất.
        """
        all_results = []
        collections = ["club_knowledge", "event_knowledge", "faq_knowledge"]

        for col in collections:
            # Lấy nhiều kết quả hơn để rerank (ví dụ 10 thay vì 3)
            res = self.query(col, query_text, n_results=10)
            for item in res:
                item['source'] = col
                # Tính thêm điểm keyword
                item['keyword_score'] = self._calculate_keyword_score(query_text, item['text'])
                all_results.append(item)

        # Chiến lược Reranking: Kết hợp Distance (Vector) và Keyword Score
        # Công thức: FinalScore = (1 - distance) * 0.7 + (keyword_score) * 0.3
        def rank_score(x):
            dist = x['distance'] if x['distance'] is not None else 1.0
            # Normalize distance (giả định distance nằm trong khoảng 0-2)
            norm_dist = max(0, 1 - (dist / 2))
            return (norm_dist * 0.7) + (x['keyword_score'] * 0.3)

        all_results.sort(key=rank_score, reverse=True)
        return all_results[:n_results]

    def index_club_data(self, db: Session):
        """Index dữ liệu CLB với Semantic Chunking (tạo văn bản giàu ngữ cảnh)"""
        from app import models
        self.clear_collection("club_knowledge")

        clubs = db.query(models.Club).all()
        docs, metadatas, ids = [], [], []

        for club in clubs:
            president_name = ""
            if club.president_id:
                president = db.query(models.User).filter(models.User.id == club.president_id).first()
                president_name = president.full_name if president else ""
            founded = club.founded_date.strftime("%d/%m/%Y") if club.founded_date else "Chưa rõ"

            lines = [
                f"THÔNG TIN CHI TIẾT CÂU LẠC BỘ: {club.name}",
                f"Danh mục: {club.category}",
                f"Giới thiệu: {club.description}",
                f"Sứ mệnh: {club.mission}",
                f"Tầm nhìn: {club.vision}",
                f"Thành tích nổi bật: {club.achievements}",
                f"Hoạt động đặc trưng / từ khóa: {club.ai_tags}",
                f"Quy mô: {club.member_count} thành viên",
                f"Phòng sinh hoạt: {club.meeting_room}",
                f"Liên hệ: email {club.email}; facebook {club.facebook}",
            ]
            if president_name:
                lines.append(f"Chủ nhiệm hiện tại: {president_name}")
            lines.append(f"Ngày thành lập: {founded}")
            if club.ai_summary:
                lines.append(f"Đánh giá: {club.ai_summary}")

            docs.append("\n".join(lines))
            metadatas.append({"id": club.id, "type": "club", "name": club.name, "category": club.category})
            ids.append(f"club_{club.id}")

        if docs:
            self.add_documents("club_knowledge", docs, metadatas, ids)

    def index_general_knowledge(self):
        """Index kiến thức tổng quan về hệ thống CLB vào collection riêng."""
        self.clear_collection("faq_knowledge")
        docs, metadatas, ids = [], [], []
        for chunk in GENERAL_CLUB_KNOWLEDGE:
            docs.append(chunk["text"])
            metadatas.append({"type": "faq", "id": chunk["id"]})
            ids.append(chunk["id"])
        if docs:
            self.add_documents("faq_knowledge", docs, metadatas, ids)

    def index_event_data(self, db: Session):
        """Index dữ liệu Sự kiện với cấu trúc văn bản tối ưu cho RAG"""
        from app import models
        self.clear_collection("event_knowledge")

        events = db.query(models.Event).all()
        docs, metadatas, ids = [], [], []

        for event in events:
            text = (
                f"THÔNG TIN CHI TIẾT SỰ KIỆN: {event.title}\n"
                f"Mô tả chi tiết: {event.description}\n"
                f"Địa điểm tổ chức: {event.location}\n"
                f"Thời gian bắt đầu: {event.start_time}\n"
                f"Trạng thái: {event.status}\n"
                f"Điểm đánh giá AI: {event.ai_success_score}%"
            )
            docs.append(text)
            metadatas.append({"id": event.id, "type": "event", "name": event.title})
            ids.append(f"event_{event.id}")

        if docs:
            self.add_documents("event_knowledge", docs, metadatas, ids)

# Singleton instance
rag_service = RAGService()
