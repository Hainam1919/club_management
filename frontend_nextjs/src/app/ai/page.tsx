"use client";

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import {
  HiOutlineChatAlt2,
  HiOutlineSparkles,
  HiOutlineChartBar,
  HiOutlineEmojiHappy,
  HiOutlineDocumentText,
  HiOutlinePaperAirplane,
  HiOutlineX
} from 'react-icons/hi';

const AIPage = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', message: 'Chào bạn! Tôi là trợ lý AI của Student Hub. Tôi có thể giúp bạn tìm CLB, phân tích xu hướng hoặc đơn giản là trò chuyện. Bạn cần tôi giúp gì hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', message: userMsg }]);
    setIsLoading(true);

    try {
      const response = await api.chatWithAi({
        message: userMsg,
        context: 'general'
      });
      setMessages(prev => [...prev, { role: 'ai', message: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', message: 'Xin lỗi, tôi gặp một chút sự cố. Bạn hãy thử lại sau nhé!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* AI Tool Palette */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-modern p-6">
            <div className="flex items-center gap-2 mb-6 text-primary font-bold uppercase text-xs tracking-widest">
              <HiOutlineSparkles /> AI Studio Pro
            </div>
            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary font-bold text-sm transition-all hover:bg-primary/20">
                <HiOutlineChatAlt2 /> Smart Chat
              </button>
              <button className="flex items-center gap-3 p-3 rounded-xl bg-bg-soft dark:bg-bg-mute text-text-mute hover:text-primary transition-all text-sm font-medium">
                <HiOutlineChartBar /> Predictive Insights
              </button>
              <button className="flex items-center gap-3 p-3 rounded-xl bg-bg-soft dark:bg-bg-mute text-text-mute hover:text-primary transition-all text-sm font-medium">
                <HiOutlineEmojiHappy /> Sentiment Analysis
              </button>
              <button className="flex items-center gap-3 p-3 rounded-xl bg-bg-soft dark:bg-bg-mute text-text-mute hover:text-primary transition-all text-sm font-medium">
                <HiOutlineDocumentText /> Auto-Report
              </button>
            </div>
          </div>

          <div className="card-modern p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <h4 className="font-bold text-sm mb-2">AI Tip of the day</h4>
            <p className="text-xs text-text-mute leading-relaxed">
              Hãy thử hỏi tôi: "Tôi thích vẽ và âm nhạc, hãy gợi ý cho tôi 3 CLB phù hợp nhất tại ICTU"
            </p>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3 flex flex-col h-[70vh] card-modern overflow-hidden relative">
          {/* Chat Header */}
          <div className="p-4 border-b border-border-soft dark:border-white/10 flex items-center justify-between bg-surface-light dark:bg-surface-dark">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-ai text-white flex items-center justify-center shadow-glow">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Assistant</h3>
                <span className="text-[10px] text-success flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Online | Powered by Hybrid LLM
                </span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg-soft/50 dark:bg-bg-mute/50"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-ai text-white rounded-tr-none'
                    : 'bg-surface dark:bg-surface-dark text-text dark:text-white rounded-tl-none border border-border-soft dark:border-white/10'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-surface dark:bg-surface-dark p-4 rounded-2xl rounded-tl-none border border-border-soft dark:border-white/10">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-text-mute rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-text-mute rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-text-mute rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-surface dark:bg-surface-dark border-t border-border-soft dark:border-white/10">
            <div className="flex items-center gap-3 bg-bg-soft dark:bg-bg-mute p-2 rounded-full border border-border-soft dark:border-white/10 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi bất cứ điều gì về CLB..."
                className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-text dark:text-white"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 rounded-full bg-gradient-ai text-white shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                <HiOutlinePaperAirplane />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIPage;
