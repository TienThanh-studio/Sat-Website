import React from 'react';
import { X, Bookmark } from 'lucide-react';

export default function MatrixModal({
  isOpen = false,
  onClose = () => {},
  questions = [],
  currentIndex = 0,
  onSelectIndex = () => {},
  answers = {},
  marked = {}
}) {
  if (!isOpen) return null;

  const list = Array.isArray(questions) ? questions : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl p-6 flex flex-col space-y-5 animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Question Navigation Matrix</h3>
            <p className="text-[11px] text-slate-400">Chọn câu hỏi để di chuyển nhanh</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chú thích trạng thái */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-md border-2 border-indigo-600 bg-indigo-50 inline-block"></span>
            <span>Đang xem</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-md bg-indigo-600 inline-block"></span>
            <span>Đã làm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-md bg-slate-100 border border-slate-300 inline-block"></span>
            <span>Chưa làm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Bookmark</span>
          </div>
        </div>

        {/* Lưới câu hỏi */}
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {list.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-slate-400">
              Không có câu hỏi nào trong danh sách.
            </div>
          ) : (
            list.map((q, idx) => {
              const qId = q?.id ?? idx;
              const isCurrent = idx === currentIndex;
              const isAnswered = answers[qId] !== undefined && answers[qId] !== '';
              const isMarked = Boolean(marked[qId]);

              return (
                <button
                  key={qId}
                  type="button"
                  onClick={() => {
                    onSelectIndex(idx);
                    onClose();
                  }}
                  className={`relative h-10 rounded-xl font-bold text-xs flex items-center justify-center transition cursor-pointer ${
                    isCurrent
                      ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : isAnswered
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{idx + 1}</span>
                  {isMarked && (
                    <span className="absolute -top-1 -right-1">
                      <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}