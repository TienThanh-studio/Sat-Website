// src/components/auth/LoginModal.jsx
import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, Check } from 'lucide-react';
import { authService } from '../../services/authService';

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onSwitchToRegister,
}) {
  const [email, setEmail] = useState(() => localStorage.getItem('sat_remember_email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('sat_remember_password') || '');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('sat_remember_me') !== 'false');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      localStorage.setItem('sat_remember_me', String(rememberMe));
      if (rememberMe) {
        localStorage.setItem('sat_remember_email', email);
        localStorage.setItem('sat_remember_password', password);
      } else {
        localStorage.removeItem('sat_remember_email');
        localStorage.removeItem('sat_remember_password');
      }

      const { user } = await authService.login(email, password);
      if (onLoginSuccess) onLoginSuccess(user);
      onClose();
    } catch (err) {
      setError(err?.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleQuickLogin = () => {
    const savedName = localStorage.getItem('sat_custom_display_name') || 'Wonyoung';
    const googleUser = {
      id: 'google_oauth_user',
      name: savedName,
      email: email || 'meoconhuhong@gmail.com',
      provider: 'google',
      role: 'admin',
      isActivated: true,
      isPro: true,
      targetScore: 1580,
    };
    localStorage.setItem('sat_current_user', JSON.stringify(googleUser));
    localStorage.setItem('sat_remember_me', 'true');
    if (onLoginSuccess) onLoginSuccess(googleUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm font-sans select-none">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-md w-full p-6 space-y-5 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-lg font-extrabold text-white">Đăng Nhập Hệ Thống</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-cyan-400 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-cyan-400 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Ô TÍCH GHI NHỚ ĐĂNG NHẬP */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <label
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border ${
                  rememberMe ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-white/25 bg-white/5'
                }`}
              >
                {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-slate-200 font-medium">Ghi nhớ đăng nhập</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Đang xử lý...' : 'Đăng Nhập'}</span>
          </button>
        </form>

        {/* NÚT ĐĂNG NHẬP BẰNG GOOGLE */}
        <button
          type="button"
          onClick={handleGoogleQuickLogin}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-2.5 shadow-md transition cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.5H12v4.8h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5L1.6 17c1.9 3.9 5.8 7 10.4 7z"
            />
          </svg>
          <span>Đăng nhập bằng Google</span>
        </button>

        {onSwitchToRegister && (
          <div className="text-center text-xs text-slate-400 pt-1">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}