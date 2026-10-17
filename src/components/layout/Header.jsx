// src/components/layout/Header.jsx
import React, { useState, useEffect } from 'react';
import {
  LogOut,
  LogIn,
  UserPlus,
  Key,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Edit3,
  Check,
} from 'lucide-react';
import { authService } from '../../services/authService';

function getCleanDisplayName(user, customName) {
  if (customName && customName.trim()) return customName.trim();
  const rawName = String(user?.name || '').trim();
  const emailPrefix = String(user?.email || '').split('@')[0].toLowerCase();

  if (!rawName || rawName.toLowerCase() === emailPrefix) {
    if (emailPrefix.includes('.') || emailPrefix.includes('_') || emailPrefix.includes('-')) {
      return emailPrefix
        .split(/[._-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return `Capt. ${emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)}`;
  }
  return rawName;
}

export default function Header({
  currentUser,
  onOpenLogin,
  onOpenRegister,
  onOpenActivation,
  onLogout,
}) {
  const [customName, setCustomName] = useState(() => {
    return localStorage.getItem('sat_custom_display_name') || '';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Đồng hồ đếm ngược 25 phút
  const [pomoSeconds, setPomoSeconds] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);

  useEffect(() => {
    if (!pomoRunning) return;
    const interval = setInterval(() => {
      setPomoSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [pomoRunning]);

  const formatPomo = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayName = getCleanDisplayName(currentUser, customName);
  const userEmail = currentUser?.email || 'astronaut@sat.space';
  const avatarLetter = displayName.replace(/^Capt\.\s*/i, '').charAt(0).toUpperCase() || 'S';

  const handleSaveName = (e) => {
    e?.preventDefault();
    const cleaned = nameInput.trim();
    if (cleaned) {
      setCustomName(cleaned);
      localStorage.setItem('sat_custom_display_name', cleaned);
      if (authService?.updateProfile) {
        authService.updateProfile({ name: cleaned });
      }
    }
    setIsEditingName(false);
  };

  return (
    <header className="h-16 px-6 bg-[#070B14]/95 backdrop-blur-xl border-b border-indigo-500/20 flex items-center justify-between shrink-0 z-20 select-none text-slate-100 relative">
      {/* Viền sáng mảnh trên đỉnh */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

      {/* 1. BÊN TRÁI: CHỈ GIỮ LẠI WELCOME BACK GỌN GÀNG */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-sm shrink-0">
          👋
        </span>
        <span className="font-extrabold text-sm sm:text-base text-white tracking-tight whitespace-nowrap">
          Welcome back, Commander
        </span>
      </div>

      {/* 2. Ở GIỮA: ĐỒNG HỒ ĐẾM GIỜ */}
      <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
        <Timer
          className={`w-3.5 h-3.5 ${pomoRunning ? 'text-cyan-400 animate-spin' : 'text-slate-400'}`}
          style={{ animationDuration: '8s' }}
        />
        <span className="font-mono text-xs sm:text-sm font-extrabold text-cyan-300 tracking-wider">
          {formatPomo(pomoSeconds)}
        </span>
        <button
          type="button"
          onClick={() => setPomoRunning(!pomoRunning)}
          className="p-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 transition cursor-pointer"
          title={pomoRunning ? 'Tạm dừng' : 'Bắt đầu đếm giờ'}
        >
          {pomoRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setPomoRunning(false);
            setPomoSeconds(25 * 60);
          }}
          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          title="Đặt lại 25:00"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* 3. BÊN PHẢI: THÔNG TIN TÀI KHOẢN */}
      <div className="flex items-center gap-2.5">
        {currentUser ? (
          <div className="flex items-center gap-2.5">
            {!currentUser.isActivated && onOpenActivation && (
              <button
                type="button"
                onClick={onOpenActivation}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Kích hoạt VIP</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-cyan-400/30 transition">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                {avatarLetter}
              </div>

              <div className="leading-tight">
                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Nhập tên..."
                      className="w-28 px-2 py-0.5 rounded bg-slate-950 border border-cyan-400 text-xs text-white outline-none"
                    />
                    <button
                      type="submit"
                      className="p-0.5 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <span className="font-extrabold text-xs text-white tracking-wide whitespace-nowrap">
                      {displayName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(displayName.replace(/^Capt\.\s*/i, ''));
                        setIsEditingName(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                      title="Đổi tên hiển thị"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="text-[10px] font-mono text-cyan-300/80 truncate max-w-[140px]">
                  {userEmail}
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Đăng ký</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}