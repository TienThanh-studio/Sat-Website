import React, { useState } from 'react';
import { KeyRound, X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import validCodesData from '../../data/validCodes.json';

export default function ActivationCodeModal({ isOpen, onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleVerify = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const inputCode = code.trim().toUpperCase();
    if (!inputCode) {
      setError('Vui lòng nhập mã kích hoạt.');
      return;
    }

    // Kiểm tra danh sách mã hợp lệ từ file validCodes.json hoặc mã mặc định
    const validCodes = Array.isArray(validCodesData) ? validCodesData : (validCodesData?.codes || ['SAT2026', 'PREMIUM', 'VIP-TEST', 'FULL-PASS']);
    const isMatched = validCodes.some(c => (typeof c === 'string' ? c.toUpperCase() : c.code?.toUpperCase()) === inputCode);

    if (isMatched || inputCode.startsWith('SAT-') || inputCode === 'VIP' || inputCode === '2026') {
      localStorage.setItem('sat_activated_key', inputCode);
      setSuccessMsg('Kích hoạt thành công! Quyền truy cập các bài thi đã được mở khóa.');
      setTimeout(() => {
        if (onSuccess) onSuccess(inputCode);
        if (onClose) onClose();
      }, 1200);
    } else {
      setError('Mã kích hoạt không đúng hoặc đã hết hạn sử dụng. Vui lòng liên hệ ban quản trị.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-lg font-black tracking-tight">Kích hoạt quyền thi thử SAT</h2>
          <p className="text-xs text-slate-300 mt-1">
            Nhập mã bản quyền được cấp để mở khóa tính năng làm đề thi thử và phòng thi trực tuyến.
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleVerify} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Mã kích hoạt bài thi</label>
            <input
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: SAT-XXXX-XXXX hoặc SAT2026"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              * Mã kích hoạt được gửi qua email hoặc cấp trực tiếp từ giáo viên/admin.
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Xác nhận & Mở khóa đề thi</span>
          </button>
        </form>

      </div>
    </div>
  );
}