import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, Trash2, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';

export function CodeGenerator() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [genCount, setGenCount] = useState(1);
  const [genTier, setGenTier] = useState('premium');
  const [genDays, setGenDays] = useState(90);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchCodes = async () => {
    try {
      const data = await authService.getInviteCodes();
      setCodes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Không thể lấy danh sách mã trực tuyến:', err.message);
      setCodes([]);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const newItems = await authService.generateInviteCodes(
        Number(genCount),
        genTier,
        Number(genDays)
      );
      setCodes(Array.isArray(newItems) ? newItems : []);
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi khi tạo mã');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const updated = await authService.deleteInviteCode(id);
      setCodes(Array.isArray(updated) ? updated : codes.filter(c => c.id !== id && c.code !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const safeCodes = Array.isArray(codes) ? codes : [];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            Sinh mã kích hoạt bản quyền (Admin License Generator)
          </h2>
          <p className="text-xs text-slate-400 mt-1">Tạo mã hàng loạt để cấp quyền truy cập cho học viên.</p>
        </div>
        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold font-mono">
          Tổng số: {safeCodes.length} mã
        </span>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl text-xs bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form sinh mã */}
      <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Số lượng mã</label>
          <input
            type="number"
            min="1"
            max="50"
            value={genCount}
            onChange={(e) => setGenCount(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Gói bản quyền</label>
          <select
            value={genTier}
            onChange={(e) => setGenTier(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="premium">Premium Full</option>
            <option value="pro">Pro Edition</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Thời hạn (Ngày)</label>
          <input
            type="number"
            min="1"
            value={genDays}
            onChange={(e) => setGenDays(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{loading ? 'Đang tạo...' : 'Tạo mã mới'}</span>
          </button>
        </div>
      </form>

      {/* Danh sách mã đã sinh */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3">Mã kích hoạt</th>
              <th className="py-2.5 px-3">Gói</th>
              <th className="py-2.5 px-3">Thời hạn</th>
              <th className="py-2.5 px-3">Trạng thái</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {safeCodes.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">
                  Chưa có mã nào được sinh ra. Bấm nút "Tạo mã mới" ở trên để cấp mã.
                </td>
              </tr>
            ) : (
              safeCodes.map((item) => (
                <tr key={item.id || item.code} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {item.code}
                  </td>
                  <td className="py-3 px-3 font-semibold uppercase text-blue-600">
                    {item.tier || 'PREMIUM'}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {item.days_valid || item.duration_days || 90} ngày
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.is_used || item.used_by
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {item.is_used || item.used_by ? 'Đã sử dụng' : 'Khả dụng'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1">
                    <button
                      onClick={() => handleCopy(item.code, item.id || item.code)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition inline-flex items-center"
                      title="Copy mã"
                    >
                      {copiedId === (item.id || item.code) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id || item.code)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition inline-flex items-center"
                      title="Xóa mã"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CodeGenerator;