// src/components/exam/AiTutorModal.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Sparkles, X, Copy, Check, MessageSquare, BarChart2 } from 'lucide-react';
import MathRenderer from '../common/MathRenderer';
import { buildAnalysis, DIFFICULTY_META } from '../../data/satTrapsConfig';
import OptionBreakdownCard from './ai-tutor/OptionBreakdownCard';
import ContextCluesCard from './ai-tutor/ContextCluesCard';
import TrapAnalysisCard from './ai-tutor/TrapAnalysisCard';
import StepByStepGuide from './ai-tutor/StepByStepGuide';
import InteractiveAiChat from './ai-tutor/InteractiveAiChat';

export default function AiTutorModal({ isOpen = false, onClose, question = {} }) {
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'chat'
  const [phase, setPhase] = useState('analyzing');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const dialogRef = useRef(null);

  const safeQuestion = useMemo(() => (question && typeof question === 'object' ? question : {}), [question]);
  const analysis = useMemo(() => buildAnalysis(safeQuestion), [safeQuestion]);

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setPhase('analyzing');
    setActiveTab('analysis');
    setCopied(false);
    setToast(null);
    const timer = setTimeout(() => setPhase('ready'), 450);
    return () => clearTimeout(timer);
  }, [isOpen, safeQuestion.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, handleClose]);

  const handleCopyTakeaway = async () => {
    if (!analysis?.takeaway) return;
    try {
      await navigator.clipboard.writeText(analysis.takeaway);
      setCopied(true);
      setToast('Đã sao chép bài học rút ra vào clipboard!');
      setTimeout(() => {
        setCopied(false);
        setToast(null);
      }, 2000);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const domain = safeQuestion.domain || 'Digital SAT';
  const difficulty = String(safeQuestion.difficulty || 'Medium').toLowerCase();
  const diffMeta = DIFFICULTY_META[difficulty] || DIFFICULTY_META.medium;
  const isCorrect = analysis.status === 'correct';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 select-none font-sans">
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-md" onClick={handleClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md border border-white/10 shadow-2xl ring-1 ring-slate-900/10 outline-none"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 py-3.5 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 font-mono tracking-wide">
                  CO-PILOT 1600
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${diffMeta.className}`}>
                  {diffMeta.label}
                </span>
                <span className="hidden sm:inline-block text-[11px] text-slate-400">•</span>
                <span className="hidden sm:inline-block text-[11px] text-slate-500 truncate max-w-[200px]">
                  {domain}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {'AI Tutor: Phân Tích & Đối Thoại Socratic'.normalize('NFC')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('analysis')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'analysis'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Phân tích</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
                <span className="hidden sm:inline">Hỏi đáp AI</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 bg-slate-50/60">
          {phase === 'analyzing' ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                <Bot className="h-8 w-8 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Đang quét đề bài, tra cứu từ điển và nhận diện bẫy tâm lý…
              </p>
            </div>
          ) : activeTab === 'chat' ? (
            <InteractiveAiChat question={safeQuestion} analysis={analysis} />
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Question summary badge */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-black text-xs">
                    {safeQuestion.questionNumber ? `Câu ${safeQuestion.questionNumber}` : 'Câu hỏi'}
                  </span>
                  <span className="font-semibold text-slate-700 font-serif line-clamp-1 max-w-md">
                    {safeQuestion.question || safeQuestion.stem || 'Đề bài câu hỏi'}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono font-bold shrink-0">
                  <span className="text-slate-500">Bạn: <strong className={isCorrect ? 'text-emerald-600' : 'text-rose-600'}>{analysis.user?.label || 'Chưa chọn'}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span className="text-emerald-700">Đúng: <strong>{analysis.correct?.label || safeQuestion.correctAnswer}</strong></span>
                </div>
              </div>

              {/* 1. Context Clues Card */}
              <ContextCluesCard
                passage={safeQuestion.passage || safeQuestion.prompt}
                question={safeQuestion.question}
              />

              {/* 2. Option Breakdown Card */}
              <OptionBreakdownCard
                enrichedOptions={analysis.enrichedOptions}
                correctLabel={analysis.correct?.label}
                explanationText={analysis.explanationText}
              />

              {/* 3. Trap Analysis Card */}
              <TrapAnalysisCard
                status={analysis.status}
                trapTag={analysis.trapTag}
                trapParagraphs={analysis.trapParagraphs}
                strategy={analysis.strategy}
              />

              {/* 4. Step By Step Guide & Takeaway */}
              <StepByStepGuide steps={analysis.steps} takeaway={analysis.takeaway} />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3 text-xs sm:px-6">
          <p className="text-slate-500 font-medium hidden sm:inline">
            Hỗ trợ bởi Digital SAT Adaptive AI Engine • Chuẩn cấu trúc College Board
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleCopyTakeaway}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép bài học' : 'Chép bài học'}</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </footer>

        {toast && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-4 py-2 rounded-full shadow-lg font-medium">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}