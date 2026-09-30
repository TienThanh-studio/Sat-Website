import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, BookOpen, Bookmark, ChevronLeft, ChevronRight, 
  HelpCircle, Eye, EyeOff, CheckCircle2, Highlighter, 
  Clock, X, LogOut, Info, Trash2, StickyNote, ShieldAlert,
  Award, FileText, Wifi, ChevronDown, Check
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import MatrixModal from '../components/exam/MatrixModal';
import ScoreReportModal from '../components/exam/ScoreReportModal';
import { calculateSatScaledScore, isAnswerCorrect } from '../services/adaptiveEngine';
import { usePacingTracker } from '../hooks/usePacingTracker';

export default function ExamWorkspacePage({ sessionConfig, onExit, currentUser }) {
  const questions = Array.isArray(sessionConfig?.questions) ? sessionConfig.questions : [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [eliminatedOptions, setEliminatedOptions] = useState({});
  const [checkedQuestions, setCheckedQuestions] = useState({});

  const currentQ = questions[currentIndex] || {};
  const isMathSection = currentQ?.section === 'Math' || sessionConfig?.section === 'Math' || sessionConfig?.category === 'Algebra';
  
  // Nhận diện chế độ thi thật
  const isExamMode = Boolean(
    sessionConfig?.isRealExam ||
    sessionConfig?.isAdaptive ||
    sessionConfig?.section === 'Full Test' ||
    sessionConfig?.mode === 'real' ||
    (sessionConfig?.title && /test|exam|official|module|hard/i.test(sessionConfig.title))
  );

  // MÀN HÌNH CHỜ (INSTRUCTIONS SCREEN): Chỉ bật khi là thi thật
  const [showInstructions, setShowInstructions] = useState(isExamMode);

  // Cấu hình thời gian chuẩn: 32 phút Verbal, 35 phút Math
  const standardLimitSeconds = isMathSection ? 35 * 60 : 32 * 60;
  const initialDuration = Number(sessionConfig?.duration) > 0 ? Number(sessionConfig.duration) * 60 : standardLimitSeconds;

  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  // Modals
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Hook đo nhịp độ
  const { timeOnCurrentQuestion, isTimeWarning, questionTimes } = usePacingTracker({
    currentIndex,
    isExamRunning: !isReportOpen && !showInstructions,
    section: isMathSection ? 'Math' : 'Reading & Writing'
  });

  // Highlight Palette nổi (Hỗ trợ 3 màu pastel, nút Xóa, nút Note)
  const [highlightPopup, setHighlightPopup] = useState(null);
  const readingColRef = useRef(null);

  // Đồng hồ chạy khi đã vượt qua màn hình chờ
  useEffect(() => {
    if (isReportOpen || showInstructions) return;
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
      if (isExamMode) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinishExam(true);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isExamMode, isReportOpen, showInstructions]);

  const formatClock = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (key) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: key }));
  };

  const toggleBookmark = () => {
    setBookmarked(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  const toggleEliminate = (key) => {
    setEliminatedOptions(prev => {
      const cur = prev[currentIndex] || [];
      return {
        ...prev,
        [currentIndex]: cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]
      };
    });
  };

  const handleJump = (idx) => {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIndex(idx);
      setHighlightPopup(null);
    }
  };

  const handleCheckAnswer = () => {
    if (isExamMode) return;
    setCheckedQuestions(prev => ({ ...prev, [currentIndex]: true }));
  };

  // Bắt vùng chọn chữ để mở thanh highlight palette
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
          top: rect.top - 58,
          left: rect.left + rect.width / 2,
          range: range.cloneRange()
        });
      }
    } catch {
      setHighlightPopup(null);
    }
  };

  const applyHighlight = (colorClass) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    try {
      const range = highlightPopup?.range || selection.getRangeAt(0);
      const span = document.createElement('mark');
      span.className = `${colorClass} px-1 py-0.5 rounded cursor-pointer transition select-text`;
      span.title = 'Nhấp đúp để bỏ tô màu';
      span.ondblclick = () => span.replaceWith(...span.childNodes);
      range.surroundContents(span);
      selection.removeAllRanges();
    } catch (e) {
      console.warn(e);
    }
    setHighlightPopup(null);
  };

  const clearHighlightInRange = () => {
    const selection = window.getSelection();
    if (!selection) return;
    try {
      const container = readingColRef.current;
      if (container) {
        const marks = container.querySelectorAll('mark');
        marks.forEach(m => {
          if (selection.containsNode(m, true)) {
            m.replaceWith(...m.childNodes);
          }
        });
      }
      selection.removeAllRanges();
    } catch (e) {
      console.warn(e);
    }
    setHighlightPopup(null);
  };

  const handleFinishExam = (isAuto = false) => {
    if (!isAuto && !window.confirm('Bạn có chắc chắn muốn nộp bài và xem phân tích kết quả?')) {
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
        explanation: q.explanation || 'Đáp án chính xác được xác nhận theo tiêu chuẩn College Board.'
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
    } catch {
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
      questionTimes: questionTimes || {},
      domainPerformance: domainStats,
      questions: reviewedQuestions
    };

    setReportData(finalReport);
    setIsReportOpen(true);
  };

  const userName = currentUser?.name || 'Phan Tiến Thành';
  const userEmail = currentUser?.email || 'nguyenan20062000@gmail.com';

  // =========================================================================
  // MÀN HÌNH CHỜ QUY CHẾ THI (INSTRUCTIONS SCREEN)
  // =========================================================================
  if (showInstructions) {
    return (
      <div className="h-screen w-screen flex flex-col justify-between bg-slate-50/60 font-sans select-none overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-lg w-full shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 text-center tracking-tight">
              {sessionConfig?.title || 'SAT Full Practice Test'}
            </h1>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 bg-slate-50">
                  <Clock className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Timing</h4>
                  <p className="mt-0.5 leading-relaxed text-slate-500">
                    Bài thi được tính giờ chuẩn ({isMathSection ? '35' : '32'} phút). Vui lòng không tải lại trang để tránh mất tiến trình thi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 bg-slate-50">
                  <Award className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Score</h4>
                  <p className="mt-0.5 leading-relaxed text-slate-500">
                    Sau khi hoàn thành, hệ thống sẽ quy đổi điểm số Scaled Score (200 - 800) theo thuật toán chuẩn IRT.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 bg-slate-50">
                  <FileText className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Rules</h4>
                  <p className="mt-0.5 leading-relaxed text-slate-500">
                    Trong chế độ thi thật, bạn chỉ có thể xem đáp án và giải thích chi tiết sau khi bấm nộp bài.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 bg-slate-50">
                  <Wifi className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Access</h4>
                  <p className="mt-0.5 leading-relaxed text-slate-500">
                    Đảm bảo kết nối internet ổn định để quá trình ghi nhận câu trả lời diễn ra mượt mà nhất.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer màn hình chờ với nét đứt nét chuẩn */}
        <div className="border-t-2 border-dashed border-slate-300 bg-slate-100/70 px-8 py-3.5 flex items-center justify-between shrink-0">
          <div>
            <h4 className="font-bold text-xs text-slate-900">{userName}</h4>
            <p className="text-[11px] text-slate-500 font-mono">{userEmail}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-[#b91c1c] hover:bg-red-700 transition shadow-sm cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 font-sans">
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

  const questionPrompt = 
    currentQ?.passage || 
    currentQ?.prompt || 
    currentQ?.content || 
    currentQ?.text || 
    currentQ?.stimulus || 
    (typeof currentQ?.questionText === 'string' ? currentQ.questionText : '') ||
    'Đang tải nội dung câu hỏi...';

  const rawOpts = currentQ?.options || {};
  const optionsEntries = Array.isArray(rawOpts)
    ? rawOpts.map((opt, i) => [String.fromCharCode(65 + i), typeof opt === 'object' ? (opt.text || opt.value || '') : opt])
    : Object.entries(rawOpts);

  const hasAnsweredCurrent = answers[currentIndex] !== undefined && answers[currentIndex] !== '';
  const isCurrentChecked = !isExamMode && checkedQuestions[currentIndex];
  const isCurrentCorrect = isAnswerCorrect(currentQ, answers[currentIndex]);

  return (
    <div className="h-screen w-screen flex flex-col bg-white select-none overflow-hidden font-sans relative">
      
      {/* ========================================================================= */}
      {/* FLOATING HIGHLIGHT PALETTE (CHUẨN VIETACCEPTED STYLE) */}
      {/* ========================================================================= */}
      {highlightPopup && (
        <div
          style={{ top: `${highlightPopup.top}px`, left: `${highlightPopup.left}px`, transform: 'translateX(-50%)' }}
          className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-full px-3 py-1.5 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Nút màu vàng nhạt */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); applyHighlight('bg-amber-200/80 text-slate-900'); }}
            className="w-5 h-5 rounded-full bg-amber-200 border border-amber-300 hover:scale-110 transition cursor-pointer"
            title="Highlight Vàng"
          />
          {/* Nút màu tím hồng nhạt */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); applyHighlight('bg-pink-200/80 text-slate-900'); }}
            className="w-5 h-5 rounded-full bg-pink-200 border border-pink-300 hover:scale-110 transition cursor-pointer"
            title="Highlight Hồng"
          />
          {/* Nút màu xanh lơ nhạt */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); applyHighlight('bg-sky-200/80 text-slate-900'); }}
            className="w-5 h-5 rounded-full bg-sky-200 border border-sky-300 hover:scale-110 transition cursor-pointer"
            title="Highlight Xanh"
          />
          <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
          {/* Nút xóa highlight */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); clearHighlightInRange(); }}
            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
            title="Xóa highlight"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {/* Nút note ghi chú */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); applyHighlight('bg-amber-100 border-b-2 border-amber-400 text-slate-900'); }}
            className="p-1 text-amber-500 hover:text-amber-600 transition cursor-pointer"
            title="Tạo ghi chú"
          >
            <StickyNote className="w-3.5 h-3.5 fill-amber-400" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP BAR CHUẨN */}
      {/* ========================================================================= */}
      <header className="h-16 px-8 flex items-center justify-between bg-white shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            {sessionConfig?.title || 'Question Bank Phase 2'}
          </h2>
          <Info className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
        </div>

        {/* Đồng hồ ở giữa */}
        <div className="flex flex-col items-center">
          {!isTimerHidden ? (
            <span className="font-mono text-xl font-bold text-slate-900">
              {isExamMode ? formatClock(timeLeft) : formatClock(elapsedTime)}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">Đã ẩn thời gian</span>
          )}
          <button
            type="button"
            onClick={() => setIsTimerHidden(!isTimerHidden)}
            className="flex items-center gap-1 border border-slate-200 px-3 py-0.5 rounded-full text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer mt-0.5"
          >
            {isTimerHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{isTimerHidden ? 'Show' : 'Hide'}</span>
          </button>
        </div>

        {/* Công cụ bên phải */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
          <button
            type="button"
            onClick={() => {
              if (highlightPopup) setHighlightPopup(null);
              else alert('Hãy bôi đen bất kỳ đoạn văn nào bên cột bài đọc để mở thanh Highlight & Note!');
            }}
            className="flex flex-col items-center gap-0.5 hover:text-indigo-600 transition cursor-pointer"
          >
            <Highlighter className="w-4 h-4 text-slate-600" />
            <span className="text-[10px]">Highlight & Note</span>
          </button>

          {isMathSection && (
            <>
              <button
                type="button"
                onClick={() => setIsDesmosOpen(true)}
                className="flex flex-col items-center gap-0.5 hover:text-indigo-600 transition cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-slate-600" />
                <span className="text-[10px]">Calculator</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReferenceOpen(true)}
                className="flex flex-col items-center gap-0.5 hover:text-indigo-600 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-slate-600" />
                <span className="text-[10px]">Reference</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onExit}
            className="flex flex-col items-center gap-0.5 text-slate-700 hover:text-rose-600 transition cursor-pointer ml-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[10px]">Save & Exit</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-HEADER: THANH MÃ ĐỀ MÀU NAVY ĐẬM CHUẨN */}
      <div className="bg-[#11224d] text-white py-1.5 text-center text-xs font-bold tracking-wide shrink-0">
        Mã đề: {sessionConfig?.title || 'Question Bank Phase 2'}
      </div>

      {/* ========================================================================= */}
      {/* 3. KHU VỰC LÀM BÀI 2 CỘT */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-y-auto px-8 py-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative min-h-[500px]">
          
          {/* CỘT TRÁI: ĐỀ BÀI */}
          <div 
            ref={readingColRef}
            onMouseUp={handleTextSelection}
            className="p-6 md:p-8 rounded-2xl bg-white space-y-4"
          >
            <div className="text-base text-slate-900 leading-relaxed font-serif select-text">
              <MathRenderer text={questionPrompt} />
            </div>
          </div>

          {/* THANH NGĂN CÁCH TRUNG TÂM CÓ NÚT < > */}
          <div className="hidden md:flex absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-300 items-center justify-center pointer-events-none">
            <span className="w-5 h-7 rounded-sm bg-slate-900 text-white flex items-center justify-center text-[10px] font-mono pointer-events-auto shadow-sm">
              &lt;&gt;
            </span>
          </div>

          {/* CỘT PHẢI: CÂU HỎI & PHƯƠNG ÁN */}
          <div className="p-6 md:p-8 rounded-2xl bg-white space-y-5">
            {/* Thanh bar câu hỏi */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 bg-black text-white font-mono font-bold text-xs flex items-center justify-center rounded-sm">
                  {currentIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={toggleBookmark}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition cursor-pointer ${
                    bookmarked[currentIndex] ? 'text-amber-800 bg-amber-50 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarked[currentIndex] ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>Mark for review</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[11px] font-bold transition cursor-pointer"
                >
                  Confidence
                </button>
                <span className="px-2 py-0.5 border border-slate-300 rounded text-[11px] font-mono font-bold text-slate-600">
                  ABC
                </span>
              </div>
            </div>

            {/* Câu hỏi */}
            <div className="text-sm font-semibold text-slate-800 leading-snug">
              {currentQ?.question || (currentQ?.isGridIn ? 'Enter your answer in the box below:' : 'Which choice completes the text with the most logical and precise word or phrase?')}
            </div>

            {/* Danh sách phương án trắc nghiệm */}
            {!currentQ?.isGridIn && (
              <div className="space-y-3 pt-1">
                {optionsEntries.map(([letter, text]) => {
                  const isSelected = answers[currentIndex] === letter;
                  const isEliminated = (eliminatedOptions[currentIndex] || []).includes(letter);
                  const isCorrectChoice = String(currentQ?.correctAnswer || '').trim().toUpperCase() === letter;

                  let borderStyle = 'border-slate-300 hover:border-slate-400 bg-white';
                  if (isSelected) {
                    borderStyle = 'border-slate-900 bg-slate-50/50 ring-1 ring-slate-900';
                  }
                  if (isCurrentChecked) {
                    if (isCorrectChoice) {
                      borderStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500';
                    } else if (isSelected && !isCurrentCorrect) {
                      borderStyle = 'border-rose-500 bg-rose-50 text-rose-950 ring-1 ring-rose-500';
                    }
                  } else if (isEliminated) {
                    borderStyle = 'border-slate-200 bg-slate-100/50 opacity-40';
                  }

                  return (
                    <div
                      key={letter}
                      onClick={() => !isEliminated && handleSelectOption(letter)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${borderStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'border-slate-400 text-slate-700'
                        }`}>
                          {letter}
                        </span>
                        <div className={`text-sm text-slate-800 font-serif ${isEliminated && !isCurrentChecked ? 'line-through text-slate-400' : ''}`}>
                          <MathRenderer text={text} />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEliminate(letter);
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                        title="Gạch phương án này"
                      >
                        ABC
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Câu điền số */}
            {currentQ?.isGridIn && (
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  value={answers[currentIndex] || ''}
                  onChange={(e) => handleSelectOption(e.target.value)}
                  placeholder="Nhập đáp án phân số hoặc số thập phân (ví dụ: 3/2 hoặc 1.5)..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>
            )}

            {/* Giải thích khi ở chế độ luyện tập */}
            {isCurrentChecked && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-150 ${
                isCurrentCorrect ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
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

      {/* ========================================================================= */}
      {/* 4. FOOTER THANH ĐIỀU HƯỚNG CHUẨN VIETACCEPTED */}
      {/* ========================================================================= */}
      <footer className="h-16 px-8 flex items-center justify-between bg-white border-t border-slate-200 shrink-0">
        <div>
          <h4 className="font-bold text-xs text-slate-900">{userName}</h4>
          <p className="text-[11px] text-slate-400 font-mono">{userEmail}</p>
        </div>

        {/* Nút ở giữa: Question X of Y */}
        <button
          type="button"
          onClick={() => setIsMatrixOpen(true)}
          className="bg-[#11224d] hover:bg-slate-900 text-white font-bold text-xs px-5 py-2 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* Cụm nút điều hướng Back, Check, Next bên phải */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => handleJump(currentIndex - 1)}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Back
          </button>

          {/* ẨN NÚT CHECK KHI THI THẬT, CHỈ HIỆN KHI LUYỆN TẬP */}
          {!isExamMode && (
            <button
              type="button"
              disabled={!hasAnsweredCurrent}
              onClick={handleCheckAnswer}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                hasAnsweredCurrent
                  ? 'bg-sky-400 hover:bg-sky-500 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Check
            </button>
          )}

          {currentIndex === questions.length - 1 ? (
            <button
              type="button"
              onClick={() => handleFinishExam(false)}
              className="px-6 py-2 bg-[#b91c1c] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Finish</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleJump(currentIndex + 1)}
              className="px-6 py-2 bg-[#b91c1c] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
            setTimeLeft(initialDuration);
            setElapsedTime(0);
            setShowInstructions(isExamMode);
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