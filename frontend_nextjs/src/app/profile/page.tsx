"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  HiOutlineUserCircle,
  HiOutlineMail,
  HiOutlineAcademicCap,
  HiOutlineSparkles,
  HiOutlinePencil
} from 'react-icons/hi';

const ProfilePage = () => {
  const { user, updateMe } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    faculty: '',
    interests: '',
    skills: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        faculty: user.faculty || '',
        interests: user.interests || '',
        skills: user.skills || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await api.updateMe(formData);
      setIsEditing(false);
    } catch (err) {
      alert('Có lỗi xảy ra khi cập nhật hồ sơ.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <div className="text-center py-20">Vui lòng đăng nhập để xem hồ sơ.</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Side: Profile Card */}
        <div className="md:col-span-1">
          <div className="card-modern p-6 text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-ai text-white text-5xl font-black mx-auto mb-4 shadow-glow flex items-center justify-center border-4 border-white dark:border-white/10">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <h2 className="text-2xl font-bold text-text dark:text-white mb-1">{user.full_name}</h2>
            <p className="text-text-mute text-sm mb-6">{user.role === 'admin' ? '👑 Quản trị viên' : '🎓 Sinh viên'}</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-soft dark:bg-bg-mute text-sm">
                <HiOutlineAcademicCap className="text-primary" />
                <span className="text-text-mute">{user.faculty || 'Chưa cập nhật khoa'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-soft dark:bg-bg-mute text-sm">
                <HiOutlineMail className="text-primary" />
                <span className="text-text-mute truncate">{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form */}
        <div className="md:col-span-2">
          <div className="card-modern p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                <HiOutlineUserCircle /> Thông tin cá nhân
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn-secondary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
              >
                <HiOutlinePencil /> {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-soft uppercase tracking-wider">Họ và Tên</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                  />
                ) : (
                  <p className="p-2 text-text dark:text-white font-medium">{user.full_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-soft uppercase tracking-wider">Khoa/Ngành</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.faculty}
                    onChange={(e) => setFormData({...formData, faculty: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                  />
                ) : (
                  <p className="p-2 text-text dark:text-white font-medium">{user.faculty || 'Chưa cập nhật'}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-text-soft uppercase tracking-wider">Sở thích & Mục tiêu</label>
                {isEditing ? (
                  <textarea
                    value={formData.interests}
                    onChange={(e) => setFormData({...formData, interests: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none h-24 resize-none"
                  />
                ) : (
                  <p className="p-2 text-text-mute leading-relaxed">{user.interests || 'Hãy chia sẻ về sở thích của bạn...'}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-text-soft uppercase tracking-wider">Kỹ năng</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                    placeholder="Ví dụ: React, Python, Thiết kế đồ họa..."
                    className="w-full px-4 py-2 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 py-2">
                    {user.skills?.split(',').map((skill, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {skill.trim()}
                      </span>
                    )) || <span className="text-text-mute text-sm">Chưa cập nhật kỹ năng</span>}
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 rounded-lg text-sm font-bold text-text-mute hover:bg-bg-soft transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="btn-primary px-6 py-2 rounded-lg text-sm font-bold"
                >
                  {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}
          </div>

          {/* Gamification Card */}
          <div className="card-modern p-6 mt-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="flex items-center gap-2 mb-4 text-primary font-bold uppercase text-xs tracking-widest">
              <HiOutlineSparkles /> Thành tích & Điểm thưởng
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-surface dark:bg-surface-dark border border-border-soft dark:border-white/10 text-center">
                <div className="text-2xl font-black text-primary mb-1">1,250</div>
                <div className="text-[10px] uppercase font-bold text-text-mute">Tổng điểm</div>
              </div>
              <div className="p-center p-4 rounded-xl bg-surface dark:bg-surface-dark border border-border-soft dark:border-white/10 text-center">
                <div className="text-2xl font-black text-secondary mb-1">Lv. 4</div>
                <div className="text-[10px] uppercase font-bold text-text-mute">Cấp bậc</div>
              </div>
              <div className="p-4 rounded-xl bg-surface dark:bg-surface-dark border border-border-soft dark:border-white/10 text-center">
                <div className="text-2xl font-black text-accent mb-1">12</div>
                <div className="text-[10px] uppercase font-bold text-text-mute">Huy hiệu</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
