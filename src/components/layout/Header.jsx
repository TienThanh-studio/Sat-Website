import React from 'react';
import { Bell, User, ShieldCheck } from 'lucide-react';

export default function Header({ currentUser, onOpenLogin, onOpenRegister }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Lời chào & Social Chips */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-slate-900">Welcome back</h1>
          <span className="text-xl">👋</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 uppercase tracking-wider text-[11px]">Join Community</span>
          <a 
            href="https://facebook.com" 
            target="_blank" 
            rel="noreferrer"
            className="px-3 py-1 bg-brand-800 hover:bg-brand-900 text-white rounded-full transition shadow-sm"
          >
            Facebook
          </a>
          <a 
            href="https://threads.net" 
            target="_blank" 
            rel="noreferrer"
            className="px-3 py-1 bg-brand-800 hover:bg-brand-900 text-white rounded-full transition shadow-sm"
          >
            Threads
          </a>
        </div>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-4">
        {currentUser ? (
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-800 font-bold overflow-hidden shadow-sm">
                <span className="text-sm">{currentUser.name.charAt(0)}</span>
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  {currentUser.name}
                  {currentUser.role === 'ADMIN' && (
                    <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  {currentUser.email}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
            >
              Đăng nhập
            </button>
            <button
              onClick={onOpenRegister}
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-800 hover:bg-brand-900 rounded-xl transition shadow-sm"
            >
              Đăng ký bằng mã mời
            </button>
          </div>
        )}
      </div>
    </header>
  );
}