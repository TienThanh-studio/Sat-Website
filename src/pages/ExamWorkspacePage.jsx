import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, BookOpen, Bookmark, ChevronLeft, ChevronRight, 
  HelpCircle, Eye, EyeOff, CheckCircle2, Highlighter, 
  Sparkles, RotateCcw, Home, X, Check
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import MatrixModal from '../components/exam/MatrixModal';
import ScoreReportModal from '../components/exam/ScoreReportModal';
import { calculateSatScaledScore, isAnswerCorrect } from '../services/adaptiveEngine';

export default function ExamWorkspacePage({ sessionConfig, onExit, currentUser }) {
  const questions = Array.isArray(sessionConfig?.questions) ? sessionConfig.questions : [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [eliminatedOptions, setEliminatedOptions] = useState({});
  
  // Trạng thái kiểm tra đáp án tức thì (Check Answer)
  const [checkedQuestions, setCheckedQuestions] = useState({});

  // Đồng hồ & thời gian (Chuẩn hóa thời gian an toàn: nếu không truyền hoặc quá lớn thì gán mặc định 35 phút)
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    const rawDur = Number(sessionConfig?.duration);
    if (rawDur && rawDur > 0 && rawDur <= 180) {
      return rawDur * 60;
    }
    // Mặc định: 32 phút nếu thi full, hoặc 1.5 phút/câu nếu luyện tập
    return Math.min(questions.length * 90 || 32 * 60, 60 * 60);
  });
  const [timeSpent, setTimeSpent] = useState(0);
  
  // Modals
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Tooltip Highlight
  const [highlightPopup, setHighlightPopup] = useState(null);
  const readingColRef = useRef(null);

  const currentQ = questions[currentIndex] || {};
  const isMathSection = currentQ?.section === 'Math' || sessionConfig?.section === 'Math' || sessionConfig?.category === 'Algebra';

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Chọn phương án
  const handleSelectOption = (key) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: key }));
  };

  // Bookmark câu hỏi
  const toggleBookmark = () => {
    setBookmarked(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  // Gạch bỏ đáp án
  const toggleEliminate = (key) => {
    setEliminatedOptions(prev => {
      const cur = prev[currentIndex] || [];
      return {
        ...prev,
        [currentIndex]: cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]
      };
    });
  };

  // Chuyển câu hỏi
  const handleJump = (idx) => {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIndex(idx);
      setHighlightPopup(null);
    }
  };

  // Bấm nút CHECK đáp án
  const handleCheckAnswer = () => {
    setCheckedQuestions(prev => ({
      ...prev,
      [currentIndex]: true
    }));
  };

  // Highlight văn bản
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setHighlightPopup(null);
      return;
    }
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setHighlightPopup({
          top: rect.top - 42,
          left: rect.left + rect.width / 2,
          range: range.cloneRange()
        });
      }
    } catch (e) {
      setHighlightPopup(null);
    }
  };

  const applyHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    try {
      const range = highlightPopup?.range || selection.getRangeAt(0);
      const span = document.createElement('mark');
      span.className = 'bg-sky-100 text-sky-950 px-1 py-0.5 rounded cursor-pointer hover:bg-sky-200 transition';
      span.title = 'Nhấp đúp để bỏ tô';
      span.ondblclick = () => span.replaceWith(...span.childNodes);
      range.surroundContents(span);
      selection.removeAllRanges();
    } catch (e) {
      console.warn('Vui lòng bôi đen văn bản trong cùng một đoạn:', e);
    }
    setHighlightPopup(null);
  };

  // Nộp bài
  const handleFinishExam = () => {
    if (!window.confirm('Bạn có chắc chắn muốn nộp bài và xem báo cáo kết quả?')) {
      return;
    }

    const reviewedQuestions = questions.map((q, idx) => {
      const uAns = answers[idx] !== undefined ? String(answers[idx]).trim() : '';
      const cAns = String(q.correctAnswer || '').trim();
      const isCorrect = isAnswerCorrect(q, uAns);

      return {
        ...q,
        id: q.id || `q_${idx + 1}`,
        userAnswer: uAns,
        correctAnswer: cAns,
        isCorrect: isCorrect,
        domain: q.domain || (isMathSection ? 'Math Domain' : 'Reading & Writing'),
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || 'Đáp án chính xác được xác nhận chuẩn theo quy tắc phân tích College Board.'
      };
    });

    const correctCount = reviewedQuestions.filter(q => q.isCorrect).length;
    const totalCount = reviewedQuestions.length;

    const fakeSessionState = {
      module1: {
        questions: reviewedQuestions,
        answers: answers,
        timeSpent: timeSpent
      },
      module2: {
        path: 'Hard',
        questions: [],
        answers: {},
        timeSpent: 0
      }
    };

    let calculatedScore = 500;
    try {
      const scoreRes = calculateSatScaledScore(fakeSessionState);
      calculatedScore = scoreRes?.scaledScore || Math.round((correctCount / totalCount) * 600 + 200);
      calculatedScore = Math.round(calculatedScore / 10) * 10;
    } catch (err) {
      calculatedScore = Math.round((correctCount / totalCount) * 600 + 200);
      calculatedScore = Math.round(calculatedScore / 10) * 10;
    }

    const domainStats = {};
    reviewedQuestions.forEach(q => {
      const d = q.domain || 'General';
      if (!domainStats[d]) {
        domainStats[d] = { correct: 0, total: 0, percentage: 0 };
      }
      domainStats[d].total += 1;
      if (q.isCorrect) domainStats[d].correct += 1;
    });

    Object.keys(domainStats).forEach(d => {
      const st = domainStats[d];
      st.percentage = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
    });

    const finalReport = {
      scaledScore: calculatedScore,
      section: sessionConfig?.title || (isMathSection ? 'Math Section' : 'Reading & Writing'),
      module2Path: correctCount / totalCount >= 0.6 ? 'Hard' : 'Easy',
      totalQuestions: totalCount,
      correctCount: correctCount,
      timeSpent: timeSpent,
      domainPerformance: domainStats,
      questions: reviewedQuestions
    };

    setReportData(finalReport);
    setIsReportOpen(true);
  };

  if (questions.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-slate-600 font-semibold text-sm">Không tìm thấy câu hỏi cho đề thi này.</p>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Quay lại màn hình chính
        </button>
      </div>
    );
  }

  // TÌM ĐOẠN ĐỀ BÀI (Hỗ trợ toàn diện mọi biến: passage, prompt, content, text, stimulus)
  const questionPrompt = 
    currentQ?.passage || 
    currentQ?.prompt || 
    currentQ?.content || 
    currentQ?.text || 
    currentQ?.stimulus || 
    (typeof currentQ?.questionText === 'string' ? currentQ.questionText : '') ||
    'Đang tải nội dung câu hỏi...';

  // Chuẩn hóa Options
  const rawOpts = currentQ?.options || {};
  const optionsEntries = Array.isArray(rawOpts)
    ? rawOpts.map((opt, i) => [String.fromCharCode(65 + i), typeof opt === 'object' ? (opt.text || opt.value || '') : opt])
    : Object.entries(rawOpts);

  const hasAnsweredCurrent = answers[currentIndex] !== undefined && answers[currentIndex] !== '';
  const isCurrentChecked = checkedQuestions[currentIndex];
  const isCurrentCorrect = isAnswerCorrect(currentQ, answers[currentIndex]);

  return (
    <div className="h-screen flex flex-col bg-white select-none overflow-hidden relative">
      
      {/* TOOLTIP HIGHLIGHT NỔI */}
      {highlightPopup && (
        <div
          style={{ top: `${highlightPopup.top}px`, left: `${highlightPopup.left}px`, transform: 'translateX(-50%)' }}
          className="fixed z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyHighlight();
            }}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Highlighter className="w-3.5 h-3.5 text-sky-300" />
            <span>Highlight</span>
          </button>
        </div>
      )}

      {/* 1. TOP BAR CHUẨN BLUEBOOK */}
      <header className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
        <div>
          <h2 className="font-extrabold text-sm text-slate-800 tracking-tight">
            {sessionConfig?.title || 'Words in Context'}
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold">
            {isMathSection ? 'Math Section' : 'Reading and Writing'} • Câu {currentIndex + 1}/{questions.length}
          </p>
        </div>

        {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
        <div className="flex items-center gap-2">
          {!isTimerHidden ? (
            <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
              {formatTime(timeLeft)}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">Đã ẩn thời gian</span>
          )}
          <button
            type="button"
            onClick={() => setIsTimerHidden(!isTimerHidden)}
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition cursor-pointer"
            title={isTimerHidden ? 'Hiện đồng hồ' : 'Ẩn đồng hồ'}
          >
            {isTimerHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {/* CÔNG CỤ (CHỈ HIỆN KHI LÀ MATH) */}
        <div className="flex items-center gap-2">
          {isMathSection && (
            <>
              <button
                type="button"
                onClick={() => setIsDesmosOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span>Calculator</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReferenceOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Reference</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition ml-2 cursor-pointer"
          >
            Save & Exit
          </button>
        </div>
      </header>

      {/* 2. KHU VỰC LÀM BÀI */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* CỘT TRÁI: ĐỀ BÀI (RENDER HOÀN TOÀN ĐÚNG ĐOẠN VĂN) */}
          <div 
            ref={readingColRef}
            onMouseUp={handleTextSelection}
            className="bg-slate-50/70 p-6 md:p-7 rounded-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-md">
                {currentIndex + 1}
              </span>
              <button
                type="button"
                onClick={toggleBookmark}
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded transition cursor-pointer ${
                  bookmarked[currentIndex] ? 'text-amber-700 bg-amber-50 font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarked[currentIndex] ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{bookmarked[currentIndex] ? 'Marked for review' : 'Mark for review'}</span>
              </button>
            </div>

            <div className="text-sm text-slate-800 leading-relaxed font-serif select-text">
              <MathRenderer text={questionPrompt} />
            </div>
          </div>

          {/* CỘT PHẢI: CÂU HỎI VÀ PHƯƠNG ÁN */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-700 leading-relaxed">
              {currentQ?.question || (currentQ?.isGridIn ? 'Enter your answer in the box below:' : 'Which choice completes the text with the most logical and precise word or phrase?')}
            </div>

            {/* TRẮC NGHIỆM */}
            {!currentQ?.isGridIn && (
              <div className="space-y-2.5">
                {optionsEntries.map(([letter, text]) => {
                  const isSelected = answers[currentIndex] === letter;
                  const isEliminated = (eliminatedOptions[currentIndex] || []).includes(letter);
                  const isCorrectChoice = String(currentQ?.correctAnswer || '').trim().toUpperCase() === letter;

                  // Đổi màu theo trạng thái đã bấm Check
                  let optionStyle = 'border-slate-200 hover:bg-slate-50';
                  if (isSelected) {
                    optionStyle = 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500';
                  }
                  if (isCurrentChecked) {
                    if (isCorrectChoice) {
                      optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                    } else if (isSelected && !isCurrentCorrect) {
                      optionStyle = 'border-rose-500 bg-rose-50 text-rose-900 ring-1 ring-rose-400';
                    }
                  } else if (isEliminated) {
                    optionStyle = 'border-slate-100 bg-slate-100/50 opacity-40';
                  }

                  return (
                    <div
                      key={letter}
                      onClick={() => !isEliminated && handleSelectOption(letter)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCurrentChecked && isCorrectChoice
                            ? 'bg-emerald-600 text-white'
                            : isCurrentChecked && isSelected && !isCurrentCorrect
                            ? 'bg-rose-600 text-white'
                            : isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {letter}
                        </span>
                        <div className={`text-xs text-slate-800 font-serif ${isEliminated && !isCurrentChecked ? 'line-through text-slate-400' : ''}`}>
                          <MathRenderer text={text} />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEliminate(letter);
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 cursor-pointer"
                        title="Gạch bỏ đáp án này"
                      >
                        ABC
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CÂU ĐIỀN SỐ (SPR) */}
            {currentQ?.isGridIn && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={answers[currentIndex] || ''}
                  onChange={(e) => handleSelectOption(e.target.value)}
                  placeholder="Nhập số hoặc phân số (ví dụ: 3/2 hoặc 1.5)..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="text-[11px] text-slate-400">
                  Xem trước: <strong className="font-mono text-slate-700">{answers[currentIndex] || 'Chưa nhập'}</strong>
                </div>
              </div>
            )}

            {/* HIỂN THỊ LỜI GIẢI KHI BẤM NÚT CHECK */}
            {isCurrentChecked && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                isCurrentCorrect ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {isCurrentCorrect ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Chính xác!
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1">
                      <X className="w-4 h-4 text-rose-600" />
                      Chưa chính xác (Đáp án đúng là {currentQ?.correctAnswer})
                    </span>
                  )}
                </div>
                {currentQ?.explanation && (
                  <div className="text-slate-700 font-serif leading-relaxed pt-1 border-t border-slate-200/50">
                    <strong>Giải thích chi tiết: </strong>
                    <MathRenderer text={currentQ.explanation} />
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* 3. THANH ĐIỀU HƯỚNG DƯỚI CÙNG & CÓ ĐẦY ĐỦ NÚT CHECK */}
      <footer className="h-16 border-t border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
        
        {/* NÚT MỞ MATRIX MODAL */}
        <button
          type="button"
          onClick={() => setIsMatrixOpen(true)}
          className="text-xs font-bold text-slate-700 hover:text-indigo-600 transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 cursor-pointer"
        >
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-[10px] text-slate-400">▲</span>
        </button>

        {/* CỤM NÚT BACK / CHECK / NEXT HOẶC FINISH */}
        <div className="flex items-center gap-2">
          {/* NÚT BACK */}
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => handleJump(currentIndex - 1)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Back
          </button>

          {/* NÚT CHECK (MÀU VÀNG CAM SÁNG KHI ĐÃ CHỌN ĐÁP ÁN) */}
          <button
            type="button"
            disabled={!hasAnsweredCurrent}
            onClick={handleCheckAnswer}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              hasAnsweredCurrent
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Check</span>
          </button>

          {/* NÚT NEXT HOẶC NÚT FINISH Ở CÂU CUỐI */}
          {currentIndex === questions.length - 1 ? (
            <button
              type="button"
              onClick={handleFinishExam}
              className="px-6 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Finish</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleJump(currentIndex + 1)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Next
            </button>
          )}
        </div>
      </footer>

      {/* MATRIX NAVIGATION MODAL */}
      <MatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        questions={questions}
        currentIndex={currentIndex}
        answers={answers}
        bookmarked={bookmarked}
        onSelectIndex={(idx) => handleJump(idx)}
        onSelectQuestion={(idx) => handleJump(idx)}
      />

      {/* SCORE REPORT MODAL */}
      {isReportOpen && (
        <ScoreReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          onRetry={() => {
            setIsReportOpen(false);
            setCurrentIndex(0);
            setAnswers({});
            setCheckedQuestions({});
            setTimeLeft(Math.min(questions.length * 90 || 32 * 60, 60 * 60));
          }}
          onHome={onExit}
          reportData={reportData}
        />
      )}

      {/* MODAL CÔNG CỤ TOÁN */}
      {isMathSection && (
        <>
          <DesmosModal isOpen={isDesmosOpen} onClose={() => setIsDesmosOpen(false)} />
          <ReferenceModal isOpen={isReferenceOpen} onClose={() => setIsReferenceOpen(false)} />
        </>
      )}
    </div>
  );
}