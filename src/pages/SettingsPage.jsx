// src/pages/SettingsPage.jsx
import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Settings,
  Trash2,
  Database,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { storageService } from '../services/storageService';

export default function SettingsPage() {
  const [settings, setSettings] = useState(() =>
    storageService.getUserSettings()
  );
  const [syncKey, setSyncKey] = useState(
    () => localStorage.getItem('sat_cloud_sync_key') || 'tienthanh-sat-1550'
  );
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  const fileInputRef = useRef(null);

  const completedCount = storageService.getCompletedQuestionIds().length;
  const vocabCount = Object.keys(storageService.getVocabProgress() || {}).length;
  const examCount = storageService.getExamHistory().length;
  const mistakeCount = storageService.getMistakes().length;

  const showToast = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    storageService.saveUserSettings(settings);
    localStorage.setItem('sat_cloud_sync_key', syncKey);
    showToast('success', 'Đã lưu cấu hình cá nhân thành công!');
  };

  const handleExportJson = () => {
    try {
      storageService.downloadBackupJson();
      showToast(
        'success',
        'Đã tải xuống file sao lưu (.json) chứa toàn bộ tiến độ câu đã làm, từ vựng SRS và lịch sử thi!'
      );
    } catch (err) {
      showToast('error', err.message || 'Lỗi khi xuất file sao lưu.');
    }
  };

  const handleImportJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        storageService.importDataPayload(parsed, true);
        showToast(
          'success',
          'Khôi phục tiến độ thành công! Toàn bộ câu hỏi đã làm và lịch trình từ vựng SRS đã được cập nhật.'
        );
      } catch (err) {
        showToast('error', 'File JSON không hợp lệ hoặc bị hỏng: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCloudUpload = async () => {
    setIsLoadingCloud(true);
    try {
      localStorage.setItem('sat_cloud_sync_key', syncKey);
      await storageService.syncToSupabaseCloud(syncKey);
      showToast(
        'success',
        `Đã đồng bộ toàn bộ dữ liệu lên Supabase Cloud với mã "${syncKey}"!`
      );
    } catch (err) {
      showToast(
        'error',
        `Lưu ý Cloud: ${err.message}. Bạn có thể dùng nút "Xuất File JSON" bên cạnh để sao lưu an toàn 100% về máy!`
      );
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleCloudRestore = async () => {
    setIsLoadingCloud(true);
    try {
      localStorage.setItem('sat_cloud_sync_key', syncKey);
      const updatedAt = await storageService.restoreFromSupabaseCloud(syncKey);
      showToast(
        'success',
        `Đã tải tiến độ từ Cloud (bản lưu lúc ${new Date(
          updatedAt
        ).toLocaleString()})!`
      );
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-7 select-none font-sans text-slate-100">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0d152e] via-[#152046] to-[#0d152e] border border-indigo-500/30 p-6 lg:p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              Cài Đặt Hệ Thống & Sao Lưu Tiến Độ (Backup & Cloud Sync)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Bảo vệ 100% dữ liệu câu hỏi đã làm, chu kỳ nhớ từ vựng Spaced
              Repetition (SM-2) và sổ tay câu sai của bạn.
            </p>
          </div>
        </div>

        {/* Thống kê dữ liệu đang lưu trong máy */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-slate-900/75 rounded-2xl p-3.5 border border-white/5">
            <div className="text-[11px] text-slate-400 font-bold">
              Câu hỏi Đã làm
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
              {completedCount} câu
            </div>
          </div>
          <div className="bg-slate-900/75 rounded-2xl p-3.5 border border-white/5">
            <div className="text-[11px] text-slate-400 font-bold">
              Từ vựng có lịch SRS
            </div>
            <div className="text-xl font-black text-cyan-300 font-mono mt-0.5">
              {vocabCount} từ
            </div>
          </div>
          <div className="bg-slate-900/75 rounded-2xl p-3.5 border border-white/5">
            <div className="text-[11px] text-slate-400 font-bold">
              Đề thi đã hoàn thành
            </div>
            <div className="text-xl font-black text-indigo-300 font-mono mt-0.5">
              {examCount} đề
            </div>
          </div>
          <div className="bg-slate-900/75 rounded-2xl p-3.5 border border-white/5">
            <div className="text-[11px] text-slate-400 font-bold">
              Sổ tay câu sai
            </div>
            <div className="text-xl font-black text-rose-400 font-mono mt-0.5">
              {mistakeCount} câu
            </div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm font-bold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-400/50 text-emerald-200'
              : 'bg-rose-950/60 border-rose-400/50 text-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KHỐI 1: SAO LƯU & KHÔI PHỤC FILE JSON (1-CLICK LOCAL BACKUP) */}
        <div className="bg-[#0c1224] border border-indigo-500/25 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-extrabold text-white">
              Sao lưu & Khôi phục bằng File (.JSON)
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tải toàn bộ tiến độ học tập của bạn về máy tính dưới dạng một file{' '}
            <code>.json</code>. Khi đổi trình duyệt, cài lại máy hoặc chuyển
            sang laptop khác, chỉ cần tải file này lên để khôi phục 100% dữ
            liệu.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition"
            >
              <Download className="w-4 h-4" />
              <span>Xuất File Backup (.JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-cyan-400/40 text-cyan-300 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Upload className="w-4 h-4" />
              <span>Nhập File Backup (.JSON)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
          </div>
        </div>

        {/* KHỐI 2: ĐỒNG BỘ ĐÁM MÂY SUPABASE */}
        <div className="bg-[#0c1224] border border-indigo-500/25 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-extrabold text-white">
              Đồng bộ Đám mây (Supabase Cloud Sync)
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sử dụng Mã đồng bộ cá nhân (Sync Key) để đẩy tiến độ lên Supabase
            hoặc kéo tiến độ về từ bất kỳ thiết bị nào.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Mã đồng bộ cá nhân (Sync Key):
              </label>
              <input
                type="text"
                value={syncKey}
                onChange={(e) => setSyncKey(e.target.value)}
                placeholder="VD: tienthanh-sat-1550"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoadingCloud}
                onClick={handleCloudUpload}
                className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingCloud ? 'animate-spin' : ''}`}
                />
                <span>Đẩy lên Cloud</span>
              </button>

              <button
                type="button"
                disabled={isLoadingCloud}
                onClick={handleCloudRestore}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-indigo-400/40 text-indigo-200 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Cloud className="w-4 h-4" />
                <span>Tải từ Cloud về</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI 3: CẤU HÌNH MỤC TIÊU CÁ NHÂN */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-[#0c1224] border border-indigo-500/25 rounded-3xl p-6 space-y-4 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-extrabold text-white">
            Hồ Sơ Thí Sinh & Mục Tiêu Điểm Số
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Họ và tên hiển thị trên thanh Footer Bluebook:
            </label>
            <input
              type="text"
              value={settings.studentName || 'Phan Tiến Thành'}
              onChange={(e) =>
                setSettings({ ...settings, studentName: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Mục tiêu điểm Digital SAT (Target Score):
            </label>
            <input
              type="number"
              min="400"
              max="1600"
              step="10"
              value={settings.targetScore || 1550}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  targetScore: Number(e.target.value),
                })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-amber-300 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer transition"
          >
            Lưu thiết lập
          </button>
        </div>
      </form>
    </div>
  );
}