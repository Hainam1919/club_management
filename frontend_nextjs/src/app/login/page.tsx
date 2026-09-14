"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await api.login({ username, password });
      setAuth(data.user, data.access_token);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 bg-bg-soft dark:bg-bg-mute">
      <div className="w-full max-w-md bg-surface dark:bg-surface-dark p-8 rounded-2xl shadow-xl border border-border-soft dark:border-white/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-ai text-white flex items-center justify-center text-3xl mx-auto mb-4 shadow-glow">
            🎓
          </div>
          <h1 className="text-3xl font-extrabold text-text dark:text-white mb-2">Chào mừng trở lại!</h1>
          <p className="text-text-mute text-sm">Đăng nhập để tiếp tục hành trình khám phá</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-text-soft uppercase tracking-wider mb-2">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ví dụ: admin hoặc sv001"
              className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-soft uppercase tracking-wider mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-border dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm font-medium border border-danger/20 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 rounded-lg font-bold text-white disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-text-mute">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Đăng ký ngay
          </Link>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-bg-soft dark:bg-bg-mute border border-border-soft dark:border-white/5 text-xs text-text-mute italic">
          <strong>Demo:</strong> admin/admin123 hoặc sv001/sv123456
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
