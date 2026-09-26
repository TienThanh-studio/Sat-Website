import React, { useState, useEffect } from 'react';
import { 
  Timer, ArrowLeft, CheckCircle2, XCircle, Flag, 
  Underline as UnderlineIcon, Grid, Eye, 
  ChevronLeft, ChevronRight, Strikethrough
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { questionService } from '../services/questionService';

// Hàm helper bóc tách text an toàn, không bao giờ để lọt Object vào JSX child
const renderSafeText = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (typeof val.text === 'string') return val.text;
    if (typeof val.value === 'string') return val.value;
    if (typeof val.content === 'string') return val.content;
    if (typeof val.prompt === 'string') return val.prompt;
    if (typeof val.question === 'string') return val.question;
    return JSON.stringify(val);
  }
  return String(val);
};

export default function ExamWorkspacePage({ sessionConfig, onExit }) {
  const [questions] = useState(sessionConfig.questions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [eliminatedOptions, setEliminatedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(sessionConfig.duration || 1800);
  const [isFinished, setIsFinished] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);

  // Phục hồi session cũ nếu F5
  useEffect(() => {
    try {
      const saved = storageService?.getExamSession ? storageService.getExamSession() : null;
      if (saved && saved.sessionId === sessionConfig.sessionId) {
        setAnswers(saved.answers || {});
        setMarkedQuestions(saved.markedQuestions || {});
        setTimeLeft(saved.timeLeft || 1800);
        setCurrentIndex(saved.currentIndex || 0);
      }
    } catch (e) {
      console.warn("Lỗi load session:", e);
    }
  }, [sessionConfig.sessionId]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (isFinished || isReviewMode) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, isReviewMode]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Chuẩn hóa toàn bộ options thành danh sách [{ key: 'A', text: '...' }]
  const normalizeOptions = (options) => {
    if (!options) return [];
    const defaultLetters = ['A', 'B', 'C', 'D'];

    if (Array.isArray(options)) {
      return options.map((opt, idx) => {
        if (typeof opt === 'string' || typeof opt === 'number') {
          return { key: defaultLetters[idx] || String(idx), text: String(opt) };
        }
        if (typeof opt === 'object' && opt !== null) {
          return {
            key: renderSafeText(opt.key || opt.label || defaultLetters[idx]),
            text: renderSafeText(opt.text || opt.value || opt.content || opt)
          };
        }
        return { key: String(idx), text: renderSafeText(opt) };
      });
    }

    if (typeof options === 'object') {
      return Object.entries(options).map(([k, val], idx) => {
        if (typeof val === 'object' && val !== null) {
          return {
            key: renderSafeText(val.key || k),
            text: renderSafeText(val.text || val.value || val.content || val)
          };
        }
        return { key: k, text: renderSafeText(val) };
      });
    }

    return [];
  };

  // Tính năng gạch chân chữ (Underline)
  const handleUnderlineSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const parentSpan = range.commonAncestorContainer.parentElement;

    if (parentSpan && parentSpan.classList.contains('user-underlined')) {
      parentSpan.replaceWith(...parentSpan.childNodes);
      selection.removeAllRanges();
      return;
    }

    const span = document.createElement("span");
    span.className = "user-underlined underline decoration-2 decoration-amber-500 bg-amber-100/70 rounded px-0.5 cursor-pointer";
    span.title = "Click đúp để xóa gạch chân";
    span.ondblclick = (e) => {
      e.stopPropagation();
      span.replaceWith(...span.childNodes);
    };

    try {
      range.surroundContents(span);
      selection.removeAllRanges();
    } catch (e) {
      console.warn("Chỉ chọn văn bản trong một đoạn văn bản!", e);
    }
  };

  // Phím tắt Ctrl + U
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleUnderlineSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectAnswer = (key) => {
    if (isReviewMode) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: key }));
  };

  const handleToggleEliminate = (e, key) => {
    e.stopPropagation();
    if (isReviewMode) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setEliminatedOptions(prev => {
      const currentList = prev[currentQ.id] || [];
      const updated = currentList.includes(key)
        ? currentList.filter(k => k !== key)
        : [...currentList, key];
      return { ...prev, [currentQ.id]: updated };
    });
  };

  const handleToggleMark = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setMarkedQuestions(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleSubmitExam = () => {
    setIsFinished(true);
    if (storageService?.clearExamSession) storageService.clearExamSession();

    let existingMistakes = [];
    try {
      existingMistakes = JSON.parse(localStorage.getItem('sat_mistakes') || '[]');
    } catch (e) {
      existingMistakes = [];
    }

    const newMistakes = [];
    questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer === q.correctAnswer) {
        if (questionService?.recordCorrectAnswer) questionService.recordCorrectAnswer(q.id);
      } else {
        newMistakes.push({
          ...q,
          userAnswer: userAnswer || 'Không trả lời',
          savedAt: new Date().toISOString()
        });
      }
    });

    const mistakeMap = new Map();
    existingMistakes.forEach(item => mistakeMap.set(item.id, item));
    newMistakes.forEach(item => mistakeMap.set(item.id, item));
    localStorage.setItem('sat_mistakes', JSON.stringify(Array.from(mistakeMap.values())));
  };

  let correctCount = 0;
  questions.forEach(q => {
    if (answers[q.id] === q.correctAnswer) correctCount++;
  });

  const currentQ = questions[currentIndex];
  const currentEliminated = (currentQ && eliminatedOptions[currentQ.id]) || [];
  const normalizedOptionsList = normalizeOptions(currentQ?.options);

  // Màn hình kết quả sau khi nộp bài
  if (isFinished && !isReviewMode) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center p-6 select-none">
        <div className="bg-white max-w-xl w-full p-8 rounded-2xl border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Hoàn thành bài thi!</h2>
          <p className="text-xs text-slate-500 mb-6">Kết quả làm bài và danh sách câu sai đã được lưu lại tự động.</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold block">Số câu đúng</span>
              <span className="text-xl font-black text-emerald-600">{correctCount} / {questions.length}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold block">Độ chính xác</span>
              <span className="text-xl font-black text-indigo-700">
                {questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}%
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold block">Thời gian</span>
              <span className="text-xl font-black text-slate-700">{formatTime((sessionConfig.duration || 1800) - timeLeft)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setIsReviewMode(true);
                setCurrentIndex(0);
              }}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Xem lại bài & Lời giải
            </button>
            <button
              type="button"
              onClick={onExit}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Thoát
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white select-text overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-white z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onExit} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="font-bold text-slate-800 text-sm">{renderSafeText(sessionConfig.title) || 'Digital SAT Exam'}</span>
            {isReviewMode && (
              <span className="ml-2.5 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                CHẾ ĐỘ XEM LẠI BÀI THI
              </span>
            )}
          </div>
        </div>

        {/* Công cụ: Gạch chân, Đồng hồ, Lưới câu hỏi */}
        <div className="flex items-center gap-2.5">
          {!isReviewMode && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleUnderlineSelection();
              }}
              title="Bôi đen văn bản và nhấn để gạch chân (Ctrl + U)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
              <span>Gạch chân</span>
            </button>
          )}

          {!isReviewMode && (
            <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
              <Timer className="w-4 h-4 text-slate-600" />
              <span className="font-mono font-bold text-xs text-slate-800">{formatTime(timeLeft)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMatrix(!showMatrix)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Câu {currentIndex + 1} / {questions.length}</span>
          </button>
        </div>

        <div>
          {isReviewMode ? (
            <button
              type="button"
              onClick={onExit}
              className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-xl transition shadow-sm"
            >
              Hoàn tất xem lại
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitExam}
              className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl transition shadow-sm"
            >
              Nộp bài thi
            </button>
          )}
        </div>
      </div>

      {/* Nội dung bài thi 2 cột */}
      <div className="flex-1 flex overflow-hidden">
        {/* Đoạn văn (Passage) */}
        <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-200 leading-relaxed text-slate-800 font-serif text-[15px]">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">
              Passage / Câu hỏi {currentIndex + 1}
            </div>
            <div className="whitespace-pre-line select-text">
              {renderSafeText(currentQ?.prompt || currentQ?.passage || "Nội dung câu hỏi đang được cập nhật...")}
            </div>
          </div>
        </div>

        {/* Câu hỏi & Lựa chọn */}
        <div className="w-1/2 p-8 overflow-y-auto bg-slate-50/60 flex flex-col justify-between">
          <div className="max-w-xl mx-auto w-full space-y-5">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-bold text-slate-900 text-sm leading-snug">
                {renderSafeText(currentQ?.question) || "Which choice completes the text with the most logical and precise word or phrase?"}
              </h3>
              {!isReviewMode && (
                <button
                  type="button"
                  onClick={handleToggleMark}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                    markedQuestions[currentQ?.id]
                      ? 'bg-rose-50 border-rose-300 text-rose-600'
                      : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{markedQuestions[currentQ?.id] ? 'Đã gắn cờ' : 'Gắn cờ'}</span>
                </button>
              )}
            </div>

            {/* Render 4 phương án an toàn qua renderSafeText */}
            <div className="space-y-2.5">
              {normalizedOptionsList.map(({ key, text }) => {
                const isSelected = answers[currentQ?.id] === key;
                const isCorrect = currentQ?.correctAnswer === key;
                const isEliminated = currentEliminated.includes(key);

                let cardStyle = "border-slate-200 bg-white hover:border-slate-300 text-slate-800";
                
                if (isReviewMode) {
                  if (isCorrect) {
                    cardStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500";
                  } else if (isSelected && !isCorrect) {
                    cardStyle = "border-rose-400 bg-rose-50 text-rose-900 line-through opacity-80";
                  } else {
                    cardStyle = "border-slate-200 bg-white opacity-60";
                  }
                } else if (isSelected) {
                  cardStyle = "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-600 font-medium";
                } else if (isEliminated) {
                  cardStyle = "border-slate-200 bg-slate-100 text-slate-400 line-through opacity-60";
                }

                return (
                  <div
                    key={key}
                    onClick={() => !isEliminated && handleSelectAnswer(key)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition relative group ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {renderSafeText(key)}
                      </span>
                      <span className="text-sm select-none">{renderSafeText(text)}</span>
                    </div>

                    {!isReviewMode && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleEliminate(e, key)}
                        title={isEliminated ? "Bỏ gạch đáp án này" : "Gạch bỏ phương án này"}
                        className={`p-1.5 rounded-md text-xs font-bold border transition ${
                          isEliminated 
                            ? 'bg-rose-100 border-rose-300 text-rose-700' 
                            : 'opacity-0 group-hover:opacity-100 bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isReviewMode && isCorrect && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Đáp án đúng
                      </span>
                    )}
                    {isReviewMode && isSelected && !isCorrect && (
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Bạn đã chọn
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Giải thích chi tiết trong Review Mode */}
            {isReviewMode && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 mt-4">
                <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Giải thích chi tiết:</span>
                </div>
                <p className="text-xs text-indigo-950 leading-relaxed">
                  {renderSafeText(currentQ?.explanation) || `Đáp án đúng là (${renderSafeText(currentQ?.correctAnswer)}).`}
                </p>
              </div>
            )}
          </div>

          {/* Nút Previous / Next */}
          <div className="max-w-xl mx-auto w-full pt-6 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Câu trước
            </button>

            <button
              type="button"
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              className="flex items-center gap-1 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              Câu kế tiếp
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Matrix chuyển nhanh câu hỏi */}
      {showMatrix && (
        <div 
          onClick={() => setShowMatrix(false)}
          className="fixed inset-0 bg-slate-900/40 z-30 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-lg w-full p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Danh sách câu hỏi</h3>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-900 rounded-full" /> Đã làm</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-slate-300 rounded-full" /> Chưa làm</span>
                <span className="flex items-center gap-1"><Flag className="w-3 h-3 text-rose-500" /> Gắn cờ</span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 max-h-72 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isMarked = !!markedQuestions[q.id];
                const isCurrent = currentIndex === idx;

                let btnClass = "border-slate-200 bg-white text-slate-700 hover:border-slate-800";
                if (isReviewMode) {
                  const isCorrect = answers[q.id] === q.correctAnswer;
                  btnClass = isCorrect ? "bg-emerald-500 text-white border-emerald-600" : "bg-rose-500 text-white border-rose-600";
                } else if (isCurrent) {
                  btnClass = "border-indigo-600 ring-2 ring-indigo-600 bg-indigo-50 text-indigo-900 font-bold";
                } else if (isAnswered) {
                  btnClass = "bg-slate-900 text-white border-slate-900";
                }

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowMatrix(false);
                    }}
                    className={`h-10 rounded-xl border text-xs font-bold relative flex items-center justify-center transition ${btnClass}`}
                  >
                    <span>{idx + 1}</span>
                    {isMarked && !isReviewMode && (
                      <Flag className="w-2.5 h-2.5 text-rose-500 fill-rose-500 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMatrix(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}