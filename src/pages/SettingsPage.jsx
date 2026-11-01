// src/pages/SettingsPage.jsx
import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Settings,
  Database,
  ShieldCheck,
  RefreshCw,
  GitMerge,
  FileJson,
  Sparkles,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import BackupModal from '../components/common/BackupModal';

export default function SettingsPage() {
  const [settings, setSettings] = useState(() =>
    storageService.getUserSettings()
  );
  const [syncKey, setSyncKey] = useState(
    () => localStorage.getItem('sat_cloud_sync_key') || 'tienthanh-sat-1550'
  );
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // State cho Khung kéo thả (Dropzone) & Hộp thoại xác nhận Khôi phục
  const [isDragging, setIsDragging] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(null); // { rawJson, fileName, summary }
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [statsTick, setStatsTick] = useState(0);

  const fileInputRef = useRef(null);

  // Đọc thống kê thời gian thực (tự động cập nhật ngay khi khôi phục mà không cần F5)
  const completedCount = storageService.getCompletedQuestionIds().length;
  const mistakeCount = storageService.getMistakes().length;
  const vocabCount = Object.keys(storageService.getVocabProgress() || {}).length;
  const examCount = storageService.getExamHistory().length;

  const showToast = (type, text) => {
    setStatusMsg({ type, text: String(text || '').normalize('NFC') });
    setTimeout(() => setStatusMsg(null), 6000);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    storageService.saveUserSettings(settings);
    localStorage.setItem('sat_cloud_sync_key', syncKey);
    setStatsTick((t) => t + 1);
    showToast('success', 'Đã lưu cấu hình cá nhân thành công!');
  };

  // Xuất tệp sao lưu 1-Click
  const handleExportJson = () => {
    try {
      const info = storageService.exportBackupData();
      showToast(
        'success',
        `Đã tải xuống tệp "${info.filename}" chứa ${info.completedCount} câu đã làm, ${info.vocabCount} từ vựng SRS, ${info.mistakeCount} câu sai và ${info.examCount} bài thi!`
      );
    } catch (err) {
      showToast('error', err?.message || 'Lỗi khi xuất tệp sao lưu.');
    }
  };

  // Kiểm tra file JSON khi người dùng kéo thả hoặc bấm chọn file
  const handleInspectFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setPendingRestore(null);
      showToast(
        'error',
        'Cảnh báo: Tệp tải lên không đúng định dạng .json. Vui lòng chọn tệp sao lưu hợp lệ!'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawJson = String(event.target?.result || '');
      const check = storageService.inspectBackupPayload(rawJson);

      if (!check.valid) {
        setPendingRestore(null);
        showToast('error', check.error);
        return;
      }

      setStatusMsg(null);
      setPendingRestore({
        rawJson,
        fileName: file.name,
        summary: check.summary,
      });
    };
    reader.onerror = () => {
      showToast('error', 'Không thể đọc tệp vừa chọn. Vui lòng thử lại!');
    };
    reader.readAsText(file);
  };

  // Thực thi khôi phục sau khi người dùng chọn Gộp thêm (Merge) hoặc Ghi đè (Overwrite)
  const handleConfirmRestore = (mode = 'merge') => {
    if (!pendingRestore?.rawJson) return;
    try {
      const result = storageService.validateAndRestoreBackup(
        pendingRestore.rawJson,
        mode
      );
      setPendingRestore(null);
      setSettings(storageService.getUserSettings());
      setStatsTick((t) => t + 1);

      showToast(
        'success',
        mode === 'merge'
          ? `Khôi phục (Gộp dữ liệu) thành công! Hệ thống đã cập nhật ${result.completedCount} câu hỏi, ${result.vocabCount} từ vựng, ${result.mistakeCount} câu sai và ${result.examCount} bài thi mà không cần tải lại trang.`
          : `Khôi phục (Ghi đè sạch) thành công! Hệ thống đã nạp ${result.completedCount} câu hỏi, ${result.vocabCount} từ vựng, ${result.mistakeCount} câu sai và ${result.examCount} bài thi mới.`
      );
    } catch (err) {
      showToast(
        'error',
        err?.message || 'Khôi phục thất bại: Tệp JSON không hợp lệ.'
      );
    }
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
        `Lưu ý Cloud: ${err.message}. Bạn có thể dùng nút "📥 Xuất Tệp Sao Lưu (.json)" bên cạnh để sao lưu an toàn 100% về máy!`
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
      setSettings(storageService.getUserSettings());
      setStatsTick((t) => t + 1);
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
    <div
      key={statsTick}
      className="p-6 lg:p-8 max-w-5xl mx-auto space-y-7 select-none font-sans text-slate-100"
    >
      {/* HEADER & THẺ THỐNG KÊ THỜI GIAN THỰC */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0d152e] via-[#152046] to-[#0d152e] border border-indigo-500/30 p-6 lg:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {'Quản Lý Dữ Liệu Cá Nhân & Sao Lưu 1-Click'.normalize('NFC')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {'Bảo vệ 100% lịch sử làm bài, Sổ tay câu sai 2-Strike và tiến độ từ vựng Spaced Repetition (SM-2).'.normalize(
                  'NFC'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBackupModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-extrabold flex items-center gap-2 cursor-pointer transition self-start sm:self-auto shrink-0"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>{'Mở Hộp Thoại Safe Backup'.normalize('NFC')}</span>
          </button>
        </div>

        {/* 4 Thẻ Thống Kê Thời Gian Thực */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-emerald-400/25">
            <div className="text-[11px] text-slate-400 font-bold">
              {'Câu đã làm'.normalize('NFC')}
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums mt-0.5">
              {completedCount}{' '}
              <span className="text-xs font-bold text-slate-400">
                {'câu'.normalize('NFC')}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-4 border border-rose-400/25">
            <div className="text-[11px] text-slate-400 font-bold">
              {'Câu trong Sổ sai'.normalize('NFC')}
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono tabular-nums mt-0.5">
              {mistakeCount}{' '}
              <span className="text-xs font-bold text-slate-400">
                {'câu'.normalize('NFC')}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-4 border border-cyan-400/25">
            <div className="text-[11px] text-slate-400 font-bold">
              {'Từ vựng đã thuộc'.normalize('NFC')}
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono tabular-nums mt-0.5">
              {vocabCount}{' '}
              <span className="text-xs font-bold text-slate-400">
                {'từ'.normalize('NFC')}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-4 border border-indigo-400/25">
            <div className="text-[11px] text-slate-400 font-bold">
              {'Bài thi thử đã nộp'.normalize('NFC')}
            </div>
            <div className="text-2xl font-black text-indigo-300 font-mono tabular-nums mt-0.5">
              {examCount}{' '}
              <span className="text-xs font-bold text-slate-400">
                {'đề'.normalize('NFC')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST THÔNG BÁO TRẠNG THÁI (XANH LÁ RỰC RỠ KHI THÀNH CÔNG / ĐỎ KHI CẢNH BÁO) */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm font-bold transition-all ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-400/70 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
              : 'bg-rose-950/80 border-rose-400/70 text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KHỐI 1: QUẢN LÝ & SAO LƯU DỮ LIỆU HỌC TẬP (1-CLICK BACKUP & RESTORE) */}
        <div className="lg:col-span-7 bg-[#0c1224] border border-indigo-500/25 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-extrabold text-white">
                {'Quản lý & Sao lưu Dữ liệu Học tập'.normalize('NFC')}
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold">
              v2.0 Checksum
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {'Tải toàn bộ tiến độ học tập về máy dưới định dạng chuẩn '.normalize('NFC')}
            <code className="text-cyan-300 font-mono">
              sat_backup_[DisplayName]_[YYYY-MM-DD].json
            </code>
            {'. Khi chuyển trình duyệt hoặc thiết bị, chỉ cần kéo thả tệp vào khung bên dưới để khôi phục.'.normalize('NFC')}
          </p>

          {/* Nút Tải Về Bản Sao Lưu (.json) 1-Click */}
          <button
            type="button"
            onClick={() => {
              try {
                const info = storageService.downloadBackupJson();
                showToast(
                  'success',
                  `Đã tải xuống tệp "${info.filename}" chứa ${info.completedCount} câu đã làm, ${info.vocabCount} từ vựng SRS, ${info.mistakeCount} câu sai và ${info.examCount} bài thi!`
                );
              } catch (err) {
                showToast('error', err?.message || 'Lỗi khi xuất tệp sao lưu.');
              }
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition"
          >
            <Download className="w-4 h-4" />
            <span>{'📥 Tải Về Bản Sao Lưu (.json)'.normalize('NFC')}</span>
          </button>

          {/* Vùng kéo-thả (Dropzone) 📤 Nạp Dữ Liệu Từ File */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer?.files?.[0];
              if (file) handleInspectFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition space-y-2 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_25px_rgba(34,211,238,0.2)]'
                : 'border-indigo-400/35 hover:border-cyan-400/60 bg-slate-950/60 hover:bg-slate-900/80'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto text-cyan-300">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-sm font-extrabold text-white">
              {'📤 Nạp Dữ Liệu Từ File (Kéo thả tệp .json hoặc bấm chọn file)'.normalize(
                'NFC'
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {'Tự động kiểm tra tính toàn vẹn của tệp JSON và cho phép chọn Gộp thêm dữ liệu hoặc Ghi đè toàn bộ.'.normalize(
                'NFC'
              )}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleInspectFile(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>

          {/* Hộp thoại Pop-up Xác nhận trước khi Import */}
          {pendingRestore && (
            <div className="p-5 rounded-2xl bg-indigo-950/55 border-2 border-amber-400/70 space-y-4 shadow-xl">
              <div className="flex items-start gap-3">
                <FileJson className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-[11px] font-mono uppercase text-amber-300 font-bold">
                    {`XÁC NHẬN NẠP TỆP: ${pendingRestore.fileName}`.normalize(
                      'NFC'
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                    {`Tệp sao lưu chứa ${pendingRestore.summary.completedCount} câu hỏi, ${pendingRestore.summary.vocabCount} từ vựng, ${pendingRestore.summary.mistakeCount} câu sai và ${pendingRestore.summary.examCount} đề thi. Bạn muốn Gộp thêm dữ liệu hay Ghi đè toàn bộ?`.normalize(
                      'NFC'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleConfirmRestore('merge')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-md"
                >
                  <GitMerge className="w-4 h-4" />
                  <span>{'Gộp thêm dữ liệu'.normalize('NFC')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmRestore('overwrite')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{'Ghi đè toàn bộ'.normalize('NFC')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingRestore(null)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition ml-auto"
                >
                  {'Hủy'.normalize('NFC')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* KHỐI 2: ĐỒNG BỘ ĐÁM MÂY SUPABASE */}
        <div className="lg:col-span-5 bg-[#0c1224] border border-indigo-500/25 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-extrabold text-white">
                {'Đồng Bộ Đám Mây (Supabase Cloud Sync)'.normalize('NFC')}
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {'Sử dụng Mã đồng bộ cá nhân (Sync Key) để đẩy tiến độ lên Supabase hoặc kéo tiến độ về từ bất kỳ thiết bị nào.'.normalize(
                'NFC'
              )}
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                {'Mã đồng bộ cá nhân (Sync Key):'.normalize('NFC')}
              </label>
              <input
                type="text"
                value={syncKey}
                onChange={(e) => setSyncKey(e.target.value)}
                placeholder="VD: tienthanh-sat-1550"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={isLoadingCloud}
              onClick={handleCloudUpload}
              className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingCloud ? 'animate-spin' : ''}`}
              />
              <span>{'Đẩy lên Cloud'.normalize('NFC')}</span>
            </button>

            <button
              type="button"
              disabled={isLoadingCloud}
              onClick={handleCloudRestore}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-indigo-400/40 text-indigo-200 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Cloud className="w-4 h-4" />
              <span>{'Tải từ Cloud về'.normalize('NFC')}</span>
            </button>
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
            {'Hồ Sơ Thí Sinh & Mục Tiêu Điểm Số'.normalize('NFC')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              {'Họ và tên hiển thị trên thanh Footer Bluebook:'.normalize('NFC')}
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
              {'Mục tiêu điểm Digital SAT (Target Score):'.normalize('NFC')}
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
            {'Lưu thiết lập'.normalize('NFC')}
          </button>
        </div>
      </form>

      {/* Modal Sao lưu dùng chung */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRestoreComplete={() => {
          setSettings(storageService.getUserSettings());
          setStatsTick((t) => t + 1);
        }}
      />
    </div>
  );
}