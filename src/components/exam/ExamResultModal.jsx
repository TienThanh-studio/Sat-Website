import React, { useMemo, useState } from 'react';
import {
  X, RotateCcw, CheckCircle2, XCircle,
  BookmarkPlus, BookmarkCheck, ListFilter, Award
} from 'lucide-react';
import MathRenderer from '../common/MathRenderer';

const MISTAKE_STORAGE_KEY = 'sat_mistakes';

function readSavedMistakes() {
  try {
    const raw = localStorage.getItem(MISTAKE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function saveMistakesToNotebook(wrongQuestions) {
  const existing = readSavedMistakes();
  const existingIds = new Set(existing.map((q) => q.id));
  const newOnes = wrongQuestions.filter((q) => !existingIds.has(q.id));
  const merged = [...existing, ...newOnes];
  try {
    localStorage.setItem(MISTAKE_STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    return 0;
  }
  return newOnes.length;
}

const FILTERS = {
  ALL: 'all',
  WRONG: 'wrong',
  CORRECT: 'correct',
};

function stripMathForPreview(text) {
  if (!text) return '';
  const plain = String(text).replace(/\$+/g, '').replace(/<[^>]*>/g, '').trim();
  return plain.length > 70 ? `${plain.slice(0, 70)}…` : plain;
}

export default function ExamResultModal({ resultData, onRetry, onClose }) {
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [savedCount, setSavedCount] = useState(null);

  const questions = resultData?.gradedItems || resultData?.questions || [];

  const filteredQuestions = useMemo(() => {
    if (filter === FILTERS.WRONG) return questions.filter((q) => !q.isCorrect);
    if (filter === FILTERS.CORRECT) return questions.filter((q) => q.isCorrect);
    return questions;
  }, [questions, filter]);

  const wrongQuestions = useMemo(() => questions.filter((q) => !q.isCorrect), [questions]);

  if (!resultData) return null;

  const {
    scaledScore = 200,
    totalCorrect = 0,
    totalQuestions = 0,
    accuracy = 0,
    branch = 'hard',
  } = resultData;

  const handleSaveMistakes = () => {
    const added = saveMistakesToNotebook(wrongQuestions);
    setSavedCount(added);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white px-6 py-6 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" /> Báo cáo kết quả bài thi Digital SAT
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <span className="text-5xl sm:text-6xl font-extrabold leading-none tracking-tight font-mono">
              {scaledScore}
            </span>
            <span className="text-indigo-200 text-sm font-semibold mb-1">/ 800 điểm</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                branch === 'hard'
                  ? 'bg-amber-400 text-amber-950'
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              Module 2: {branch === 'hard' ? 'Hard (Nâng cao)' : 'Easy (Cơ bản)'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
              {totalCorrect}/{totalQuestions} câu đúng
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
              Độ chính xác: {accuracy}%
            </span>
          </div>
        </div>

        {/* Toolbar: filter + save button */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <ListFilter size={16} className="text-slate-400" />
            {[
              { key: FILTERS.ALL, label: 'Tất cả' },
              { key: FILTERS.WRONG, label: `Câu sai (${wrongQuestions.length})` },
              { key: FILTERS.CORRECT, label: `Câu đúng (${totalCorrect})` },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filter === f.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveMistakes}
            disabled={wrongQuestions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {savedCount !== null ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
            {savedCount === null
              ? 'Lưu câu sai vào Sổ tay'
              : `Đã lưu (${savedCount} câu mới)`}
          </button>
        </div>

        {/* Question review list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {filteredQuestions.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-10">
              Không có câu hỏi nào trong bộ lọc này.
            </p>
          )}

          {filteredQuestions.map((q, index) => {
            const isOpen = activeQuestionId === (q.id ?? index);
            return (
              <div
                key={q.id ?? index}
                className={`rounded-xl border overflow-hidden transition-colors ${
                  q.isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveQuestionId(isOpen ? null : (q.id ?? index))}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer ${
                    q.isCorrect ? 'bg-emerald-50/70 hover:bg-emerald-50' : 'bg-rose-50/70 hover:bg-rose-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {q.isCorrect ? (
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-rose-600 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-slate-800 shrink-0">
                      Câu {q.questionNumber || index + 1}
                    </span>
                    <span className="text-xs text-slate-500 truncate">
                      {stripMathForPreview(q.prompt || q.content)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 shrink-0">
                    {isOpen ? 'Thu gọn' : 'Xem chi tiết'}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 py-4 bg-white space-y-3 border-t border-slate-100">
                    <div className="text-slate-800 text-sm leading-relaxed font-serif">
                      <MathRenderer text={q.prompt || q.content} />
                    </div>

                    {q.question && (
                      <div className="font-semibold text-xs text-slate-900">
                        <MathRenderer text={q.question} />
                      </div>
                    )}

                    {/* Phương án trắc nghiệm */}
                    {!q.isGridIn && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {Object.entries(q.options).map(([key, label]) => {
                          const optText = typeof label === 'string' ? label : (label?.text || '');
                          const isUserChoice = String(q.userAnswer).toUpperCase() === key.toUpperCase();
                          const isCorrectChoice = String(q.correctAnswer).toUpperCase() === key.toUpperCase();

                          let style = 'border-slate-200 bg-slate-50 text-slate-700';
                          if (isCorrectChoice) {
                            style = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-medium ring-1 ring-emerald-400';
                          }
                          if (isUserChoice && !isCorrectChoice) {
                            style = 'border-rose-300 bg-rose-50 text-rose-900 font-medium';
                          }

                          return (
                            <div
                              key={key}
                              className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs ${style}`}
                            >
                              <span className="font-bold shrink-0">{key}.</span>
                              <span className="flex-1 font-serif">
                                <MathRenderer text={optText} />
                              </span>
                              {isUserChoice && (
                                <span className="ml-auto text-[10px] uppercase font-bold text-slate-500">
                                  Bạn chọn
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Câu tự điền số (SPR) */}
                    {q.isGridIn && (
                      <div className="flex flex-wrap gap-4 text-xs p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-500 mr-1.5">Bạn đã điền:</span>
                          <span className={`font-mono font-bold ${q.isCorrect ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {q.userAnswer || '(bỏ trống)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 mr-1.5">Đáp án chuẩn:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {q.correctAnswer} {q.acceptedAnswers ? `(Chấp nhận: ${q.acceptedAnswers.join(', ')})` : ''}
                          </span>
                        </div>
                      </div>
                    )}

                    {q.explanation && (
                      <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3 text-xs leading-relaxed text-slate-700">
                        <p className="font-bold text-indigo-700 uppercase tracking-wider text-[10px] mb-1">
                          Giải thích chi tiết
                        </p>
                        <MathRenderer text={q.explanation} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
          >
            <RotateCcw size={15} />
            Làm lại bài thi
          </button>
        </div>
      </div>
    </div>
  );
}