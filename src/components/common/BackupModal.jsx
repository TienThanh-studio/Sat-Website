// src/components/common/BackupModal.jsx
import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  GitMerge,
  RefreshCw,
  FileJson,
  ShieldCheck,
} from 'lucide-react';
import { storageService } from '../../services/storageService';

export default function BackupModal({
  isOpen = false,
  onClose,
  onRestoreComplete,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text: '' }
  const [pendingRestore, setPendingRestore] = useState(null); // { rawJson, fileName, summary }
  const [refreshKey, setRefreshKey] = useState(0);

  if (!isOpen) return null;

  const completedCount = storageService.getCompletedQuestionIds().length;
  const mistakeCount = storageService.getMistakes().length;
  const vocabCount = Object.keys(storageService.getVocabProgress() || {}).length;
  const examCount = storageService.getExamHistory().length;

  const showNotice = (type, text) => {
    setToast({ type, text: String(text || '').normalize('NFC') });
    setTimeout(() => {
      setToast(null);
    }, 5500);
  };

  const handleExport1Click = () => {
    try {
      const info = storageService.exportBackupData();
      showNotice(
        'success',
        `Đã tải xuống tệp "${info.filename}" (${info.completedCount} câu hỏi, ${info.vocabCount} từ vựng, ${info.mistakeCount} câu sai)!`
      );
    } catch (err) {
      showNotice(
        'error',
        err?.message || 'Không thể xuất tệp sao lưu. Vui lòng thử lại!'
      );
    }
  };

  const processSelectedFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      showNotice(
        'error',
        'Vui lòng chọn đúng định dạng tệp sao lưu có đuôi .json!'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawJson = String(event.target?.result || '');
      const check = storageService.inspectBackupPayload(rawJson);
      if (!check.valid) {
        setPendingRestore(null);
        showNotice('error', check.error);
        return;
      }

      setToast(null);
      setPendingRestore({
        rawJson,
        fileName: file.name,
        summary: check.summary,
      });
    };
    reader.onerror = () => {
      showNotice('error', 'Không thể đọc tệp vừa chọn. Vui lòng kiểm tra lại!');
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = (mode = 'merge') => {
    if (!pendingRestore?.rawJson) return;
    try {
      const res = storageService.validateAndRestoreBackup(
        pendingRestore.rawJson,
        mode
      );
      setPendingRestore(null);
      setRefreshKey((k) => k + 1);
      if (typeof onRestoreComplete === 'function') {
        onRestoreComplete(res);
      }
      showNotice(
        'success',
        mode === 'merge'
          ? `Đã GỘP dữ liệu thành công! Hiện có ${res.completedCount} câu đã làm, ${res.vocabCount} từ vựng, ${res.mistakeCount} câu sai và ${res.examCount} đề thi.`
          : `Đã GHI ĐÈ SẠCH dữ liệu thành công! Hiện có ${res.completedCount} câu đã làm, ${res.vocabCount} từ vựng, ${res.mistakeCount} câu sai và ${res.examCount} đề thi.`
      );
    } catch (err) {
      showNotice(
        'error',
        err?.message || 'Khôi phục dữ liệu thất bại do tệp không hợp lệ.'
      );
    }
  };

  return (
    <div
      key={refreshKey}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 select-none font-sans"
    >
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0b1120] border border-cyan-400/35 shadow-2xl overflow-hidden text-slate-100 z-10">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {'Quản Lý Sao Lưu & Khôi Phục 1-Click (Safe Backup)'.normalize(
                  'NFC'
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {'Bảo toàn tuyệt đối tiến độ câu hỏi, Sổ tay câu sai 2-Strike & từ vựng SRS'.normalize(
                  'NFC'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* 4 Thẻ thống kê thời gian thực */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-400/25">
              <span className="text-[11px] font-bold text-slate-400 block">
                {'Câu đã làm'.normalize('NFC')}
              </span>
              <span className="text-xl font-black font-mono tabular-nums text-emerald-400">
                {completedCount}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-rose-400/25">
              <span className="text-[11px] font-bold text-slate-400 block">
                {'Câu trong Sổ sai'.normalize('NFC')}
              </span>
              <span className="text-xl font-black font-mono tabular-nums text-rose-400">
                {mistakeCount}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-400/25">
              <span className="text-[11px] font-bold text-slate-400 block">
                {'Từ vựng đã thuộc'.normalize('NFC')}
              </span>
              <span className="text-xl font-black font-mono tabular-nums text-cyan-300">
                {vocabCount}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-indigo-400/25">
              <span className="text-[11px] font-bold text-slate-400 block">
                {'Bài thi đã nộp'.normalize('NFC')}
              </span>
              <span className="text-xl font-black font-mono tabular-nums text-indigo-300">
                {examCount}
              </span>
            </div>
          </div>

          {/* Toast thông báo */}
          {toast && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
                toast.type === 'success'
                  ? 'bg-emerald-950/75 border-emerald-400/60 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                  : 'bg-rose-950/75 border-rose-400/60 text-rose-200'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{toast.text}</span>
            </div>
          )}

          {/* Nút Xuất Tệp Sao Lưu 1-Click */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>{'Sao lưu toàn bộ tiến độ về máy (.json)'.normalize('NFC')}</span>
              </div>
              <p className="text-xs text-slate-400">
                {'Định dạng chuẩn v2.0 kèm mã kiểm tra toàn vẹn Checksum.'.normalize(
                  'NFC'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={handleExport1Click}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{'📥 Xuất Tệp Sao Lưu (.json)'.normalize('NFC')}</span>
            </button>
          </div>

          {/* Khung kéo thả (Dropzone) Khôi Phục Dữ Liệu */}
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
              if (file) processSelectedFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition space-y-2 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/15'
                : 'border-indigo-400/35 hover:border-cyan-400/60 bg-slate-950/60 hover:bg-slate-900/80'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto text-cyan-300">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-sm font-extrabold text-white">
              {'📤 Khôi Phục Dữ Liệu: Kéo thả tệp .json vào đây hoặc bấm để chọn tệp'.normalize(
                'NFC'
              )}
            </div>
            <p className="text-xs text-slate-400">
              {'Hệ thống sẽ kiểm tra cấu trúc an toàn trước khi hỏi bạn muốn Gộp thêm (Merge) hay Ghi đè (Overwrite).'.normalize(
                'NFC'
              )}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processSelectedFile(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>

          {/* Hộp thoại Xác nhận trước khi Import */}
          {pendingRestore && (
            <div className="p-5 rounded-2xl bg-indigo-950/50 border-2 border-amber-400/60 space-y-4">
              <div className="flex items-start gap-3">
                <FileJson className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-mono uppercase text-amber-300 font-bold">
                    {`XÁC NHẬN KHÔI PHỤC TỪ TỆP: ${pendingRestore.fileName}`.normalize(
                      'NFC'
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-white leading-snug">
                    {`Tệp sao lưu chứa ${pendingRestore.summary.completedCount} câu hỏi, ${pendingRestore.summary.vocabCount} từ vựng, ${pendingRestore.summary.mistakeCount} câu sai và ${pendingRestore.summary.examCount} đề thi. Bạn muốn Gộp thêm hay Ghi đè?`.normalize(
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
                  <span>{'Gộp dữ liệu (Merge)'.normalize('NFC')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmRestore('overwrite')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{'Ghi đè sạch (Overwrite)'.normalize('NFC')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingRestore(null)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition ml-auto"
                >
                  {'Hủy bỏ'.normalize('NFC')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
