import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  X, Bookmark, ChevronRight, Calculator, BookOpen, 
  RotateCcw, Highlighter, Eye, EyeOff, LogOut, Award, CheckCircle2
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import MatrixModal from '../components/exam/MatrixModal';
import { calculateSatSectionScore } from '../services/satIrtScoring';

// Component Timer độc lập chống re-render toàn trang và chống Stale Closure
const Timer = memo(function Timer({ duration, isSubmitted, showTimer, onExpire }) {
  const safeDuration = Number(duration) > 0 ? Number(duration) : 1800;
  const [timeLeft, setTimeLeft] = useState(safeDuration);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    setTimeLeft(safeDuration);
  }, [safeDuration]);

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <span className="font-mono font-bold text-lg text-slate-800 tracking-wider">
      {showTimer ? formatTimer(timeLeft) : '--:--'}
    </span>
  );
});

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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [scoreResult, setScoreResult] = useState(null);

  // Modals
  const [showMatrix, setShowMatrix] = useState(false);
  const [showDesmos, setShowDesmos] = useState(false);
  const [showReference, setShowReference] = useState(false);

  // Floating Highlight Tooltip
  const [floatingPos, setFloatingPos] = useState(null);

  // Ref cuộn trang cột trái (đề bài)
  const passageRef = useRef(null);

  const currentQ = questions[currentIndex] || null;

  // Nhận diện bài thi Math để ẩn/hiện công cụ Calculator và Reference Sheet
  const isMathSection = Boolean(
    sessionConfig?.section?.toLowerCase()?.includes('math') ||
    sessionConfig?.category?.toLowerCase()?.includes('algebra') ||
    sessionConfig?.title?.toLowerCase()?.includes('algebra') ||
    currentQ?.section?.toLowerCase()?.includes('math') ||
    currentQ?.category?.toLowerCase()?.includes('algebra')
  );

  // Kẹp an toàn currentIndex khi độ dài questions thay đổi
  useEffect(() => {
    if (questions.length === 0) return;
    setCurrentIndex(i => Math.min(Math.max(0, i), questions.length - 1));
  }, [questions.length]);

  // Xóa tooltip, selection và cuộn về đầu trang khi chuyển câu
  useEffect(() => {
    setFloatingPos(null);
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    if (passageRef.current) {
      passageRef.current.scrollTop = 0;
    }
  }, [currentIndex]);

  // Bắt sự kiện bôi đen để hiện tooltip Highlight
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
        top: rect.top + window.scrollY - 38,
        left: rect.left + window.scrollX + rect.width / 2
      });
    };

    const handleMouseDown = (e) => {
      if (!e.target.closest('#floating-highlight-btn')) {
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

  // Xử lý Highlight màu xanh pastel nhạt
  const applyHighlight = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'bg-sky-100/90 text-sky-950 px-1 py-0.5 rounded cursor-pointer transition hover:bg-sky-200/90 border-b border-sky-300/60';
    span.title = 'Nhấp đúp chuột để xóa highlight';

    span.ondblclick = () => {
      span.replaceWith(...span.childNodes);
    };

    try {
      range.surroundContents(span);
      selection.removeAllRanges();
      setFloatingPos(null);
    } catch {
      setFloatingPos(null);
    }
  }, []);

  const handleSelectOption = useCallback((key) => {
    setAnswers(prev => {
      if (isSubmitted || isEliminateMode || !currentQ) return prev;
      return { ...prev, [currentQ.id]: key };
    });
  }, [isSubmitted, isEliminateMode, currentQ]);

  const handleToggleEliminate = useCallback((e, key) => {
    e.stopPropagation();
    if (isSubmitted || !currentQ) return;
    setEliminatedOptions(prev => {
      const qElims = prev[currentQ.id] || [];
      const updated = qElims.includes(key) 
        ? qElims.filter(k => k !== key) 
        : [...qElims, key];
      return { ...prev, [currentQ.id]: updated };
    });
  }, [isSubmitted, currentQ]);

  const handleToggleMark = useCallback(() => {
    if (!currentQ) return;
    setMarked(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  }, [currentQ]);

  // Nộp bài thi: Tính điểm IRT thực tế và lưu câu sai vào sổ tay
  const handleSubmitExam = useCallback(() => {
    setIsSubmitted(prevSubmitted => {
      if (prevSubmitted) return prevSubmitted;

      const mistakeList = [];
      const responses = questions.map(q => {
        const userAns = answers[q.id];
        const isCorrect = userAns === q.correctAnswer;
        if (!isCorrect) {
          mistakeList.push({
            ...q,
            userAnswer: userAns || 'Chưa trả lời',
            date: new Date().toLocaleDateString()
          });
        }
        return {
          difficulty: q.difficulty || (q.questionNumber > 18 ? 'hard' : q.questionNumber > 8 ? 'medium' : 'easy'),
          correct: isCorrect
        };
      });

      // Chấm điểm bằng thuật toán IRT (3PL Model)
      const irtScore = calculateSatSectionScore({
        module1Responses: responses,
        module2Responses: [],
        forcedBranch: 'hard'
      });
      setScoreResult(irtScore);

      try {
        const existing = JSON.parse(localStorage.getItem('sat_mistakes') || '[]');
        const combined = [...mistakeList, ...existing.filter(e => !mistakeList.some(m => m.id === e.id))];
        localStorage.setItem('sat_mistakes', JSON.stringify(combined));
      } catch (err) {
        console.error('Không thể lưu sat_mistakes vào localStorage:', err);
      }

      return true;
    });
  }, [questions, answers]);

  const goToIndex = useCallback((idx) => {
    setCurrentIndex(() => {
      if (questions.length === 0) return 0;
      return Math.max(0, Math.min(questions.length - 1, idx));
    });
  }, [questions.length]);

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-600 font-bold mb-4">Không tìm thấy câu hỏi trong bài thi.</p>
          <button onClick={onExit} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const qElims = eliminatedOptions[currentQ.id] || [];

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans select-text">
      
      {/* NÚT HIGHLIGHT NỔI */}
      {floatingPos && (
        <button
          id="floating-highlight-btn"
          onMouseDown={applyHighlight}
          style={{ 
            top: `${floatingPos.top}px`, 
            left: `${floatingPos.left}px`,
            transform: 'translateX(-50%)'
          }}
          className="fixed z-50 flex items-center gap-1.5 px-3 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded-full shadow-lg text-xs font-semibold cursor-pointer transition active:scale-95 animate-fadeIn"
        >
          <Highlighter className="w-3.5 h-3.5 text-sky-200" />
          <span>Highlight</span>
        </button>
      )}

      {/* TOP BAR CHUẨN BLUEBOOK */}
      <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white shrink-0 z-20">
        <div className="space-y-0.5">
          <h1 className="font-bold text-slate-900 text-sm tracking-tight">
            {sessionConfig?.title || 'Digital SAT Practice'}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">
            {isMathSection ? 'Math Section' : 'Reading & Writing'} • {sessionConfig?.category || 'Official Practice'}
          </p>
        </div>

        {/* TIMER ĐỘC LẬP */}
        <div className="flex flex-col items-center">
          <Timer
            duration={sessionConfig?.duration}
            isSubmitted={isSubmitted}
            showTimer={showTimer}
            onExpire={handleSubmitExam}
          />
          <button
            type="button"
            onClick={() => setShowTimer(prev => !prev)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition px-2 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            {showTimer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{showTimer ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        {/* CỤM NÚT CÔNG CỤ */}
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => {
              const selection = window.getSelection();
              if (selection && !selection.isCollapsed) {
                applyHighlight({ preventDefault: () => {}, stopPropagation: () => {} });
              } else {
                alert('Hãy bôi đen một đoạn văn bản trong đề thi để highlight.');
              }
            }}
            className="flex flex-col items-center group text-slate-600 hover:text-sky-700 transition cursor-pointer"
            title="Đánh dấu đoạn văn bản"
          >
            <Highlighter className="w-4 h-4 mb-0.5 group-hover:scale-110 transition" />
            <span className="text-[11px] font-medium">Highlight</span>
          </button>

          {isMathSection && (
            <button
              type="button"
              onClick={() => setShowDesmos(true)}
              className="flex flex-col items-center group text-slate-600 hover:text-indigo-600 transition cursor-pointer"
              title="Máy tính đồ thị Desmos"
            >
              <Calculator className="w-4 h-4 mb-0.5 group-hover:scale-110 transition" />
              <span className="text-[11px] font-medium">Calculator</span>
            </button>
          )}

          {isMathSection && (
            <button
              type="button"
              onClick={() => setShowReference(true)}
              className="flex flex-col items-center group text-slate-600 hover:text-indigo-600 transition cursor-pointer"
              title="Bảng công thức hình học"
            >
              <BookOpen className="w-4 h-4 mb-0.5 group-hover:scale-110 transition" />
              <span className="text-[11px] font-medium">Reference</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExit}
            className="flex flex-col items-center group text-slate-600 hover:text-rose-600 transition cursor-pointer"
            title="Lưu tiến trình và thoát bài thi"
          >
            <LogOut className="w-4 h-4 mb-0.5 group-hover:scale-110 transition" />
            <span className="text-[11px] font-medium">Save & Exit</span>
          </button>
        </div>
      </header>

      {/* KHU VỰC LÀM BÀI 2 CỘT */}
      <main className="flex-1 w-full max-w-[1550px] mx-auto px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden">
        {/* CỘT TRÁI: ĐỀ BÀI */}
        <div ref={passageRef} className="h-full flex flex-col overflow-y-auto pr-4 border-r border-slate-200/80">
          <div className="text-[14px] text-slate-800 leading-[1.8] font-serif selection:bg-sky-200">
            <MathRenderer text={currentQ.prompt || currentQ.passage || ''} />
          </div>
        </div>

        {/* CỘT PHẢI: CÂU HỎI & ĐÁP ÁN */}
        <div className="h-full flex flex-col justify-between overflow-y-auto pl-2 space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-bold text-xs">
                  {currentIndex + 1}
                </div>

                <button
                  type="button"
                  onClick={handleToggleMark}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${marked[currentQ.id] ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  <span>Mark for review</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsEliminateMode(prev => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer border ${
                  isEliminateMode 
                    ? 'bg-rose-50 border-rose-300 text-rose-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Bật/Tắt gạch đáp án"
              >
                <span className="line-through">ABC</span>
              </button>
            </div>

            <div className="text-xs font-bold text-slate-900 font-serif leading-relaxed">
              <MathRenderer text={currentQ.question || ''} />
            </div>

            {currentQ.isGridIn ? (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Điền câu trả lời của bạn:</label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                  placeholder="Nhập số hoặc phân số (ví dụ: 1.5 hoặc 16/17)"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                {currentQ.options && Object.entries(currentQ.options).map(([key, val]) => {
                  const isSelected = answers[currentQ.id] === key;
                  const isElim = qElims.includes(key);

                  return (
                    <div
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      className={`group p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isElim 
                          ? 'opacity-35 bg-slate-100 border-slate-200 line-through' 
                          : isSelected 
                            ? 'bg-sky-50/70 border-sky-600 ring-1 ring-sky-600 shadow-2xs' 
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full border text-xs font-bold flex items-center justify-center transition ${
                          isSelected 
                            ? 'border-sky-600 bg-sky-600 text-white' 
                            : 'border-slate-300 bg-white text-slate-600 group-hover:border-slate-400'
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
                        className="text-slate-300 hover:text-rose-600 p-1 rounded transition text-xs font-bold"
                        title="Loại trừ đáp án này"
                      >
                        {isElim ? <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BẢNG KẾT QUẢ VÀ ĐIỂM IRT SAU KHI NỘP */}
          {isSubmitted && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              {scoreResult && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <div>
                      <span className="text-xs font-bold text-indigo-900 block">Điểm SAT IRT ước tính</span>
                      <span className="text-[10px] text-indigo-600 font-medium">Năng lực theta: {scoreResult.thetaFinal}</span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-indigo-700">{scoreResult.scaledScore} / 800</span>
                </div>
              )}

              <div className="text-xs space-y-1">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đáp án chính xác: ({currentQ.correctAnswer})
                </span>
                {currentQ.explanation && (
                  <p className="text-slate-600 pt-1 font-serif leading-relaxed">{currentQ.explanation}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="h-16 border-t border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
        <button
          type="button"
          onClick={() => setShowMatrix(true)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => goToIndex(currentIndex - 1)}
            className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-30 hover:bg-slate-50 transition cursor-pointer"
          >
            Back
          </button>
          
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => goToIndex(currentIndex + 1)}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitExam}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Submit
            </button>
          )}
        </div>
      </footer>

      {/* MODALS */}
      <MatrixModal
        isOpen={showMatrix}
        onClose={() => setShowMatrix(false)}
        questions={questions}
        currentIndex={currentIndex}
        onSelectIndex={goToIndex}
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