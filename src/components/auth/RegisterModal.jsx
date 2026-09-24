// src/components/auth/RegisterModal.jsx
import React, { useState } from 'react';
import { X, KeyRound, User, Mail, Lock } from 'lucide-react';
import { authService } from '../../services/authService';

export default function RegisterModal({ isOpen, onClose, onAuthSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    const res = authService.register({ name, email, password, inviteCode });
    if (res.success) {
      onAuthSuccess(res.user);
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Đăng ký thành viên</h2>
        <p className="text-xs text-slate-500 mb-4">Hệ thống áp dụng chính sách mã mời độc quyền từ Quản trị viên.</p>

        {error && (
          <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mã mời (Admin Invite Code) *</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-brand-800" />
              <input
                type="text"
                required
                placeholder="VD: VA-ADMIN-2026 hoặc SAT-VIP-8888"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border-2 border-brand-800/40 bg-brand-50/30 rounded-xl uppercase font-mono font-bold text-brand-900 focus:outline-none focus:border-brand-800"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Thử: <b>VA-ADMIN-2026</b> (Admin) hoặc <b>SAT-VIP-8888</b> (Student)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-brand-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="email@example.com"
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
            className="w-full mt-2 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-bold rounded-xl shadow-md transition"
          >
            Xác nhận tạo tài khoản
          </button>
        </form>
      </div>
    </div>
  );
}