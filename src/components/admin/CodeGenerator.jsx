import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { KeyRound, Plus, Shield } from 'lucide-react';

export default function CodeGenerator() {
  const [codes, setCodes] = useState(authService.getInviteCodes());
  const [newCode, setNewCode] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [maxUses, setMaxUses] = useState(10);
  const [msg, setMsg] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const res = authService.createInviteCode({ code: newCode, role, maxUses });
    if (res.success) {
      setCodes([...codes, res.code]);
      setNewCode('');
      setMsg('Tạo mã mời thành công!');
      setTimeout(() => setMsg(''), 3000);
    } else {
      setMsg(res.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
        <KeyRound className="w-5 h-5 text-amber-600" />
        <span>Quản lý & Tạo mã mời đăng ký (Invite Code Generator)</span>
      </div>
      <p className="text-xs text-slate-500 mb-6">Mã mời dùng để cấp quyền học viên (STUDENT) hoặc cấp quyền đồng quản trị (ADMIN).</p>

      {msg && (
        <div className="p-3 mb-4 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
          {msg}
        </div>
      )}

      {/* Form tạo mã */}
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <input
          type="text"
          placeholder="Mã mời (VD: SAT2026-PRO)"
          value={newCode}
          onChange={e => setNewCode(e.target.value)}
          className="uppercase font-mono font-bold text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-800"
          required
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold"
        >
          <option value="STUDENT">Quyền STUDENT</option>
          <option value="ADMIN">Quyền ADMIN</option>
        </select>
        <input
          type="number"
          min="1"
          placeholder="Số lượt tối đa"
          value={maxUses}
          onChange={e => setMaxUses(e.target.value)}
          className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold"
        />
        <button
          type="submit"
          className="bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mã mới</span>
        </button>
      </form>

      {/* Danh sách các mã hiện có */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
              <th className="py-2.5">Mã mời</th>
              <th className="py-2.5">Quyền hạn (Role)</th>
              <th className="py-2.5">Đã dùng / Giới hạn</th>
              <th className="py-2.5">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {codes.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="py-2.5 font-mono font-bold text-brand-800">{c.code}</td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.role}
                  </span>
                </td>
                <td className="py-2.5">{c.usedCount} / {c.maxUses}</td>
                <td className="py-2.5 text-slate-400">{c.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}