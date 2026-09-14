"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { HiSparkles, HiArrowLeft } from 'react-icons/hi';

const CreateClubPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Kỹ năng',
    vision: '',
    mission: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAiAnalyze = async () => {
    if (!formData.name || !formData.description) {
      setError('Vui lòng nhập Tên và Mô tả để AI có thể phân tích.');
      return;
    }
    setError('');
    setIsAiAnalyzing(true);

    try {
      const result = await api.analyzeClub({
        name: formData.name,
        description: formData.description
      });

      setFormData(prev => ({
        ...prev,
        summary: result.summary,
        category: result.category,
        // Tags would be handled by the backend or stored in a hidden field if needed
      }));
    } catch (err: any) {
      setError('AI không thể phân tích lúc này. Bạn vui lòng tự nhập thông tin.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.createClub(formData);
      router.push('/clubs');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo câu lạc bộ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/clubs" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <HiArrowLeft className="text-xl" />
        </Link>
        <h1 className="text-3xl font-black text-text dark:text-white">Thành lập Câu lạc bộ</h1>
      </div>

      <div className="card-modern p-8">
        <div className="flex items-center justify-between mb-8">
          <p className="text-text-mute text-sm">Vui lòng điền đầy đủ thông tin để xây dựng cộng đồng của bạn.</p>
          <button
            onClick={handleAiAnalyze}
            disabled={isAiAnalyzing}
            className="btn-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
          >
            <HiSparkles /> {isAiAnalyzing ? 'Đang phân tích...' : 'AI Hỗ trợ soạn thảo'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-soft uppercase tracking-wider">Tên Câu lạc bộ</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ví dụ: CLB Lập trình AI"
                className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-soft uppercase tracking-wider">Danh mục</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                required
              >
                <option value="Học thuật">Học thuật</option>
                <option value="Thể thao">Thể thao</option>
                <option value="Văn nghệ">Văn nghệ</option>
                <option value="Tình nguyện">Tình nguyện</option>
                <option value="Kỹ năng">Kỹ năng</option>
                <option value="Truyền thông">Truyền thông</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-soft uppercase tracking-wider">Mô tả chi tiết</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Hãy kể về mục tiêu, hoạt động chính và đối tượng hướng tới của CLB..."
              className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all h-32 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-soft uppercase tracking-wider">Tầm nhìn</label>
              <input
                type="text"
                name="vision"
                value={formData.vision}
                onChange={handleChange}
                placeholder="CLB sẽ đạt được gì trong 5 năm tới?"
                className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-soft uppercase tracking-wider">Sứ mệnh</label>
              <input
                type="text"
                name="mission"
                value={formData.mission}
                onChange={handleChange}
                placeholder="Giá trị cốt lõi mà CLB mang lại là gì?"
                className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm font-medium border border-danger/20 text-center">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6">
            <Link href="/clubs" className="px-6 py-3 rounded-lg text-sm font-bold text-text-mute hover:bg-bg-soft dark:hover:bg-white/5 transition-all">
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary px-8 py-3 rounded-lg font-bold text-white disabled:opacity-50"
            >
              {isLoading ? 'Đang khởi tạo...' : 'Xác nhận tạo CLB'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClubPage;
