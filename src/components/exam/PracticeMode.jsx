import React, { useState, useEffect } from 'react';
import { Bookmark, CheckCircle2, XCircle, Grid, Strikethrough, X } from 'lucide-react';

export default function PracticeMode({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  onNext,
  onPrev,
  isMarked,
  onToggleMark,
  answers = {},
  markedQuestions = {},
  onJumpToIndex
}) {
  const [isChecked, setIsChecked] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState({});
  const [isEliminateMode, setIsEliminateMode] = useState(false);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);

  useEffect(() => {
    setIsChecked(false);
  }, [question?.id]);

  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white text-slate-500 font-medium">
        Không tìm thấy câu hỏi phù hợp.
      </div>
    );
  }

  const isCorrect = selectedAnswer === question.correctAnswer;
  const currentEliminated = eliminatedOptions[question.id] || [];

  const toggleEliminate = (key, e) => {
    e.stopPropagation();
    setEliminatedOptions(prev => {
      const current = prev[question.id] || [];
      const updated = current.includes(key)
        ? current.filter(k => k !== key)
        : [...current, key];
      return { ...prev, [question.id]: updated };
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white relative">
      {/* Header Bar */}
      <div className="h-11 bg-slate-900 text-white text-xs px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wide">Mã đề: Question Bank Practice</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">Chế độ Luyện tập</span>
        </div>

        {/* Toolbar Tools */}
        <div className="flex items-center gap-2">
          {/* Nút bật/tắt Strikethrough tool */}
          <button
            type="button"
            onClick={() => setIsEliminateMode(!isEliminateMode)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              isEliminateMode 
                ? 'bg-amber-500 text-white shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Bật/Tắt công cụ gạch loại trừ đáp án"
          >
            <Strikethrough className="w-3.5 h-3.5" />
            <span>Gạch đáp án {isEliminateMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Nút mở Lưới điều hướng câu hỏi */}
          <button
            type="button"
            onClick={() => setIsNavigatorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Câu {currentIndex + 1} / {totalQuestions}</span>
          </button>
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* CỘT TRÁI: Reading Passage */}
        <div className="w-1/2 p-8 border-r border-slate-200 overflow-y-auto leading-relaxed text-slate-800 text-sm font-serif">
          <p className="whitespace-pre-line leading-7 text-justify">{question.passage}</p>
        </div>

        {/* CỘT PHẢI: Câu hỏi & Đáp án */}
        <div className="w-1/2 p-8 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {currentIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={onToggleMark}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                    isMarked
                      ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
                      : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>Mark for review</span>
                </button>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-6 leading-relaxed">
              {question.question}
            </h3>

            <div className="space-y-3">
              {question.options?.map((opt) => {
                const isSelected = selectedAnswer === opt.key;
                const isEliminated = currentEliminated.includes(opt.key);
                let optionStyle = 'border-slate-200 hover:border-slate-300 bg-white';

                if (isSelected && !isChecked) {
                  optionStyle = 'border-brand-800 bg-brand-50/40 text-brand-900 ring-1 ring-brand-800';
                }

                if (isChecked) {
                  if (opt.key === question.correctAnswer) {
                    optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20';
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'border-rose-500 bg-rose-50 text-rose-900';
                  }
                }

                return (
                  <div key={opt.key} className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isChecked}
                      onClick={() => {
                        if (!isChecked && !isEliminated) onSelectAnswer(opt.key);
                      }}
                      className={`flex-1 p-4 rounded-xl border text-left flex items-start gap-4 transition ${optionStyle} ${
                        isEliminated ? 'opacity-40 line-through bg-slate-50' : ''
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-brand-800 text-brand-800 bg-white' : 'border-slate-300 text-slate-500'
                      }`}>
                        {opt.key}
                      </span>
                      <span className="text-xs font-medium pt-0.5 leading-normal">{opt.text}</span>
                    </button>

                    {/* Nút bấm gạch loại trừ đáp án khi bật công cụ */}
                    {isEliminateMode && !isChecked && (
                      <button
                        type="button"
                        onClick={(e) => toggleEliminate(opt.key, e)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition shrink-0 ${
                          isEliminated
                            ? 'bg-rose-50 text-rose-600 border-rose-300'
                            : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                        title="Gạch loại trừ đáp án này"
                      >
                        <Strikethrough className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lời giải chi tiết */}
            {isChecked && (
              <div className={`mt-6 p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}`}>
                <div className="flex items-center gap-2 font-bold text-xs mb-1.5">
                  {isCorrect ? (
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Chính xác!
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Chưa chính xác. Đáp án đúng là {question.correctAnswer}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <b>Giải thích:</b> {question.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl disabled:opacity-30 hover:bg-slate-50 transition"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (selectedAnswer) setIsChecked(true);
                }}
                disabled={!selectedAnswer}
                className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition disabled:opacity-40 shadow-sm"
              >
                Check
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={currentIndex === totalQuestions - 1}
                className="px-6 py-2 bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-xl transition disabled:opacity-40 shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP LƯỚI ĐIỀU HƯỚNG CÂU HỎI (QUESTION NAVIGATOR MODAL) */}
      {isNavigatorOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-brand-800" />
                <h4 className="font-bold text-sm text-slate-900">Danh sách câu hỏi</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsNavigatorOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chú thích màu sắc */}
            <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-brand-800"></span>
                <span>Đang làm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-200"></span>
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-slate-300"></span>
                <span>Chưa làm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Bookmark</span>
              </div>
            </div>

            {/* Grid các ô câu hỏi */}
            <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1">
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answers[idx]; // hoặc answers theo questionId
                const isBookmarked = !!markedQuestions[idx];

                let boxClass = 'border-slate-200 text-slate-700 bg-white hover:border-slate-400';
                if (isCurrent) {
                  boxClass = 'bg-brand-800 text-white font-bold border-brand-800 shadow-sm';
                } else if (isAnswered) {
                  boxClass = 'bg-slate-200 text-slate-800 font-bold border-slate-300';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (onJumpToIndex) onJumpToIndex(idx);
                      setIsNavigatorOpen(false);
                    }}
                    className={`h-10 rounded-xl border text-xs font-semibold relative flex items-center justify-center transition ${boxClass}`}
                  >
                    <span>{idx + 1}</span>
                    {isBookmarked && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}