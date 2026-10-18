// src/components/exam/ScoreReportModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Home,
  Sparkles,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Bot,
  BarChart3,
  ListChecks,
} from 'lucide-react';
import MathRenderer from '../common/MathRenderer';

export default function ScoreReportModal({
  isOpen,
  onClose,
  onRetry,
  onHome,
  reportData,
}) {
  // Mặc định mở thẳng vào giao diện Xem lại chi tiết từng câu như ảnh mẫu, có nút chuyển sang Tổng quan điểm
  const [activeView, setActiveView] = useState('review'); // 'review' | 'overview'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAiExplanation, setShowAiExplanation] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'wrong' | 'correct'
  const [displayScore, setDisplayScore] = useState(200);

  const targetScore = Number(reportData?.scaledScore) || 500;
  const questions = useMemo(() => reportData?.questions || [], [reportData]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIdx(0);
      setActiveView('review');
    }
  }, [isOpen, reportData]);

  // Hiệu ứng chạy số điểm ở tab Tổng quan
  useEffect(() => {
    if (!isOpen || !reportData || activeView !== 'overview') return;
    let startTimestamp = null;
    const duration = 900;
    const startValue = 200;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayScore(Math.round(startValue + (targetScore - startValue) * easeOutQuart));
      if (progress < 1) window.requestAnimationFrame(step);
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [isOpen, targetScore, reportData, activeView]);

  // Hỗ trợ bấm phím mũi tên Trái / Phải trên bàn phím để lướt nhanh qua các câu
  useEffect(() => {
    if (!isOpen || activeView !== 'review') return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && currentIdx < questions.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIdx > 0) {
        setCurrentIdx((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeView, currentIdx, questions.length]);

  if (!isOpen || !reportData) return null;

  const totalCount = questions.length || reportData.totalQuestions || 0;
  const correctCount = questions.filter((q) => q.isCorrect).length;
  const wrongCount = Math.max(0, totalCount - correctCount);
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const currentQ = questions[currentIdx] || {};
  const examCode =
    currentQ?.code ||
    reportData?.examCode ||
    `COSMIC-${String(reportData?.section || 'SAT')
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .slice(0, 6)}-${100 + currentIdx}`;

  const rawOpts = currentQ?.options || {};
  const optionsEntries = Array.isArray(rawOpts)
    ? rawOpts.map((opt, i) => [
        String.fromCharCode(65 + i),
        typeof opt === 'object' ? opt.text || opt.value || '' : opt,
      ])
    : Object.entries(rawOpts);

  const questionPassage =
    currentQ?.passage ||
    currentQ?.prompt ||
    currentQ?.content ||
    currentQ?.text ||
    currentQ?.stimulus ||
    '';

  const questionStem =
    currentQ?.question ||
    'Which choice completes the text with the most logical and precise word or phrase?';

  const domainEntries = Object.entries(reportData.domainPerformance || {});

  const formatDuration = (secs = 0) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-[#060913] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
        {/* LỚP NỀN TINH VÂN VŨ TRỤ NHẸ NHÀNG DỊU MẮT */}
        <div
          className="absolute inset-0 pointer-events-none opacity-35"
          style={{
            backgroundImage: `
              radial-gradient(circle at 18% 20%, rgba(56, 189, 248, 0.16) 0%, transparent 45%),
              radial-gradient(circle at 84% 78%, rgba(139, 92, 246, 0.16) 0%, transparent 48%),
              radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 100% 100%, 30px 30px',
          }}
        />

        {/* ================================================================= */}
        {/* 1. TOP HEADER BAR (CHUẨN BỐ CỤC MẪU + CONCEPT VŨ TRỤ) */}
        {/* ================================================================= */}
        <header className="relative z-20 h-16 px-5 lg:px-8 bg-[#090D1A]/95 backdrop-blur-xl border-b border-indigo-500/25 flex items-center justify-between shrink-0">
          {/* Góc trái: Tên đề thi + Câu X/Y + Breadcrumb */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
                {reportData.section || 'Digital SAT Practice Test'}:{' '}
                <span className="text-cyan-300">
                  Câu {currentIdx + 1}/{totalCount}
                </span>
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                {reportData.scaledScore} PTS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {reportData.section || 'SAT Suite'} &gt;{' '}
              {currentQ?.domain || 'Reading & Writing'} &gt; ID #{currentIdx + 101}
            </p>
          </div>

          {/* Chính giữa: Tên Module */}
          <div className="hidden lg:flex flex-col items-center">
            <span className="text-base font-black text-white tracking-wide">
              Module {reportData.module2Path ? `2 (${reportData.module2Path})` : '1'}
            </span>
          </div>

          {/* Góc phải: Chuyển đổi Xem Câu Hỏi / Tổng Quan Điểm & Nút Quay lại */}
          <div className="flex items-center gap-2.5">
            <div className="flex bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveView('review')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  activeView === 'review'
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chi tiết câu</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  activeView === 'overview'
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Báo cáo điểm</span>
              </button>
            </div>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/35 text-indigo-200 text-xs font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose || onHome}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-white/20 text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Quay lại
            </button>
          </div>
        </header>

        {/* ================================================================= */}
        {/* 2. DẢI SUB-HEADER MÃ ĐỀ (DARK NAVY PILL BAR GIỐNG ẢNH MẪU) */}
        {/* ================================================================= */}
        <div className="relative z-20 px-4 pt-2 pb-1.5 bg-[#060913]">
          <div className="w-full py-1.5 px-6 rounded-full bg-gradient-to-r from-[#0f1d3a] via-[#162a52] to-[#0f1d3a] border border-cyan-400/25 text-center shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-mono font-extrabold text-cyan-100 tracking-wider">
              Mã đề: {examCode}
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. KHU VỰC CHÍNH: CHẾ ĐỘ XEM CHI TIẾT TỪNG CÂU (GIỐNG ẢNH MẪU) */}
        {/* ================================================================= */}
        {activeView === 'review' ? (
          <div className="relative z-10 flex-1 flex overflow-hidden">
            {/* CỘT TRÁI: BẢNG ĐIỀU HƯỚNG CÂU HỎI (QUESTION MATRIX SIDEBAR) */}
            <aside
              className={`${
                isSidebarOpen ? 'w-60' : 'w-12'
              } h-full bg-[#090E1C]/90 backdrop-blur-xl border-r border-indigo-500/20 flex flex-col transition-all duration-200 shrink-0`}
            >
              {/* Tiêu đề cột Câu hỏi + Nút đóng gọn « */}
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
                {isSidebarOpen && (
                  <span className="text-xs font-extrabold text-slate-200 tracking-wide">
                    Câu hỏi
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-cyan-300 transition cursor-pointer mx-auto sm:mx-0"
                  title={isSidebarOpen ? 'Thu gọn danh sách câu' : 'Mở danh sách câu'}
                >
                  {isSidebarOpen ? (
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronsRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {isSidebarOpen && (
                <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
                  {/* Hộp tổng kết Module: Đúng (Xanh) / Sai (Đỏ) / Tổng (Xám) */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-400/35 shadow-inner flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-200">Module 1</span>
                    <div className="font-mono text-xs tracking-tight">
                      <span className="text-emerald-400 font-black">{correctCount}</span>
                      <span className="text-slate-500 mx-0.5">/</span>
                      <span className="text-rose-400 font-black">{wrongCount}</span>
                      <span className="text-slate-500 mx-0.5">/</span>
                      <span className="text-slate-300">{totalCount}</span>
                    </div>
                  </div>

                  {/* Bộ lọc nhanh: Tất cả / Câu sai / Câu đúng */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-white/10 text-[10px] font-bold">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'wrong', label: `Sai (${wrongCount})` },
                      { id: 'correct', label: `Đúng (${correctCount})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatusFilter(tab.id)}
                        className={`py-1 rounded-lg transition cursor-pointer ${
                          statusFilter === tab.id
                            ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Lưới 4 cột các nút số câu hỏi (Xanh lá = Đúng, Đỏ = Sai) */}
                  <div className="grid grid-cols-4 gap-2">
                    {questions.map((q, idx) => {
                      if (statusFilter === 'wrong' && q.isCorrect) return null;
                      if (statusFilter === 'correct' && !q.isCorrect) return null;

                      const isCurrent = idx === currentIdx;
                      const isCorrect = Boolean(q.isCorrect);

                      return (
                        <button
                          key={q.id || idx}
                          type="button"
                          onClick={() => setCurrentIdx(idx)}
                          className={`h-10 rounded-xl font-mono text-xs font-extrabold transition flex items-center justify-center cursor-pointer border ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          } ${
                            isCurrent
                              ? 'ring-2 ring-cyan-400 border-cyan-300 scale-105 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                              : ''
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>

            {/* VÙNG NỘI DUNG 2 CỘT: ĐOẠN VĂN BÊN TRÁI & CÂU HỎI BÊN PHẢI */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
              {/* NÚT TRÒN ĐỎ CHUYỂN CÂU TRƯỚC (<) NỔI BÊN MÉP TRÁI */}
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className={`fixed md:absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition cursor-pointer ${
                  currentIdx === 0
                    ? 'bg-slate-800/60 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-600/30 hover:scale-105'
                }`}
                title="Câu trước (Phím ←)"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* NÚT TRÒN ĐỎ CHUYỂN CÂU TIẾP (>) NỔI BÊN MÉP PHẢI */}
              <button
                type="button"
                disabled={currentIdx >= totalCount - 1}
                onClick={() => setCurrentIdx((prev) => Math.min(totalCount - 1, prev + 1))}
                className={`fixed md:absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition cursor-pointer ${
                  currentIdx >= totalCount - 1
                    ? 'bg-slate-800/60 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-600/30 hover:scale-105'
                }`}
                title="Câu tiếp theo (Phím →)"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* CỘT GIỮA (TRÁI): ĐOẠN VĂN BÀI ĐỌC (PASSAGE) */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto px-8 py-6 lg:px-12 lg:py-8 border-b md:border-b-0 md:border-r border-indigo-500/20 bg-[#070B16]/75">
                <div className="max-w-xl mx-auto space-y-4">
                  {/* Dòng Breadcrumb đỏ/cam nhỏ phía trên đoạn văn giống ảnh mẫu */}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-rose-400/90">
                    <span>{reportData.section || 'SAT Review'}</span>
                    <span>•</span>
                    <span>{currentQ?.domain || 'Reading & Writing'}</span>
                    {reportData.questionTimes?.[currentIdx] !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {reportData.questionTimes[currentIdx]}s
                        </span>
                      </>
                    )}
                  </div>

                  {/* Nội dung đoạn văn bản */}
                  <div className="text-[15.5px] text-slate-100 leading-[1.85] font-serif select-text">
                    <MathRenderer
                      text={questionPassage || 'Đề bài câu hỏi hiển thị ở cột bên phải.'}
                      image={currentQ?.image || currentQ?.figure || currentQ?.imageUrl}
                      svg={currentQ?.svg || currentQ?.chart}
                    />
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: TRẠNG THÁI CORRECT/INCORRECT + CÂU HỎI + 4 ĐÁP ÁN + GIẢI THÍCH */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto px-8 py-6 lg:px-12 lg:py-8 bg-[#0A1020]/80">
                <div className="max-w-xl mx-auto space-y-5">
                  {/* THANH TRẠNG THÁI: [1] ✔ CORRECT / ✖ INCORRECT + NÚT [ChatbotAI] */}
                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between ${
                      currentQ.isCorrect
                        ? 'bg-emerald-500/15 border-emerald-400/40'
                        : 'bg-rose-500/15 border-rose-400/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="min-w-[30px] h-7 px-2 rounded-lg bg-slate-950 text-white font-mono text-xs font-black flex items-center justify-center border border-white/15">
                        {currentIdx + 1}
                      </span>

                      {currentQ.isCorrect ? (
                        <div className="flex items-center gap-1.5 text-emerald-300 font-extrabold text-xs tracking-wide uppercase">
                          <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-slate-950" />
                          <span>CORRECT</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-300 font-extrabold text-xs tracking-wide uppercase">
                          <XCircle className="w-4 h-4 fill-rose-500 text-slate-950" />
                          <span>
                            INCORRECT (Bạn chọn: {currentQ.userAnswer || 'Bỏ trống'})
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAiExplanation(!showAiExplanation)}
                      className="px-3 py-1 rounded-lg bg-slate-950/90 hover:bg-slate-900 border border-white/15 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ChatbotAI</span>
                    </button>
                  </div>

                  {/* Mã đề dưới thanh trạng thái */}
                  <div className="text-xs font-mono text-slate-400">
                    Mã đề: <span className="text-slate-200 font-semibold">{examCode}</span>
                  </div>

                  {/* Câu hỏi chính (Question Stem) */}
                  <div className="text-[15.5px] text-white font-serif leading-relaxed">
                    <MathRenderer text={questionStem} />
                  </div>

                  {/* Đường kẻ nét đứt ngăn cách giống ảnh mẫu */}
                  <div className="border-t border-dashed border-slate-700/80 my-2" />

                  {/* DANH SÁCH 4 ĐÁP ÁN A, B, C, D */}
                  {optionsEntries.length > 0 ? (
                    <div className="space-y-3">
                      {optionsEntries.map(([letter, text]) => {
                        const cleanLetter = String(letter).trim().toUpperCase();
                        const cleanCorrect = String(currentQ.correctAnswer || '')
                          .trim()
                          .toUpperCase();
                        const cleanUser = String(currentQ.userAnswer || '')
                          .trim()
                          .toUpperCase();

                        const isCorrectOption = cleanLetter === cleanCorrect;
                        const isUserWrongChoice =
                          cleanLetter === cleanUser && !isCorrectOption;

                        let boxClasses =
                          'border-slate-700/80 bg-slate-900/75 text-slate-200 hover:border-slate-600';
                        let circleClasses =
                          'border-slate-500 text-slate-300 bg-slate-950';

                        if (isCorrectOption) {
                          boxClasses =
                            'border-2 border-emerald-400 bg-emerald-950/35 text-white shadow-[0_0_25px_rgba(16,185,129,0.2)]';
                          circleClasses =
                            'border-emerald-400 bg-emerald-500 text-slate-950 font-black';
                        } else if (isUserWrongChoice) {
                          boxClasses =
                            'border-2 border-rose-500 bg-rose-950/35 text-rose-100';
                          circleClasses =
                            'border-rose-400 bg-rose-500 text-white font-black';
                        }

                        return (
                          <div
                            key={letter}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${boxClasses}`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <span
                                className={`w-7 h-7 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${circleClasses}`}
                              >
                                {letter}
                              </span>
                              <div className="text-[14.5px] font-serif leading-relaxed">
                                <MathRenderer text={text} />
                              </div>
                            </div>

                            {/* Huy chương ruy-băng xanh ở góc phải đáp án đúng giống hệt ảnh mẫu */}
                            {isCorrectOption && (
                              <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                            {isUserWrongChoice && (
                              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Trường hợp câu trả lời điền khuyết (Grid-in Math) */
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10">
                        <span className="text-slate-400 block mb-1">Câu trả lời của bạn:</span>
                        <strong className="text-sm font-mono text-white">
                          {currentQ.userAnswer || 'Bỏ trống'}
                        </strong>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-400/40">
                        <span className="text-emerald-300 block mb-1">Đáp án chuẩn:</span>
                        <strong className="text-sm font-mono text-emerald-300">
                          {currentQ.correctAnswer}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* HỘP GIẢI THÍCH CHI TIẾT CỦA AI CO-PILOT */}
                  <AnimatePresence>
                    {showAiExplanation && currentQ.explanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/75 via-slate-900/90 to-slate-950 border border-cyan-400/35 space-y-2 shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" /> Giải thích chi tiết & Phân tích bẫy
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300 font-bold">
                            Đáp án đúng: {currentQ.correctAnswer}
                          </span>
                        </div>
                        <div className="text-xs sm:text-[13.5px] text-slate-200 font-serif leading-relaxed pt-1 border-t border-white/10">
                          <MathRenderer text={currentQ.explanation} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* 4. CHẾ ĐỘ XEM BÁO CÁO TỔNG QUAN ĐIỂM SỐ (OVERVIEW TAB)            */
          /* ================================================================= */
          <div className="relative z-10 flex-1 overflow-y-auto p-6 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg border border-indigo-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                    Scaled Score
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div className="my-4">
                  <div className="text-5xl font-black font-mono tracking-tight">
                    {displayScore}
                  </div>
                  <span className="text-xs text-indigo-200 font-medium">
                    Range: 200 – 800 • Route: <strong>{reportData.module2Path || 'Hard'}</strong>
                  </span>
                </div>
                <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${((targetScore - 200) / 600) * 100}%` }}
                    className="h-full bg-emerald-400 rounded-full"
                  />
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-3 gap-4">
                <div className="bg-slate-900/85 p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Accuracy</span>
                  <div className="text-3xl font-black text-white mt-2">{accuracy}%</div>
                  <span className="text-xs text-emerald-400 font-semibold mt-1">
                    {correctCount}/{totalCount} câu đúng
                  </span>
                </div>

                <div className="bg-slate-900/85 p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Time</span>
                  <div className="text-3xl font-black text-white mt-2">
                    {formatDuration(reportData.timeSpent)}
                  </div>
                  <span className="text-xs text-slate-400 font-medium mt-1">
                    TB {Math.round((reportData.timeSpent || 0) / Math.max(1, totalCount))}s / câu
                  </span>
                </div>

                <div className="bg-slate-900/85 p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Module 2 Path</span>
                  <div className="text-3xl font-black text-cyan-400 mt-2">
                    {reportData.module2Path || 'Hard'}
                  </div>
                  <span className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    IRT Calibrated
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/85 p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Phân Tích Tỷ Lệ Đúng Theo Từng Dạng Bài (Domains)
              </h3>
              <div className="space-y-4">
                {domainEntries.map(([domain, st]) => (
                  <div key={domain} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-200">{domain}</span>
                      <span className="text-cyan-300 font-mono">
                        {st.correct}/{st.total} ({st.percentage}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${st.percentage}%` }}
                        className={`h-full rounded-full ${
                          st.percentage >= 80
                            ? 'bg-emerald-400'
                            : st.percentage >= 50
                            ? 'bg-cyan-400'
                            : 'bg-amber-400'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}