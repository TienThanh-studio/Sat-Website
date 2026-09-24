import React, { useState } from 'react';
import { Bookmark, Send, AlertTriangle } from 'lucide-react';

export default function RealExamMode({
  questions = [],
  currentIndex,
  setCurrentIndex,
  answers = {},
  onSelectAnswer,
  markedQuestions = {},
  onToggleMark,
  onSubmitExam
}) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Bảo vệ: Nếu danh sách câu hỏi chưa sẵn sàng
  if (!questions || questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Đang tải dữ liệu câu hỏi...
      </div>
    );
  }

  const currentQ = questions[currentIndex] || questions[0];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Phần làm bài 2 cột */}
      <div className="flex-1 flex overflow-hidden">
        {/* Cột trái: Passage */}
        <div className="w-1/2 p-8 border-r border-slate-200 overflow-y-auto text-sm font-serif leading-7 text-justify text-slate-800">
          <p className="whitespace-pre-line">{currentQ?.passage}</p>
        </div>

        {/* Cột giữa: Câu hỏi */}
        <div className="w-1/2 p-8 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-7 h-7 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                {currentIndex + 1}
              </span>
              <button
                onClick={() => onToggleMark(currentQ?.id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                  markedQuestions[currentQ?.id]
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'text-slate-500 border-slate-200'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${markedQuestions[currentQ?.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>Mark for review</span>
              </button>
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-6">{currentQ?.question}</h3>

            <div className="space-y-3">
              {currentQ?.options?.map(opt => {
                const isSelected = answers[currentQ?.id] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => onSelectAnswer(currentQ?.id, opt.key)}
                    className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition ${
                      isSelected
                        ? 'border-brand-800 bg-brand-50/40 text-brand-900 font-medium'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-brand-800 text-brand-800 bg-white' : 'border-slate-300 text-slate-500'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="text-xs pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Điều hướng Next/Back */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl disabled:opacity-30"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-6 py-2 bg-brand-800 text-white font-bold text-xs rounded-xl disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: QUESTION PALETTE */}
      <div className="w-64 bg-slate-50 border-l border-slate-200 p-5 flex flex-col justify-between shrink-0">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Question Palette</h4>
          <p className="text-[11px] text-slate-500 mb-4">
            Đã làm: <b>{answeredCount}</b> / {questions.length} câu
          </p>

          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isMark = !!markedQuestions[q.id];
              const isCurrent = idx === currentIndex;

              let btnStyle = 'bg-white border-slate-200 text-slate-600';
              if (isAnswered) btnStyle = 'bg-slate-800 text-white border-slate-800';
              if (isMark) btnStyle = 'bg-amber-400 text-slate-900 border-amber-500';
              if (isCurrent) btnStyle += ' ring-2 ring-brand-800';

              return (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-lg text-xs font-bold border flex items-center justify-center transition ${btnStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nút nộp bài */}
        <button
          onClick={() => setShowConfirmModal(true)}
          className="w-full py-3 bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Nộp bài thi</span>
        </button>
      </div>

      {/* Modal xác nhận */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-900 mb-1">Bạn có chắc chắn nộp bài?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Bạn đã hoàn thành <b>{answeredCount}</b>/{questions.length} câu hỏi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 text-xs font-bold border border-slate-200 text-slate-600 rounded-xl"
              >
                Tiếp tục làm
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  onSubmitExam();
                }}
                className="flex-1 py-2.5 text-xs font-bold bg-brand-800 text-white rounded-xl"
              >
                Xác nhận nộp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}