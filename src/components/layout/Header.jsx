import React from 'react';
import { LogOut, Facebook } from 'lucide-react';

export default function Header({ user, onLogout }) {
  const userName = user?.name || user?.email?.split('@')[0] || 'Học viên';
  const userEmail = user?.email || 'meoconhuhong@gmail.com';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 font-sans z-20">
      {/* Lời chào & Nhóm Mạng xã hội */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm md:text-base font-bold text-slate-800 flex items-center gap-2">
          <span>Welcome back</span>
          <span className="text-lg">👋</span>
        </h2>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 ml-4 pl-4 border-l border-slate-200">
          <span className="text-[11px] uppercase font-bold tracking-wider">JOIN COMMUNITY:</span>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <Facebook className="w-3.5 h-3.5 fill-current" />
            <span>Facebook</span>
          </a>
          <a
            href="https://threads.net"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <span>Threads</span>
          </a>
        </div>
      </div>

      {/* Cụm tài khoản bên phải */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs uppercase">
            {userName.charAt(0)}
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold text-slate-800 leading-tight">
              {userName}
            </span>
            <span className="block text-[10px] text-slate-400">
              {userEmail}
            </span>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer ml-2"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}