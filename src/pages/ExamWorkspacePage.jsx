import React, { useState, useEffect } from 'react';
import { 
  X, Bookmark, ChevronRight, Calculator, BookOpen, 
  ArrowLeft, RotateCcw, Highlighter
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import MatrixModal from '../components/exam/MatrixModal';

export default function ExamWorkspacePage({ 
  sessionConfig, 
  onExit = () => {}
}) {
  const questions = Array.isArray(sessionConfig?.questions) ? sessionConfig.questions : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [eliminatedOptions, setEliminatedOptions] = useState({});
  const [isEliminateMode, setIsEliminateMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => Number(sessionConfig?.duration) || 1800);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Modals
  const [showMatrix, setShowMatrix] = useState(false);
  const [showDesmos, setShowDesmos] = useState(false);
  const [showReference, setShowReference] = useState(false);

  // Floating Underline
  const [floatingPos, setFloatingPos] = useState(null);

  const currentQ = questions[currentIndex] || null;

  // Kiểm tra câu hỏi hiện tại có phải môn Toán hay không
  const isMathSection = Boolean(
    sessionConfig?.section?.toLowerCase()?.includes('math') ||
    sessionConfig?.category?.toLowerCase()?.includes('algebra') ||
    sessionConfig?.title?.toLowerCase()?.includes('algebra') ||
    currentQ?.section?.toLowerCase()?.includes('math') ||
    currentQ?.category?.toLowerCase()?.includes('algebra')
  );

  // Đếm ngược thời gian
  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  // Bắt sự kiện bôi đen văn bản
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setFloatingPos(null);
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setFloatingPos(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setFloatingPos({
        top: rect.top + window.scrollY - 36,
        left: rect.left + window.scrollX + rect.width / 2
      });
    };

    const handleMouseDown = (e) => {
      if (!e.target.closest('#floating-underline-btn')) {
        setFloatingPos(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const applyUnderline = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'underline decoration-amber-500 decoration-2 bg-amber-100/70 text-slate-900 cursor-pointer px-0.5 rounded-xs';
    span.title = 'Click đúp để xóa gạch chân';

    span.ondblclick = () => {
      span.replaceWith(...span.childNodes);
    };

    try {
      range.surroundContents(span);
      selection.removeAllRanges();
      setFloatingPos(null);
    } catch (err) {
      setFloatingPos(null);
    }
  };

  const handleSelectOption = (key) => {
    if (isSubmitted || isEliminateMode || !currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: key }));
  };

  const handleToggleEliminate = (e, key) => {
    e.stopPropagation();
    if (isSubmitted || !currentQ) return;
    setEliminatedOptions(prev => {
      const qElims = prev[currentQ.id] || [];
      const updated = qElims.includes(key) 
        ? qElims.filter(k => k !== key) 
        : [...qElims, key];
      return { ...prev, [currentQ.id]: updated };
    });
  };

  const handleToggleMark = () => {
    if (!currentQ) return;
    setMarked(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleSubmitExam = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    const mistakeList = [];
    questions.forEach(q => {
      const userAns = answers[q.id];
      if (userAns !== q.correctAnswer) {
        mistakeList.push({
          ...q,
          userAnswer: userAns || 'Chưa trả lời',
          date: new Date().toLocaleDateString()
        });
      }
    });

    const existing = JSON.parse(localStorage.getItem('sat_mistakes') || '[]');
    const combined = [...mistakeList, ...existing.filter(e => !mistakeList.some(m => m.id === e.id))];
    localStorage.setItem('sat_mistakes', JSON.stringify(combined));
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-600 font-bold mb-4">Không tìm thấy câu hỏi trong bài thi.</p>
          <button onClick={onExit} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const qElims = eliminatedOptions[currentQ.id] || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans select-text">
      {/* Floating Underline Tooltip */}
      {floatingPos && (
        <button
          id="floating-underline-btn"
          onMouseDown={applyUnderline}
          style={{ 
            top: `${floatingPos.top}px`, 
            left: `${floatingPos.left}px`,
            transform: 'translateX(-50%)'
          }}
          className="fixed z-50 flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-amber-300 rounded-full shadow-2xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition active:scale-95"
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span className="underline font-black">Underline</span>
        </button>
      )}

      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-4">
          <button 
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <span className="text-xs font-bold text-slate-800">
            {sessionConfig?.title || 'SAT Examination'}
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
            isMathSection ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {isMathSection ? 'Math Section' : 'Reading & Writing'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-mono font-bold text-xs text-slate-800">
            {formatTimer(timeLeft)}
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Reference Sheet & Desmos Calculator: Chỉ xuất hiện khi làm Math */}
          {isMathSection && (
            <>
              <button
                type="button"
                onClick={() => setShowReference(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                title="Bảng công thức hình học College Board"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Reference</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDesmos(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                title="Máy tính đồ thị Desmos chuẩn SAT"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span>Calculator</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsEliminateMode(!isEliminateMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              isEliminateMode 
                ? 'bg-rose-600 text-white border-rose-600' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span className="line-through">ABC</span>
            <span>{isEliminateMode ? 'Đang loại trừ' : 'Gạch đáp án'}</span>
          </button>
        </div>
      </header>

      {/* 2 Cột bài làm */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
        {/* Đề bài */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-100 pb-2">
              <span>CÂU {currentIndex + 1} / {questions.length}</span>
              <button
                type="button"
                onClick={handleToggleMark}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                  marked[currentQ.id]
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{marked[currentQ.id] ? 'Đã Bookmark' : 'Bookmark'}</span>
              </button>
            </div>

            <div className="text-sm text-slate-800 leading-relaxed font-serif pt-2 whitespace-pre-line selection:bg-amber-200">
              <MathRenderer text={currentQ.prompt || currentQ.passage || ''} />
            </div>
          </div>
        </div>

        {/* Câu hỏi & Đáp án */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-3 font-serif">
              <MathRenderer text={currentQ.question || ''} />
            </div>

            {currentQ.isGridIn ? (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Điền câu trả lời của bạn:</label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                  placeholder="Nhập số hoặc phân số (ví dụ: 1.5 hoặc 16/17)"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {currentQ.options && Object.entries(currentQ.options).map(([key, val]) => {
                  const isSelected = answers[currentQ.id] === key;
                  const isElim = qElims.includes(key);

                  return (
                    <div
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isElim 
                          ? 'opacity-40 bg-slate-100 border-slate-200 line-through' 
                          : isSelected 
                            ? 'bg-indigo-50 border-indigo-500 shadow-2xs' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {key}
                        </span>
                        <div className="text-xs text-slate-800 font-serif">
                          <MathRenderer text={val} />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleToggleEliminate(e, key)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition text-xs font-bold"
                        title="Loại bỏ phương án"
                      >
                        {isElim ? <RotateCcw className="w-4 h-4 text-slate-600" /> : <X className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {isSubmitted && (
            <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-emerald-800">Đáp án chuẩn: ({currentQ.correctAnswer})</span>
              {currentQ.explanation && (
                <p className="text-slate-600 pt-1 font-serif">{currentQ.explanation}</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="h-16 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => setShowMatrix(true)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>Câu {currentIndex + 1} / {questions.length}</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 transition cursor-pointer"
          >
            Câu trước
          </button>
          
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Câu kế tiếp
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitExam}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Nộp bài thi
            </button>
          )}
        </div>
      </footer>

      {/* Modals */}
      <MatrixModal
        isOpen={showMatrix}
        onClose={() => setShowMatrix(false)}
        questions={questions}
        currentIndex={currentIndex}
        onSelectIndex={(idx) => setCurrentIndex(idx)}
        answers={answers}
        marked={marked}
      />

      <DesmosModal
        isOpen={showDesmos}
        onClose={() => setShowDesmos(false)}
      />

      <ReferenceModal
        isOpen={showReference}
        onClose={() => setShowReference(false)}
      />
    </div>
  );
}