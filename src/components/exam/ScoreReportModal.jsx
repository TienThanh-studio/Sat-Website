// src/components/exam/ScoreReportModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle2, XCircle, Clock, RotateCcw, Home, Sparkles, TrendingUp, X } from 'lucide-react';
import MathRenderer from '../common/MathRenderer';

export default function ScoreReportModal({ isOpen, onClose, onRetry, onHome, reportData }) {
  const [displayScore, setDisplayScore] = useState(200);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'questions'
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'wrong' | 'correct'

  const targetScore = Number(reportData?.scaledScore) || 500;

  useEffect(() => {
    if (!isOpen || !reportData) return;
    let startTimestamp = null;
    const duration = 1000;
    const startValue = 200;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentVal = Math.round(startValue + (targetScore - startValue) * easeOutQuart);
      setDisplayScore(currentVal);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [isOpen, targetScore, reportData]);

  if (!isOpen || !reportData) return null;

  const accuracy =
    reportData.totalQuestions > 0
      ? Math.round((reportData.correctCount / reportData.totalQuestions) * 100)
      : 0;

  const formatDuration = (secs = 0) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const domainEntries = Object.entries(reportData.domainPerformance || {});
  const allQuestions = reportData.questions || [];
  const filteredQuestions = allQuestions.filter((q) => {
    if (filterMode === 'wrong') return !q.isCorrect;
    if (filterMode === 'correct') return q.isCorrect;
    return true;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md font-sans select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#080d1a] text-slate-100 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.85)] border border-indigo-500/30 overflow-hidden relative"
        >
          {/* BACKGROUND VŨ TRỤ NHẸ NHÀNG DỊU MẮT */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.25) 0%, transparent 45%),
                radial-gradient(circle at 85% 80%, rgba(139, 92, 246, 0.25) 0%, transparent 45%),
                radial-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 100% 100%, 28px 28px',
            }}
          />

          {/* Header Báo cáo */}
          <div className="relative z-10 px-6 py-5 bg-slate-950/90 border-b border-white/10 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 block">
                  Official Score Report & Review
                </span>
                <h2 className="text-lg font-extrabold tracking-tight">
                  {reportData.section || 'Digital SAT Practice'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'overview' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tổng quan điểm
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('questions')}
                  className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'questions' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Xem lại câu hỏi ({reportData.totalQuestions})
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Nội dung chính trên nền Vũ trụ dịu nhẹ */}
          <div className="relative z-10 flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {activeTab === 'overview' ? (
              <>
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
                        Range: 200 – 800 • Adaptive Route: <strong>{reportData.module2Path}</strong>
                      </span>
                    </div>
                    <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((targetScore - 200) / 600) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-emerald-400 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-3 gap-4">
                    <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Accuracy</span>
                      <div className="text-3xl font-black text-white mt-2">{accuracy}%</div>
                      <span className="text-xs text-emerald-400 font-semibold mt-1">
                        {reportData.correctCount}/{reportData.totalQuestions} câu đúng
                      </span>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Total Time</span>
                      <div className="text-3xl font-black text-white mt-2">
                        {formatDuration(reportData.timeSpent)}
                      </div>
                      <span className="text-xs text-slate-400 font-medium mt-1">
                        TB {Math.round((reportData.timeSpent || 0) / (reportData.totalQuestions || 1))}s / câu
                      </span>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
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

                <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Knowledge Domain Breakdown
                  </h3>
                  <div className="space-y-4">
                    {domainEntries.map(([domain, stats], idx) => (
                      <div key={domain} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-200">{domain}</span>
                          <span className="text-cyan-300 font-mono">
                            {stats.correct}/{stats.total} ({stats.percentage}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.percentage}%` }}
                            transition={{ duration: 0.7, delay: idx * 0.1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              stats.percentage >= 80
                                ? 'bg-emerald-400'
                                : stats.percentage >= 50
                                ? 'bg-cyan-400'
                                : 'bg-amber-400'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* DANH SÁCH XEM LẠI CÂU HỎI SAI TRÊN NỀN VŨ TRỤ DỊU MẮT */
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'all', label: `Tất cả (${allQuestions.length})` },
                    { id: 'wrong', label: `Câu sai / Bỏ trống (${allQuestions.filter((q) => !q.isCorrect).length})` },
                    { id: 'correct', label: `Câu đúng (${allQuestions.filter((q) => q.isCorrect).length})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterMode(f.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        filterMode === f.id
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                          : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className={`p-5 rounded-2xl border backdrop-blur-md space-y-3 ${
                      q.isCorrect
                        ? 'bg-slate-900/75 border-emerald-500/30'
                        : 'bg-slate-900/85 border-rose-500/35'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{q.domain}</span>
                        {reportData.questionTimes?.[idx] !== undefined && (
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {reportData.questionTimes[idx]}s
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        {q.isCorrect ? (
                          <span className="text-emerald-300 flex items-center gap-1 bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đúng ({q.userAnswer})
                          </span>
                        ) : (
                          <span className="text-rose-300 flex items-center gap-1 bg-rose-500/15 border border-rose-400/30 px-2.5 py-1 rounded-lg">
                            <XCircle className="w-3.5 h-3.5" /> Chọn: {q.userAnswer || 'Trống'} • Đúng: {q.correctAnswer}
                          </span>
                        )}
                      </div>
                    </div>

                    {(q.prompt || q.passage) && (
                      <div className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed p-3.5 rounded-xl bg-slate-950/60 border border-white/10">
                        <MathRenderer text={q.prompt || q.passage} />
                      </div>
                    )}

                    {q.explanation && (
                      <div className="text-xs text-cyan-100/90 font-serif leading-relaxed pt-2 border-t border-white/10">
                        <strong className="text-cyan-300 font-sans block mb-1">Giải thích chi tiết:</strong>
                        <MathRenderer text={q.explanation} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Modal */}
          <div className="relative z-10 px-6 py-4 bg-slate-950/90 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onRetry}
              className="px-5 py-2.5 rounded-xl border border-white/15 text-xs font-bold text-slate-200 hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại đề này</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onHome}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Về trang chủ Dashboard</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}