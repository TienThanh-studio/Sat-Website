// src/components/exam/ScoreReportModal.jsx
import React, { useMemo, useState, useCallback } from 'react';
import {
  X,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  RotateCcw,
  Home,
  CheckCheck,
  ListFilter,
  MinusCircle,
} from 'lucide-react';
import MathRenderer from '../common/MathRenderer';

const FILTERS = {
  ALL: 'all',
  CORRECT: 'correct',
  INCORRECT: 'incorrect',
};

const DIFFICULTY_LABEL = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
};

const DIFFICULTY_STYLE = {
  easy: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  hard: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const formatSeconds = (totalSeconds) => {
  const value = Number(totalSeconds) || 0;
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes} phút ${seconds.toString().padStart(2, '0')}s`;
};

const normalizeDomainPerformance = (domainPerformance) => {
  if (!domainPerformance) return [];
  if (Array.isArray(domainPerformance)) {
    return domainPerformance.map((item) => ({
      domain: item.domain || item.name || 'Không xác định',
      correct: item.correct || 0,
      total: item.total || 0,
      percentage:
        item.percentage ?? (item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0),
    }));
  }
  return Object.entries(domainPerformance).map(([domain, stat]) => ({
    domain,
    correct: stat?.correct || 0,
    total: stat?.total || 0,
    percentage:
      stat?.percentage ?? (stat?.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0),
  }));
};

const getBarColor = (percentage) => {
  if (percentage >= 80) return 'bg-emerald-500';
  if (percentage >= 50) return 'bg-amber-400';
  return 'bg-rose-500';
};

const getBarTextColor = (percentage) => {
  if (percentage >= 80) return 'text-emerald-700';
  if (percentage >= 50) return 'text-amber-700';
  return 'text-rose-700';
};

function QuestionReviewCard({ question, index }) {
  const [expanded, setExpanded] = useState(false);
  const q = question || {};
  const isCorrect = !!q.isCorrect;
  const hasAnswer = q.userAnswer !== undefined && q.userAnswer !== null && q.userAnswer !== '';
  const promptText = q.prompt || '';
  const questionText = q.question || '';
  const options = Array.isArray(q.options) 
    ? q.options 
    : (q.options && typeof q.options === 'object' ? Object.entries(q.options).map(([k, v]) => ({ key: k, value: v })) : []);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              isCorrect
                ? 'bg-emerald-100 text-emerald-700'
                : hasAnswer
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {questionText || promptText || `Câu hỏi ${index + 1}`}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {q.domain && (
                <span className="text-xs text-slate-500 truncate">{q.domain}</span>
              )}
              {q.difficulty && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${
                    DIFFICULTY_STYLE[q.difficulty] || 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {DIFFICULTY_LABEL[q.difficulty] || q.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : hasAnswer ? (
            <XCircle className="w-5 h-5 text-rose-500" />
          ) : (
            <MinusCircle className="w-5 h-5 text-slate-400" />
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-4">
          {promptText && (
            <div className="text-sm text-slate-700 leading-relaxed font-serif">
              <MathRenderer text={promptText} />
            </div>
          )}
          {questionText && (
            <div className="text-sm font-medium text-slate-800">
              <MathRenderer text={questionText} />
            </div>
          )}
          {options.length > 0 && (
            <div className="space-y-2">
              {options.map((opt, optIdx) => {
                const optionValue = typeof opt === 'string' ? opt : opt?.value ?? opt?.label ?? opt?.text ?? '';
                const optionKey =
                  typeof opt === 'string' ? opt : opt?.key ?? opt?.id ?? String.fromCharCode(65 + optIdx);
                const isUserChoice = String(q.userAnswer).trim().toLowerCase() === String(optionKey).trim().toLowerCase();
                const isCorrectChoice = String(q.correctAnswer).trim().toLowerCase() === String(optionKey).trim().toLowerCase();
                
                let optionStyle = 'border-slate-200 bg-white text-slate-700';
                if (isCorrectChoice) {
                  optionStyle = 'border-emerald-400 bg-emerald-50 text-emerald-800';
                }
                if (isUserChoice && !isCorrectChoice) {
                  optionStyle = 'border-rose-400 bg-rose-50 text-rose-800';
                }

                return (
                  <div
                    key={optionKey}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm ${optionStyle}`}
                  >
                    <span className="flex-1 font-serif">
                      <strong className="mr-2 font-mono">{optionKey}.</strong>
                      <MathRenderer text={String(optionValue)} />
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isUserChoice && (
                        <span className="text-[11px] font-semibold uppercase tracking-wide">
                          Bạn chọn
                        </span>
                      )}
                      {isCorrectChoice && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      {isUserChoice && !isCorrectChoice && (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!options.length && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`rounded-lg px-3 py-2 border text-sm ${
                  isCorrect
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : hasAnswer
                    ? 'border-rose-400 bg-rose-50 text-rose-800'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5 opacity-70">
                  Đáp án của bạn
                </p>
                <MathRenderer text={hasAnswer ? String(q.userAnswer) : 'Bỏ trống'} />
              </div>
              <div className="rounded-lg px-3 py-2 border border-emerald-400 bg-emerald-50 text-emerald-800 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5 opacity-70">
                  Đáp án chuẩn
                </p>
                <MathRenderer text={String(q.correctAnswer ?? '')} />
              </div>
            </div>
          )}
          {q.explanation && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Lời giải chi tiết
              </p>
              <div className="text-sm text-slate-700 leading-relaxed font-serif">
                <MathRenderer text={q.explanation} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScoreReportModal({ isOpen, onClose, onRetry, onHome, reportData }) {
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [saveNotice, setSaveNotice] = useState('');

  const data = reportData || {};
  const questions = Array.isArray(data.questions) ? data.questions : [];
  const scaledScore = Number.isFinite(data.scaledScore) ? data.scaledScore : 0;
  const totalQuestions = data.totalQuestions || questions.length || 0;
  const correctCount =
    data.correctCount ?? questions.filter((q) => q && q.isCorrect).length ?? 0;
  const accuracyPercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const avgTimePerQuestion =
    totalQuestions > 0 && data.timeSpent ? Math.round(data.timeSpent / totalQuestions) : 0;

  const domainList = useMemo(
    () => normalizeDomainPerformance(data.domainPerformance),
    [data.domainPerformance]
  );

  const filteredQuestions = useMemo(() => {
    if (filter === FILTERS.CORRECT) {
      return questions.filter((q) => q && q.isCorrect);
    }
    if (filter === FILTERS.INCORRECT) {
      return questions.filter((q) => q && !q.isCorrect);
    }
    return questions;
  }, [questions, filter]);

  const branchLabel =
    data.module2Path === 'Easy'
      ? 'Phân nhánh Module 2: Cơ bản (Easy)'
      : 'Phân nhánh Module 2: Thử thách (Hard) — Đạt chuẩn điểm cao';

  const branchBadgeStyle =
    data.module2Path === 'Easy'
      ? 'bg-amber-50 text-amber-700 border border-amber-200'
      : 'bg-violet-50 text-violet-700 border border-violet-200';

  const handleSaveMistakes = useCallback(() => {
    try {
      const mistakes = questions.filter((q) => q && q.isCorrect === false);
      if (mistakes.length === 0) {
        setSaveNotice('Không có câu sai nào để lưu.');
        setTimeout(() => setSaveNotice(''), 2500);
        return;
      }
      const existingRaw = window.localStorage.getItem('sat_mistakes');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const existingArray = Array.isArray(existing) ? existing : [];
      const existingIds = new Set(existingArray.map((item) => item.id));

      const newEntries = mistakes
        .filter((q) => !existingIds.has(q.id))
        .map((q) => ({
          id: q.id,
          prompt: q.prompt || '',
          question: q.question || '',
          options: q.options || [],
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          domain: q.domain || '',
          difficulty: q.difficulty || '',
          explanation: q.explanation || '',
          section: data.section || '',
          savedAt: new Date().toISOString(),
        }));

      const merged = [...existingArray, ...newEntries];
      window.localStorage.setItem('sat_mistakes', JSON.stringify(merged));
      setSaveNotice(
        newEntries.length > 0
          ? `Đã lưu ${newEntries.length} câu sai vào Sổ tay!`
          : 'Các câu sai này đã có sẵn trong Sổ tay.'
      );
    } catch (err) {
      setSaveNotice('Không thể lưu vào Sổ tay (lỗi trình duyệt).');
    } finally {
      setTimeout(() => setSaveNotice(''), 2800);
    }
  }, [questions, data.section]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Báo cáo kết quả thi</h2>
            <p className="text-sm text-slate-500">{data.section || 'Digital SAT Practice'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-8">
          {/* Score Card */}
          <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 text-white p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/70">Điểm số quy đổi (Scaled Score)</p>
                  <p className="text-4xl font-bold tracking-tight">
                    {scaledScore}
                    <span className="text-lg font-medium text-white/70"> / 800</span>
                  </p>
                </div>
              </div>
              <span className={`self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-semibold ${branchBadgeStyle} bg-white/95`}>
                {branchLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
                  <Target className="w-4 h-4" />
                  Tỷ lệ làm đúng
                </div>
                <p className="text-xl font-semibold">{accuracyPercent}%</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
                  <CheckCheck className="w-4 h-4" />
                  Số câu đúng
                </div>
                <p className="text-xl font-semibold">
                  {correctCount} / {totalQuestions}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
                  <Clock className="w-4 h-4" />
                  Thời gian TB / câu
                </div>
                <p className="text-xl font-semibold">
                  {avgTimePerQuestion > 0 ? formatSeconds(avgTimePerQuestion) : '—'}
                </p>
              </div>
            </div>
          </section>

          {/* Domain performance */}
          <section>
            <h3 className="text-base font-semibold text-slate-800 mb-3">
              Phân tích năng lực theo Domain
            </h3>
            {domainList.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu phân tích theo domain.</p>
            ) : (
              <div className="space-y-3">
                {domainList.map((item) => (
                  <div
                    key={item.domain}
                    className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{item.domain}</span>
                      <div className={`flex items-center gap-1.5 text-sm font-semibold ${getBarTextColor(item.percentage)}`}>
                        {item.percentage >= 70 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {item.percentage}%
                        <span className="text-xs font-normal text-slate-400">
                          ({item.correct}/{item.total})
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getBarColor(item.percentage)} transition-all`}
                        style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Review matrix */}
          <section>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-base font-semibold text-slate-800">Ma trận rà soát câu hỏi</h3>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setFilter(FILTERS.ALL)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    filter === FILTERS.ALL
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  Tất cả ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter(FILTERS.CORRECT)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    filter === FILTERS.CORRECT
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Chỉ câu đúng ({questions.filter((q) => q && q.isCorrect).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter(FILTERS.INCORRECT)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    filter === FILTERS.INCORRECT
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Chỉ câu sai/Bỏ trống ({questions.filter((q) => q && !q.isCorrect).length})
                </button>
              </div>
            </div>

            {filteredQuestions.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                Không có câu hỏi nào khớp với bộ lọc hiện tại.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredQuestions.map((q, idx) => (
                  <QuestionReviewCard key={q?.id ?? idx} question={q} index={idx} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
          {saveNotice && (
            <div className="mb-3 text-sm text-center text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg py-2 px-3">
              {saveNotice}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleSaveMistakes}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4" />
              Lưu tất cả câu sai vào Sổ tay
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors sm:ml-auto cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Làm lại bài thi
            </button>
            <button
              type="button"
              onClick={onHome}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}