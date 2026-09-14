"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    faculty: '',
    interests: '',
    skills: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await api.register(formData);
      setAuth(data.user, data.access_token);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 bg-bg-soft dark:bg-bg-mute">
      <div className="w-full max-w-2xl bg-surface dark:bg-surface-dark p-8 rounded-2xl shadow-xl border border-border-soft dark:border-white/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-ai text-white flex items-center justify-center text-3xl mx-auto mb-4 shadow-glow">
            🚀
          </div>
          <h1 className="text-3xl font-extrabold text-text dark:text-white mb-2">Tham gia cùng chúng tôi!</h1>
          <p className="text-text-mute text-sm">Tạo tài khoản để kết nối với các câu lạc bộ sinh viên</p>
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-soft uppercase tracking-wider mb-2">Tên đăng nhập</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Ví dụ: nam123"
                className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-soft uppercase tracking-wider mb-2">Mật khẩu</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-soft uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@ictu.edu.vn"
                className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-soft uppercase tracking-wider mb-2">Họ và Tên</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-soft uppercase tracking-wider mb-2">Khoa/Ngành</label>
              <input
                type="text"
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                placeholder="Công nghệ thông tin"
                className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-soft uppercase tracking-wider mb-2">Sở thích / Kỹ năng</label>
              <textarea
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                placeholder="Ví dụ: Lập trình Python, chơi Guitar, tình nguyện..."
                className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all h-24 resize-none"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            {error && (
              <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm font-medium border border-danger/20 mb-5 text-center">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-4 rounded-lg font-bold text-white text-lg disabled:opacity-50 shadow-lg"
            >
              {isLoading ? 'Đang khởi tạo tài khoản...' : 'Đăng ký tài khoản'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-text-mute">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
