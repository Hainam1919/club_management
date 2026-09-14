"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  HiArrowLeft,
  HiUsers,
  HiCalendar,
  HiDocumentText,
  HiCheckCircle,
  HiSparkles,
  HiArrowRight,
  HiOutlineMail,
  HiOutlineChatAlt2
} from 'react-icons/hi';

const ClubDetailPage = () => {
  const { id } = useParams();
  const [club, setClub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    async function fetchClub() {
      try {
        const data = await api.getClub(String(id));
        setClub(data);
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin câu lạc bộ.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchClub();
  }, [id]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner" />
    </div>
  );

  if (error || !club) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="text-6xl mb-4">❌</div>
      <h2 className="text-2xl font-bold mb-2">Lỗi tải dữ liệu</h2>
      <p className="text-text-mute mb-6">{error || 'Câu lạc bộ không tồn tại.'}</p>
      <Link href="/clubs" className="btn-primary px-6 py-2 rounded-full font-bold">Quay lại danh sách</Link>
    </div>
  );

  return (
    <div className="pb-20">
      {/* Header Banner */}
      <div className={`relative h-64 md:h-80 overflow-hidden ${
        club.category === 'Học thuật' ? 'bg-gradient-to-br from-indigo-600 to-blue-800' :
        club.category === 'Thể thao' ? 'bg-gradient-to-br from-pink-500 to-red-700' :
        club.category === 'Văn nghệ' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' :
        'bg-gradient-to-br from-emerald-500 to-teal-700'
      }`}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="container mx-auto px-4 h-full flex items-end pb-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white shadow-2xl flex items-center justify-center text-4xl md:text-6xl font-black text-primary border-4 border-white">
                {club.name.charAt(0)}
              </div>
              <div className="text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase">
                    {club.category}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black">{club.name}</h1>
              </div>
            </div>
            <div className="flex gap-3">
              {isAuthenticated ? (
                <button className="btn-primary px-6 py-3 rounded-full font-bold flex items-center gap-2">
                  <HiCheckCircle /> Tham gia CLB
                </button>
              ) : (
                <Link href="/login" className="btn-primary px-6 py-3 rounded-full font-bold">
                  Đăng nhập để tham gia
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="card-modern p-8">
              <div className="flex items-center gap-2 mb-6 text-primary font-bold uppercase text-xs tracking-widest">
                <HiDocumentText /> Giới thiệu
              </div>
              <h2 className="text-2xl font-bold mb-4">Về chúng tôi</h2>
              <p className="text-text-soft leading-relaxed text-lg">
                {club.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-4 rounded-xl bg-bg-soft dark:bg-bg-mute border border-border-soft dark:border-white/5">
                  <h4 className="font-bold text-sm mb-2 text-primary">Tầm nhìn</h4>
                  <p className="text-sm text-text-mute leading-relaxed">{club.vision || 'Đang cập nhật...'}</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-soft dark:bg-bg-mute border border-border-soft dark:border-white/5">
                  <h4 className="font-bold text-sm mb-2 text-primary">Sứ mệnh</h4>
                  <p className="text-sm text-text-mute leading-relaxed">{club.mission || 'Đang cập nhật...'}</p>
                </div>
              </div>
            </div>

            {/* AI Insight Section */}
            <div className="card-modern p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-6 text-primary font-bold uppercase text-xs tracking-widest">
                <HiSparkles /> AI Analysis
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="text-center md:text-left flex-1">
                  <h3 className="text-xl font-bold mb-2">AI gợi ý cho bạn</h3>
                  <p className="text-text-mute text-sm">
                    Dựa trên phân tích, CLB này đặc biệt phù hợp với những bạn yêu thích {club.ai_tags?.join(', ') || 'phát triển kỹ năng'}.
                  </p>
                </div>
                <Link href="/ai" className="btn-primary px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                  Hỏi AI chi tiết <HiArrowRight />
                </Link>
              </div>
            </div>

            {/* Related Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card-modern p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                    <HiCalendar /> Sự kiện
                  </div>
                  <Link href="/events" className="text-xs font-bold text-primary hover:underline">Xem tất cả</Link>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-text-mute">Hãy xem các hoạt động sắp tới của CLB.</p>
                  {/* Placeholder for events list */}
                  <div className="p-4 rounded-lg bg-bg-soft dark:bg-bg-mute border border-border-soft dark:border-white/5 text-center py-8 text-sm text-text-mute">
                    Đang tải danh sách sự kiện...
                  </div>
                </div>
              </div>

              <div className="card-modern p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                    <HiUsers /> Thành viên
                  </div>
                  <Link href="/members" className="text-xs font-bold text-primary hover:underline">Xem chi tiết</Link>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-bg-soft dark:bg-bg-mute">
                    <span className="text-sm font-medium">Tổng số thành viên</span>
                    <span className="font-bold text-primary">{club.member_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-bg-soft dark:bg-bg-mute">
                    <span className="text-sm font-medium">Vị trí chủ nhiệm</span>
                    <span className="font-bold text-text dark:text-white">Đang hoạt động</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card-modern p-6 text-center">
              <h3 className="font-bold text-lg mb-4">Liên hệ Ban chủ nhiệm</h3>
              <div className="flex flex-col gap-3">
                <button className="btn-secondary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/10">
                  <HiOutlineMail /> Gửi Email
                </button>
                <button className="btn-secondary w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary/10">
                  <HiOutlineChatAlt2 /> Nhắn tin
                </button>
              </div>
            </div>

            <div className="card-modern p-6">
              <h3 className="font-bold text-lg mb-4">Thống kê nhanh</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-mute">Độ hoạt động</span>
                  <span className="text-success font-bold">Cao 🔥</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-mute">Đánh giá trung bình</span>
                  <span className="text-primary font-bold">4.8/5.0 ⭐</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-mute">Sự kiện/Tháng</span>
                  <span className="font-bold">2-4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubDetailPage;
