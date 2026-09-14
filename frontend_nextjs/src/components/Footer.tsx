import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-surface-light dark:bg-surface-dark border-t border-border-soft dark:border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap la-12 mb-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-ai text-white flex items-center justify-center text-xl font-bold shadow-md">
                🎓
              </div>
              <span className="text-lg font-extrabold tracking-tight text-text">
                CLB Student Hub
              </span>
            </Link>
            <p className="text-text-mute text-sm leading-relaxed">
              Hệ thống kết nối sinh viên với các câu lạc bộ, sự kiện và cơ hội phát triển bản thân tại ICTU. Tích hợp AI thông minh để cá nhân hóa trải nghiệm.
            </p>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="text-sm font-bold text-text uppercase tracking-widest mb-6 relative after:content-[''] after:absolute after:bottom-[-12px] after:left-0 after:w-8 after:h-0.5 after:bg-gradient-ai">
              Khám phá
            </h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/clubs" className="text-text-mute text-sm hover:text-primary transition-colors">Danh sách CLB</Link></li>
              <li><Link href="/events" className="text-text-mute text-sm hover:text-primary transition-colors">Sự kiện sắp tới</Link></li>
              <li><Link href="/ai" className="text-text-mute text-sm hover:text-primary transition-colors">AI Assistant</Link></li>
              <li><Link href="/calendar" className="text-text-mute text-sm hover:text-primary transition-colors">Lịch hoạt động</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-text uppercase tracking-widest mb-6 relative after:content-[''] after:absolute after:bottom-[-12px] after:left-0 after:w-8 after:h-0.5 after:bg-gradient-ai">
              Hỗ trợ
            </h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/about" className="text-text-mute text-sm hover:text-primary transition-colors">Về chúng tôi</Link></li>
              <li><Link href="/terms" className="text-text-mute text-sm hover:text-primary transition-colors">Điều khoản</Link></li>
              <li><Link href="/privacy" className="text-text-mute text-sm hover:text-primary transition-colors">Bảo mật</Link></li>
              <li><Link href="/contact" className="text-text-mute text-sm hover:text-primary transition-colors">Liên hệ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-text uppercase tracking-widest mb-6 relative after:content-[''] after:absolute after:bottom-[-12px] after:left-0 after:w-8 after:h-0.5 after:bg-gradient-ai">
              Kết nối
            </h4>
            <div className="flex gap-3">
              {['facebook', 'instagram', 'github', 'linkedin'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-bg-soft dark:bg-surface-dark border border-border-soft dark:border-white/10 flex items-center justify-center text-text-mute hover:text-primary hover:border-primary transition-all hover:-translate-y-1"
                >
                  <span className="capitalize text-[10px]">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border-soft dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-text-mute text-xs">
          <p>© 2026 CLB Student Hub. All rights reserved. Built for ICTU Students.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors">Chính sách bảo mật</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
