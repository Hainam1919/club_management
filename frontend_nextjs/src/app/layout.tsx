import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "CLB Student Hub | Hệ thống Quản lý Câu lạc bộ Sinh viên",
  description: "Kết nối sinh viên với các câu lạc bộ, sự kiện và cơ hội phát triển bản thân tại ICTU tích hợp AI thông minh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark text-text transition-colors duration-300">
        <Navbar />
        <main className="flex-grow pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
