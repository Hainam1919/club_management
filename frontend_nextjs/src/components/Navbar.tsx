"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineChatAlt2,
  HiOutlineUserCircle,
  HiMenu,
  HiX
} from 'react-icons/hi';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Trang chủ', href: '/', icon: <HiOutlineHome /> },
    { name: 'Câu lạc bộ', href: '/clubs', icon: <HiOutlineUsers /> },
    { name: 'Sự kiện', href: '/events', icon: <HiOutlineCalendar /> },
    { name: 'AI Assistant', href: '/ai', icon: <HiOutlineChatAlt2 />, badge: 'AI' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'py-2 shadow-md' : 'py-4'
    } ${isAuthenticated ? 'glass' : 'bg-white/80 backdrop-blur-md border-b border-gray-200'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">

        {/* Logo removed as per user request to avoid overlapping */}
        <div className="flex items-center" />

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-soft hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
            >
              {link.icon}
              <span>{link.name}</span>
              {link.badge && (
                <span className="text-[8px] bg-gradient-ai text-white px-1.5 py-0.5 rounded-full font-bold uppercase">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}

          <div className="h-6 w-px bg-gray-200 mx-2" />

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-all">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-text">{user?.full_name}</span>
              </Link>
              <button
                onClick={logout}
                className="p-2 text-text-mute hover:text-danger transition-colors"
                title="Đăng xuất"
              >
                <HiOutlineUserCircle className="text-xl" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-text-soft hover:text-primary transition-colors">
                Đăng nhập
              </Link>
              <Link href="/register" className="btn-primary px-5 py-2 rounded-full text-sm font-bold">
                Tham gia ngay
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-text"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <HiX className="text-2xl" /> : <HiMenu className="text-2xl" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 p-4 flex flex-col gap-2 shadow-xl animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 text-text-soft hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
          <div className="h-px bg-gray-100 my-2" />
          {isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <Link href="/profile" className="flex items-center gap-3 p-3 text-text-soft hover:bg-gray-100 rounded-lg">
                <HiOutlineUserCircle className="text-xl" />
                <span>Hồ sơ cá nhân</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-3 p-3 text-danger hover:bg-danger/10 rounded-lg text-left"
              >
                <HiOutlineUserCircle className="text-xl" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/login" className="p-3 text-center text-text-soft hover:bg-gray-100 rounded-lg">
                Đăng nhập
              </Link>
              <Link href="/register" className="btn-primary text-center p-3 rounded-lg font-bold">
                Tham gia ngay
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
