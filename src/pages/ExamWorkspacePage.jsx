import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, EyeOff, Calculator, BookOpen, LogOut, 
  ChevronRight, Bookmark, CheckCircle2, XCircle, HelpCircle
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import MatrixModal from '../components/exam/MatrixModal';
import questionService from '../services/questionService';

// Bọc công thức trong $ nếu có ký hiệu LaTeX mà chưa có delimiter
function ensureMathDelimiters(str) {
  if (!str) return '';
  const text = String(str).trim();
  if (text.includes('\\') && !text.startsWith('$')) {
    return `$${text}$`;
  }
  return text;
}

export default function ExamWorkspacePage(props) {
  // Tương thích linh hoạt với cả 2 cách gọi props
  const sessionConfig = props.sessionConfig || props.config || {};
  const onExit = props.onExit || props.onBack || (() => window.history.back());

  // Lấy danh sách câu hỏi: từ props hoặc trực tiếp từ questionService nếu rỗng
  const questions = useMemo(() => {
    if (sessionConfig?.questions && sessionConfig.questions.length > 0) {
      return sessionConfig.questions;
    }
    if (props.questions && props.questions.length > 0) {
      return props.questions;
    }
    // Fallback: lấy từ ngân hàng algebra nếu không có câu hỏi nào được truyền vào
    return questionService.getQuestionsByCategory('algebra') || [];
  }, [sessionConfig, props.questions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarks] = useState(new Set());
  const [eliminatedOptions, setEliminations] = useState({});
  const [isEliminatorMode, setIsEliminatorMode] = useState(false);
  const [checkedQuestions, setCheckedQuestions] = useState({});

  // Modals
  const [isDesmosOpen, setDesmosOpen] = useState(false);
  const [isReferenceOpen, setReferenceOpen] = useState(false);
  const [isMatrixOpen, setMatrixOpen] = useState(false);

  // Timer
  const [isTimerVisible, setIsTimerVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(() => Number(sessionConfig?.duration) || 2100);

  const currentQ = questions[currentIndex] || {};
  const currentQId = currentQ.id || `q_${currentIndex}`;

  const isMathSection = true; // Luôn bật tính năng Math cho Algebra

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (key) => {
    if (isEliminatorMode) {
      setEliminations(prev => {
        const qElims = new Set(prev[currentQId] || []);
        if (qElims.has(key)) qElims.delete(key);
        else qElims.add(key);
        return { ...prev, [currentQId]: qElims };
      });
      return;
    }

    setAnswers(prev => ({
      ...prev,
      [currentQId]: key
    }));
  };

  const toggleMark = () => {
    setMarks(prev => {
      const next = new Set(prev);
      if (next.has(currentQId)) next.delete(currentQId);
      else next.add(currentQId);
      return next;
    });
  };

  const handleCheckCurrentAnswer = () => {
    setCheckedQuestions(prev => ({
      ...prev,
      [currentQId]: true
    }));
  };

  const isChecked = !!checkedQuestions[currentQId];
  const userAns = answers[currentQId];

  const isCurrentCorrect = useMemo(() => {
    if (!userAns) return false;
    const cleanUser = String(userAns).trim().toLowerCase();
    if (currentQ.isGridIn) {
      const valid = (currentQ.acceptedAnswers || [currentQ.correctAnswer]).map(a => String(a).trim().toLowerCase());
      return valid.includes(cleanUser);
    }
    return cleanUser === String(currentQ.correctAnswer).trim().toLowerCase();
  }, [userAns, currentQ]);

  // Chuẩn hóa Options thành mảng [{ key: 'A', text: '...' }]
  const renderableOptions = useMemo(() => {
    if (!currentQ.options) return [];
    if (Array.isArray(currentQ.options)) {
      return currentQ.options.map((opt, i) => ({
        key: opt.key || opt.label || String.fromCharCode(65 + i),
        text: typeof opt === 'string' ? opt : (opt.text || opt.value || '')
      }));
    }
    return Object.entries(currentQ.options).map(([key, value]) => ({
      key,
      text: typeof value === 'string' ? value : (value?.text || '')
    }));
  }, [currentQ]);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-600 font-medium">Không tìm thấy câu hỏi nào trong danh mục này.</p>
          <button 
            type="button"
            onClick={onExit} 
            className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 select-none">
      {/* TOP HEADER */}
      <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-10">
        <div>
          <h1 className="font-bold text-sm text-slate-900">
            {sessionConfig?.title || 'Luyện tập: Algebra (Đại số tuyến tính)'}
          </h1>
          <p className="text-[11px] text-slate-400">
            Math Section • Câu {currentIndex + 1}/{questions.length}
          </p>
        </div>

        {/* TIMER */}
        <div className="flex items-center gap-2">
          {isTimerVisible && (
            <span className="font-mono text-base font-bold text-slate-700">
              {formatTime(timeLeft)}
            </span>
          )}
          <button 
            type="button"
            onClick={() => setIsTimerVisible(!isTimerVisible)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded cursor-pointer"
          >
            {isTimerVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isTimerVisible ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        {/* TOOLS */}
        <div className="flex items-center gap-2">
          {isMathSection && (
            <>
              <button 
                type="button"
                onClick={() => setDesmosOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-indigo-600" />
                Calculator
              </button>
              <button 
                type="button"
                onClick={() => setReferenceOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Reference
              </button>
            </>
          )}

          <button 
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition ml-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Save & Exit
          </button>
        </div>
      </header>

      {/* WORKSPACE BODY */}
      <main className="flex-1 flex overflow-hidden">
        {/* CỘT TRÁI: ĐỀ BÀI */}
        <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="max-w-xl mx-auto space-y-4 text-slate-800 text-[15px] leading-relaxed">
            <MathRenderer text={currentQ.prompt} />
          </div>
        </div>

        {/* CỘT PHẢI: PHƯƠNG ÁN CHỌN */}
        <div className="w-1/2 p-8 overflow-y-auto bg-slate-50 flex flex-col justify-between">
          <div className="max-w-xl mx-auto w-full space-y-5">
            {/* Header câu hỏi */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  {currentQ.questionNumber || currentIndex + 1}
                </span>
                <button 
                  type="button"
                  onClick={toggleMark}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition cursor-pointer ${
                    markedQuestions.has(currentQId) 
                      ? 'text-amber-700 bg-amber-100' 
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${markedQuestions.has(currentQId) ? 'fill-amber-600 text-amber-600' : ''}`} />
                  Mark for review
                </button>
              </div>

              {!currentQ.isGridIn && (
                <button 
                  type="button"
                  onClick={() => setIsEliminatorMode(!isEliminatorMode)}
                  className={`px-2.5 py-1 text-xs font-bold rounded tracking-wider transition cursor-pointer ${
                    isEliminatorMode 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  ABC
                </button>
              )}
            </div>

            {/* Dòng câu hỏi */}
            <div className="font-semibold text-slate-900 text-[14px]">
              <MathRenderer text={currentQ.question} />
            </div>

            {/* DANH SÁCH LỰA CHỌN */}
            {currentQ.isGridIn ? (
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-600 mb-2">Nhập kết quả số của bạn:</label>
                <input 
                  type="text" 
                  value={userAns || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQId]: e.target.value })}
                  placeholder="Ví dụ: 1.5 hoặc 3/2"
                  className="w-full max-w-xs px-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-base"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {renderableOptions.map(({ key, text }) => {
                  const isSelected = userAns === key;
                  const isEliminated = eliminatedOptions[currentQId]?.has(key);
                  const isCorrectChoice = key === currentQ.correctAnswer;

                  let borderClass = 'border-slate-300 hover:border-slate-400 bg-white';
                  if (isSelected) borderClass = 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600';

                  if (isChecked) {
                    if (isCorrectChoice) {
                      borderClass = 'border-emerald-500 bg-emerald-50/90 ring-1 ring-emerald-500 text-emerald-950 font-medium';
                    } else if (isSelected && !isCorrectChoice) {
                      borderClass = 'border-rose-400 bg-rose-50/90 ring-1 ring-rose-400 text-rose-950';
                    }
                  }

                  return (
                    <div 
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition select-none ${borderClass} ${
                        isEliminated ? 'opacity-40 line-through' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-400 text-slate-700 bg-white'
                        }`}>
                          {key}
                        </span>
                        <div className="text-[14px] text-slate-800">
                          <MathRenderer text={ensureMathDelimiters(text)} />
                        </div>
                      </div>

                      {isChecked && isCorrectChoice && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                      )}
                      {isChecked && isSelected && !isCorrectChoice && (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* BẢNG LỜI GIẢI SAU KHI CHECK */}
            {isChecked && (
              <div className={`p-4 rounded-xl border mt-4 text-xs space-y-2 ${
                isCurrentCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isCurrentCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Chính xác!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Chưa chính xác (Đáp án chuẩn: {currentQ.correctAnswer})</span>
                    </>
                  )}
                </div>
                {currentQ.explanation && (
                  <div className="text-slate-700 leading-relaxed pt-2 border-t border-slate-200/60 font-sans">
                    <strong>Giải thích chi tiết: </strong>
                    <MathRenderer text={currentQ.explanation} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="h-16 border-t border-slate-200 bg-white px-8 flex items-center justify-between shrink-0">
        <button 
          type="button"
          onClick={() => setMatrixOpen(true)}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
        >
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <ChevronRight className="w-3.5 h-3.5 rotate-90" />
        </button>

        <div className="flex items-center gap-3">
          {/* NÚT KIỂM TRA ĐÁP ÁN */}
          <button 
            type="button"
            onClick={handleCheckCurrentAnswer}
            disabled={!userAns}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              userAns 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Check
          </button>

          <button 
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            Back
          </button>

          <button 
            type="button"
            onClick={() => {
              if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
              }
            }}
            className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
          >
            {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </footer>

      {/* MODALS */}
      {isDesmosOpen && <DesmosModal onClose={() => setDesmosOpen(false)} />}
      {isReferenceOpen && <ReferenceModal onClose={() => setReferenceOpen(false)} />}
      {isMatrixOpen && (
        <MatrixModal 
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          markedQuestions={markedQuestions}
          onSelect={(idx) => {
            setCurrentIndex(idx);
            setMatrixOpen(false);
          }}
          onClose={() => setMatrixOpen(false)}
        />
      )}
    </div>
  );
}