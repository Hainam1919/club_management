"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { HiArrowRight, HiSparkles, HiUsers, HiCalendar, HiLightBulb } from 'react-icons/hi';

const HomePage = () => {
  const [featuredClubs, setFeaturedClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClubs() {
      try {
        const data = await api.getFeaturedClubs();
        setFeaturedClubs(data);
      } catch (err) {
        console.error('Failed to fetch featured clubs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchClubs();
  }, []);

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden text-white">
        {/* Background visual with Glassmorphism gradient */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-hero opacity-90" />
          <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
          {/* Decorative particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-20 animate-pulse"
              style={{
                width: Math.random() * 4 + 'px',
                height: Math.random() * 4 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Hệ thống Quản lý CLB Sinh viên ICTU 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            Kết nối Đam mê, <br />
            <span className="bg-gradient-to-r from-indigo-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              Kiến tạo Tương lai
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
            Khám phá cộng đồng câu lạc bộ sinh viên sôi động, tham gia sự kiện hấp dẫn và phát triển kỹ năng cùng trợ lý AI thông minh.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-500">
            <Link href="/clubs" className="btn-primary px-8 py-4 rounded-full text-lg font-bold flex items-center gap-2 group w-full sm:w-auto">
              Khám phá CLB <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/ai" className="btn-secondary px-8 py-4 rounded-full text-lg font-bold flex items-center gap-2 w-full sm:w-auto text-text dark:text-white">
              <HiSparkles className="text-primary" /> Thử AI Assistant
            </Link>
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: 'Câu lạc bộ', value: '20+', icon: <HiUsers />, color: 'text-primary' },
            { label: 'Sự kiện', value: '30+', icon: <HiCalendar />, color: 'text-secondary' },
            { label: 'Thành viên', value: '500+', icon: <HiUsers />, color: 'text-accent' },
            { label: 'AI Tools', value: '4+', icon: <HiLightBulb />, color: 'text-info' },
          ].map((stat, i) => (
            <div key={i} className="card-modern p-6 text-center group hover:bg-primary/5 transition-colors">
              <div className={`text-3xl mb-2 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-black text-text dark:text-white">{stat.value}</div>
              <div className="text-xs font-bold text-text-mute uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED CLUBS */}
      <section className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-2">Highlight</span>
            <h2 className="text-4xl font-black text-text dark:text-white">Câu lạc bộ Nổi bật</h2>
          </div>
          <Link href="/clubs" className="hidden md:flex items-center gap-2 text-primary font-bold hover:underline group">
            Xem tất cả <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-gray-200 dark:bg-surface-dark animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredClubs.map((club: any) => (
              <div key={club.id} className="card-modern overflow-hidden group cursor-pointer">
                <div className={`h-32 bg-gradient-to-br from-primary to-secondary p-6 relative overflow-hidden`}>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <div className="text-4xl text-white opacity-50 absolute right-4 top-4 font-black">
                    {club.name.charAt(0)}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                      {club.category}
                    </span>
                    {club.ai_tags && (
                      <span className="px-2 py-1 rounded-full bg-gradient-ai text-white text-[10px] font-bold uppercase">
                        AI Recommended
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-text dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {club.name}
                  </h3>
                  <p className="text-text-mute text-sm line-clamp-2 mb-6">
                    {club.description}
                  </p>
                  <Link href={`/clubs/${club.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all">
                    Xem chi tiết <HiArrowRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-12 text-center md:hidden">
          <Link href="/clubs" className="btn-secondary px-6 py-3 rounded-full text-sm font-bold">
            Xem tất cả câu lạc bộ
          </Link>
        </div>
      </section>

      {/* AI CTA SECTION */}
      <section className="container mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-ai p-8 md:p-16 text-center text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl mx-auto mb-6 animate-bounce">
              🤖
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-6">Trải nghiệm Trợ lý AI Thế hệ mới</h2>
            <p className="text-white/80 text-lg mb-10 leading-relaxed">
              Không còn phải tìm kiếm thủ công. AI của chúng tôi hiểu rõ mọi CLB và sự kiện, sẵn sàng gợi ý lộ trình phát triển phù hợp nhất với bạn.
            </p>
            <Link href="/ai" className="btn-secondary px-10 py-4 rounded-full text-lg font-bold text-text dark:text-white hover:scale-105 transition-transform">
              Thử AI Assistant ngay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
