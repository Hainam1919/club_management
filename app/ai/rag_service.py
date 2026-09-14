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
        collections = ["club_knowledge", "event_knowledge"]

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
            # Tạo chunk văn bản mô tả chi tiết để AI dễ tìm kiếm
            text = (
                f"THÔNG TIN CHI TIẾT CÂU LẠC BỘ: {club.name}\n"
                f"Danh mục: {club.category}\n"
                f"Mô tả ngắn: {club.description}\n"
                f"Sứ mệnh: {club.mission}\n"
                f"Tầm nhìn: {club.vision}\n"
                f"Số lượng thành viên: {club.member_count}\n"
                f"Thông tin liên hệ: {club.email}\n"
                f"AI Summary: {club.ai_summary}"
            )
            docs.append(text)
            metadatas.append({"id": club.id, "type": "club", "name": club.name, "category": club.category})
            ids.append(f"club_{club.id}")

        if docs:
            self.add_documents("club_knowledge", docs, metadatas, ids)

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
