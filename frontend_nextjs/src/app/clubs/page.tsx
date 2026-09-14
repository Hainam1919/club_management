"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { HiSearch, HiFilter, HiSparkles, HiArrowRight } from 'react-icons/hi';

const ClubsPage = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [clubsData, catsData] = await Promise.all([
          api.getClubs(),
          api.getCategories()
        ]);
        setClubs(clubsData);
        setCategories(['All', ...catsData]);
      } catch (err) {
        console.error('Error fetching clubs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         club.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-2">Explore</span>
          <h1 className="text-4xl font-black text-text dark:text-white">Khám phá Câu lạc bộ</h1>
          <p className="text-text-mute mt-2">Tìm kiếm cộng đồng phù hợp với đam mê của bạn</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute" />
            <input
              type="text"
              placeholder="Tìm CLB, từ khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-full border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none w-full sm:w-64 transition-all"
            />
          </div>
          <button className="btn-primary px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
            <HiSparkles /> Gợi ý cho tôi
          </button>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2 no-scrollbar">
        <div className="p-2 text-text-mute flex items-center gap-2 mr-2 whitespace-nowrap">
          <HiFilter /> <span className="text-sm font-medium">Lọc theo:</span>
        </div>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-gradient-ai text-white shadow-md scale-105'
                : 'bg-surface-light dark:bg-surface-dark text-text-mute border border-border-soft dark:border-white/10 hover:border-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-gray-200 dark:bg-surface-dark animate-pulse" />
          ))}
        </div>
      ) : filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredClubs.map((club: any) => (
            <div key={club.id} className="card-modern overflow-hidden group cursor-pointer" onClick={() => window.location.href = `/clubs/${club.id}`}>
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
                <div className="flex items-center justify-between pt-4 border-t border-border-soft dark:border-white/10">
                  <div className="flex items-center gap-1 text-text-mute text-xs">
                    <span className="font-bold text-primary">{club.member_count || 0}</span> thành viên
                  </div>
                  <span className="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Chi tiết <HiArrowRight />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4 opacity-20">🔍</div>
          <h3 className="text-xl font-bold text-text dark:text-white">Không tìm thấy câu lạc bộ nào</h3>
          <p className="text-text-mute">Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
        </div>
      )}
    </div>
  );
};

export default ClubsPage;
