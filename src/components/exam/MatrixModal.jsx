// src/components/exam/MatrixModal.jsx
import React from 'react';
import { X, CheckCircle2, Bookmark, HelpCircle, Filter } from 'lucide-react';

export default function MatrixModal({
  isOpen,
  onClose,
  questions = [],
  currentIndex,
  answers = {},
  bookmarked = {},
  onSelectIndex,
  filterMode = 'all',
  onFilterChange,
}) {
  if (!isOpen) return null;

  const filteredQuestions = questions.map((q, idx) => ({
    index: idx,
    isAnswered: answers[idx] !== undefined && answers[idx] !== '',
    isBookmarked: Boolean(bookmarked[idx]),
  })).filter((item) => {
    if (filterMode === 'answered') return item.isAnswered;
    if (filterMode === 'unanswered') return !item.isAnswered;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm font-sans select-none">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-extrabold text-slate-900">Danh Mục Câu Hỏi (Question Navigator)</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BỘ LỌC CÂU HỎI: TẤT CẢ / CHƯA LÀM / ĐÃ LÀM */}
        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-slate-600 pl-2">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bộ lọc:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'unanswered', label: 'Chưa làm' },
              { id: 'answered', label: 'Đã làm' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterChange && onFilterChange(f.id)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  filterMode === f.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 max-h-72 overflow-y-auto p-1">
          {filteredQuestions.map(({ index, isAnswered, isBookmarked }) => {
            const isCurrent = index === currentIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onSelectIndex(index);
                  onClose();
                }}
                className={`h-12 rounded-2xl border flex flex-col items-center justify-center relative font-mono text-xs font-bold transition cursor-pointer ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-600 text-white ring-2 ring-indigo-600/20'
                    : isAnswered
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{index + 1}</span>
                {isBookmarked && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}