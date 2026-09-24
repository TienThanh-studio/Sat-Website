// src/components/auth/LoginModal.jsx
import React, { useState } from 'react';
import { X, Lock, Mail } from 'lucide-react';
import { authService } from '../../services/authService';

export default function LoginModal({ isOpen, onClose, onAuthSuccess }) {
  const [email, setEmail] = useState('nguyenan20062000@gmail.com');
  const [password, setPassword] = useState('123456');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = authService.login(email, password);
    if (res.success) {
      onAuthSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Đăng nhập nền tảng</h2>
        <p className="text-xs text-slate-500 mb-6">Chào mừng bạn quay lại ôn luyện kỳ thi.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-brand-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-brand-800"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-bold rounded-xl shadow-md transition"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}