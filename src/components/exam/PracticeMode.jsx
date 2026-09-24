import React, { useState } from 'react';
import { Bookmark, CheckCircle2, XCircle, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';

export default function PracticeMode({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  onNext,
  onPrev,
  isMarked,
  onToggleMark
}) {
  const [isChecked, setIsChecked] = useState(false);

  // Khi chuyển câu hỏi mới thì reset trạng thái Check
  React.useEffect(() => {
    setIsChecked(false);
  }, [question.id]);

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header bar nhỏ trong bài làm */}
      <div className="h-10 bg-slate-900 text-white text-xs px-6 flex items-center justify-between">
        <span className="font-semibold tracking-wide">Mã đề: Question Bank Phase 2</span>
        <span className="text-slate-400">Chế độ Luyện tập (Instant Feedback)</span>
      </div>

      {/* Main Split Screen: Trái là Passage, Phải là Questions */}
      <div className="flex-1 flex overflow-hidden">
        {/* CỘT TRÁI: Reading Passage */}
        <div className="w-1/2 p-8 border-r border-slate-200 overflow-y-auto leading-relaxed text-slate-800 text-sm font-serif">
          <p className="whitespace-pre-line leading-7 text-justify">{question.passage}</p>
        </div>

        {/* CỘT PHẢI: Câu hỏi & Các lựa chọn A, B, C, D */}
        <div className="w-1/2 p-8 overflow-y-auto flex flex-col justify-between">
          <div>
            {/* Thanh đánh dấu & Câu số mấy */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  {currentIndex + 1}
                </span>
                <button
                  onClick={onToggleMark}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                    isMarked
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>Mark for review</span>
                </button>
              </div>
            </div>

            {/* Nội dung câu hỏi */}
            <h3 className="text-sm font-bold text-slate-900 mb-6 leading-relaxed">
              {question.question}
            </h3>

            {/* Danh sách 4 đáp án A, B, C, D */}
            <div className="space-y-3">
              {question.options.map((opt) => {
                const isSelected = selectedAnswer === opt.key;
                let optionStyle = 'border-slate-200 hover:border-slate-300 bg-white';

                if (isSelected && !isChecked) {
                  optionStyle = 'border-brand-800 bg-brand-50/40 text-brand-900';
                }

                if (isChecked) {
                  if (opt.key === question.correctAnswer) {
                    optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20';
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'border-rose-500 bg-rose-50 text-rose-900';
                  }
                }

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      if (!isChecked) onSelectAnswer(opt.key);
                    }}
                    className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition ${optionStyle}`}
                  >
                    <span className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-brand-800 text-brand-800 bg-white' : 'border-slate-300 text-slate-500'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="text-xs font-medium pt-0.5 leading-normal">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Khung giải thích chi tiết khi nhấn Check */}
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

          {/* Footer Controls: Back, Check, Next */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl disabled:opacity-30 hover:bg-slate-50"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsChecked(true)}
                disabled={!selectedAnswer}
                className="px-5 py-2 bg-blue-400 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-40"
              >
                Check
              </button>
              <button
                onClick={onNext}
                disabled={currentIndex === totalQuestions - 1}
                className="px-6 py-2 bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-xl transition disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}