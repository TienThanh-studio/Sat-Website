import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, MapPin, CheckCircle2, HelpCircle } from 'lucide-react';

export default function MatrixModal({
  isOpen,
  onClose,
  questions = [],
  currentIndex = 0,
  answers = {},
  bookmarked = {},
  marked = {},
  markedQuestions = new Set(),
  onSelectIndex,
  onSelectQuestion,
  onSelect
}) {
  const handleSelect = (idx) => {
    if (onSelectIndex) onSelectIndex(idx);
    else if (onSelectQuestion) onSelectQuestion(idx);
    else if (onSelect) onSelect(idx);
    if (onClose) onClose();
  };

  // Kiểm tra trạng thái đánh dấu tương thích với mọi kiểu truyền props
  const checkIsMarked = (idx, qId) => {
    if (bookmarked && bookmarked[idx]) return true;
    if (marked && (marked[idx] || marked[qId])) return true;
    if (markedQuestions instanceof Set && (markedQuestions.has(idx) || markedQuestions.has(qId))) return true;
    return false;
  };

  // Kiểm tra trạng thái đã trả lời tương thích cả index lẫn question.id
  const checkIsAnswered = (idx, qId) => {
    const byIdx = answers[idx] !== undefined && answers[idx] !== '';
    const byId = qId && answers[qId] !== undefined && answers[qId] !== '';
    return Boolean(byIdx || byId);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 28, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.012
      }
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.96,
      transition: { duration: 0.15, ease: 'easeIn' }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 }
  };

  const answeredCount = questions.filter((q, idx) => checkIsAnswered(idx, q?.id)).length;
  const markedCount = questions.filter((q, idx) => checkIsMarked(idx, q?.id)).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:pb-20 p-4 font-sans select-none">
          {/* Backdrop mờ nhẹ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px]"
          />

          {/* Popover Card */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-5 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Question Navigator
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Đã làm <strong className="text-indigo-600">{answeredCount}/{questions.length}</strong> câu • Đánh dấu <strong className="text-amber-600">{markedCount}</strong> câu
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chú thích trạng thái (Legend) */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-indigo-600 inline-block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-dashed border-slate-400 bg-white inline-block" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>For Review</span>
              </div>
            </div>

            {/* Lưới câu hỏi với Staggered Animation */}
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2.5 max-h-[280px] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = checkIsAnswered(idx, q?.id);
                const isFlagged = checkIsMarked(idx, q?.id);

                let btnStyle = 'border border-dashed border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:text-indigo-600';
                if (isAnswered) {
                  btnStyle = 'bg-indigo-600 text-white border-solid border-indigo-600 font-bold shadow-xs hover:bg-indigo-700';
                }
                if (isCurrent) {
                  btnStyle += ' ring-2 ring-slate-900 ring-offset-2';
                }

                return (
                  <motion.button
                    key={q?.id || idx}
                    variants={itemVariants}
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    className={`relative h-10 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${btnStyle}`}
                  >
                    <span>{idx + 1}</span>

                    {/* Icon vị trí câu hiện tại */}
                    {isCurrent && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-900" />
                    )}

                    {/* Cờ đánh dấu Review góc trên phải */}
                    {isFlagged && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shadow-2xs">
                        <Bookmark className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}