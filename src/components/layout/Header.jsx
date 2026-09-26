import React from 'react';
import { Bell, ExternalLink } from 'lucide-react';

export default function Header({ currentUser, onOpenLogin, onOpenRegister }) {
  const user = currentUser || JSON.parse(localStorage.getItem('sat_user') || '{}');
  const displayName = user.name || 'nguyenan20062000';
  const displayEmail = user.email || 'nguyenan20062000@gmail.com';
  const avatar = user.avatar;

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-base font-bold text-slate-800">Welcome back</span>
        <span className="text-lg">👋</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Cộng đồng */}
        <div className="hidden sm:flex items-center gap-2 border-r border-slate-200 pr-4">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">JOIN COMMUNITY</span>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-red-800 text-white rounded-md text-[11px] font-semibold hover:bg-red-900 transition flex items-center gap-1"
          >
            <span>Facebook</span>
          </a>
          <a
            href="https://threads.net"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-neutral-900 text-white rounded-md text-[11px] font-semibold hover:bg-neutral-800 transition flex items-center gap-1"
          >
            <span>Threads</span>
          </a>
        </div>

        {/* Thông báo */}
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Thông tin tài khoản */}
        <div className="flex items-center gap-3 pl-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-bold text-slate-800 leading-tight">
              {displayName}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium leading-tight">
              {displayEmail}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}