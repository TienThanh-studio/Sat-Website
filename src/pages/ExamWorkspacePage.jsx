// src/pages/ExamWorkspacePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Highlighter,
  Clock,
  X,
  LogOut,
  Trash2,
  StickyNote,
  Award,
  FileText,
  ChevronDown,
  Check,
  Sparkles,
  GripVertical,
  RotateCcw,
  Play,
  Filter,
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import MatrixModal from '../components/exam/MatrixModal';
import ScoreReportModal from '../components/exam/ScoreReportModal';
import { calculateSatScaledScore, isAnswerCorrect } from '../services/adaptiveEngine';
import { storageService } from '../services/storageService';

function checkAnswerSafely(question, userAnswer) {
  if (!question || userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return false;
  }
  try {
    if (typeof isAnswerCorrect === 'function') {
      const res1 = isAnswerCorrect(userAnswer, question);
      if (typeof res1 === 'boolean' && res1 === true) return true;
      const res2 = isAnswerCorrect(question, userAnswer);
      if (typeof res2 === 'boolean' && res2 === true) return true;
    }
  } catch {
    // ignore
  }
  const cleanUser = String(userAnswer).trim().toUpperCase();
  const cleanCorrect = String(question.correctAnswer || '').trim().toUpperCase();
  return cleanUser !== '' && cleanUser === cleanCorrect;
}

export default function ExamWorkspacePage({ sessionConfig, currentExam, onExit, currentUser }) {
  const activeConfig = sessionConfig || currentExam || {};

  const questions = Array.isArray(activeConfig?.questions) && activeConfig.questions.length > 0
    ? activeConfig.questions
    : Array.isArray(activeConfig?.module1)
    ? activeConfig.module1
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [eliminatedOptions, setEliminatedOptions] = useState({});
  const [checkedQuestions, setCheckedQuestions] = useState({});
  const [isEliminatorMode, setIsEliminatorMode] = useState(false);

  // Bộ lọc trạng thái câu hỏi trong MatrixModal / Question Navigator: 'all' | 'unanswered' | 'answered'
  const [questionFilter, setQuestionFilter] = useState('all');

  const [leftPaneWidth, setLeftPaneWidth] = useState(50);
  const [desmosCurrentWidth, setDesmosCurrentWidth] = useState(0);
  const isResizingRef = useRef(false);

  const currentQ = questions[currentIndex] || {};
  const isMathSection = Boolean(
    currentQ?.section?.toLowerCase()?.includes('math') ||
    activeConfig?.section?.toLowerCase()?.includes('math') ||
    activeConfig?.category?.toLowerCase()?.includes('algebra')
  );

  // Nhận diện phần thi thật 2 modules hoặc đề thi chuẩn (Real Exam)
  const isRealExam = Boolean(
    activeConfig?.isRealExam ||
    activeConfig?.isFullTest ||
    activeConfig?.isAdaptive ||
    activeConfig?.section === 'Full Test' ||
    activeConfig?.mode === 'real' ||
    activeConfig?.mode === 'exam' ||
    (activeConfig?.title && /test|exam|official|module|prediction|hard|full/i.test(activeConfig.title))
  );

  const [showInstructions, setShowInstructions] = useState(isRealExam);

  const standardLimitSeconds = isMathSection ? 35 * 60 : 32 * 60;
  const rawDur = Number(activeConfig?.duration);
  const initialDuration =
    rawDur > 0
      ? rawDur <= 180
        ? rawDur * 60
        : rawDur
      : standardLimitSeconds;

  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  const [questionTimes, setQuestionTimes] = useState({});
  const [timeOnCurrentQuestion, setTimeOnCurrentQuestion] = useState(0);

  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportData, setReportData] = useState(null);

  const [highlightPopup, setHighlightPopup] = useState(null);
  const readingColRef = useRef(null);

  // YÊU CẦU 2: BẮT BUỘC FULLSCREEN KHI THI THẬT & TỰ NỘP BÀI KHI THOÁT FULLSCREEN HOẶC ẤN EXIT
  useEffect(() => {
    if (!isRealExam || showInstructions || isReportOpen) return;

    // Yêu cầu bật chế độ Fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Thí sinh vừa thoát toàn màn hình => Tự động nộp bài ngay lập tức
        alert('Cảnh báo: Bạn vừa thoát khỏi chế độ toàn màn hình trong bài thi thật. Hệ thống sẽ tự động nộp bài!');
        handleFinishExam(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isRealExam, showInstructions, isReportOpen]);

  useEffect(() => {
    setTimeOnCurrentQuestion(questionTimes[currentIndex] || 0);
  }, [currentIndex]);

  // YÊU CẦU 3: CƠ CHẾ TÍNH THỜI GIAN
  // - Thi thật (isRealExam): Đếm ngược từ thời gian quy định (College Board timer)
  // - Luyện tập / Bài đơn: Đếm từ 0 lên vô hạn (elapsedTime)
  useEffect(() => {
    if (isReportOpen || showInstructions) return;
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
      setTimeOnCurrentQuestion((prev) => {
        const nextSec = prev + 1;
        setQuestionTimes((map) => ({ ...map, [currentIndex]: nextSec }));
        return nextSec;
      });

      if (isRealExam) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinishExam(true);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setElapsedTime((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isRealExam, isReportOpen, showInstructions, currentIndex]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth >= 28 && newWidth <= 72) {
        setLeftPaneWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = 'default';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const formatClock = (totalSecs) => {
    const safeSecs = Math.max(0, Number(totalSecs) || 0);
    const m = Math.floor(safeSecs / 60);
    const s = safeSecs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (key) => {
    if (isEliminatorMode) {
      toggleEliminate(key);
      return;
    }
    setAnswers((prev) => ({ ...prev, [currentIndex]: key }));
  };

  const toggleBookmark = () => {
    setBookmarked((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  const toggleEliminate = (key) => {
    setEliminatedOptions((prev) => {
      const cur = prev[currentIndex] || [];
      return {
        ...prev,
        [currentIndex]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
      };
    });
  };

  const handleJump = (idx) => {
    if (idx >= 0 && idx < questions.length && idx !== currentIndex) {
      setSlideDirection(idx > currentIndex ? 1 : -1);
      setCurrentIndex(idx);
      setHighlightPopup(null);
    }
  };

  const handleCheckAnswer = () => {
    if (isRealExam) return;
    setCheckedQuestions((prev) => ({ ...prev, [currentIndex]: true }));
  };

  const handleFinishExam = (isAuto = false) => {
    if (!isAuto && !window.confirm('Bạn có chắc chắn muốn nộp bài và xem phân tích kết quả?')) {
      return;
    }

    // Thoát chế độ toàn màn hình khi nộp bài xong
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    const reviewedQuestions = questions.map((q, idx) => {
      const uAns = answers[idx] !== undefined ? String(answers[idx]).trim() : '';
      const cAns = String(q.correctAnswer || '').trim();
      const isCorrect = checkAnswerSafely(q, uAns);

      return {
        ...q,
        id: q.id || `q_${idx + 1}`,
        userAnswer: uAns,
        correctAnswer: cAns,
        isCorrect: isCorrect,
        domain: q.domain || (isMathSection ? 'Math Domain' : 'Reading & Writing'),
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || 'Đáp án chính xác được xác nhận theo tiêu chuẩn College Board.',
      };
    });

    const correctCount = reviewedQuestions.filter((q) => q.isCorrect).length;
    const totalCount = Math.max(1, reviewedQuestions.length);

    const fakeSessionState = {
      module1: { questions: reviewedQuestions, answers: answers, timeSpent: timeSpent },
      module2: { path: 'Hard', questions: [], answers: {}, timeSpent: 0 },
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
    reviewedQuestions.forEach((q) => {
      const d = q.domain || 'General';
      if (!domainStats[d]) {
        domainStats[d] = { correct: 0, total: 0, percentage: 0 };
      }
      domainStats[d].total += 1;
      if (q.isCorrect) domainStats[d].correct += 1;
    });

    Object.keys(domainStats).forEach((d) => {
      const st = domainStats[d];
      st.percentage = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
    });

    const finalReport = {
      scaledScore: calculatedScore,
      section: activeConfig?.title || (isMathSection ? 'Math Section' : 'Reading & Writing'),
      module2Path: correctCount / totalCount >= 0.6 ? 'Hard' : 'Easy',
      totalQuestions: reviewedQuestions.length,
      correctCount: correctCount,
      timeSpent: timeSpent,
      questionTimes: questionTimes || {},
      domainPerformance: domainStats,
      questions: reviewedQuestions,
    };

    try {
      if (storageService && typeof storageService.saveExamResult === 'function') {
        storageService.saveExamResult(finalReport);
      }
    } catch (err) {
      console.warn(err);
    }

    setReportData(finalReport);
    setIsReportOpen(true);
  };

const userName =
    localStorage.getItem('sat_custom_display_name') ||
    currentUser?.name ||
    'Student Candidate';

  const warningThreshold = isMathSection ? 120 : 90;
  const isTimeWarning = timeOnCurrentQuestion > warningThreshold;

  const questionTransitionVariants = {
    initial: (dir) => ({ opacity: 0, x: dir > 0 ? 14 : -14 }),
    animate: { opacity: 1, x: 0, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -14 : 14, transition: { duration: 0.12, ease: 'easeIn' } }),
  };

  if (showInstructions) {
    return (
      <div className="h-screen w-screen flex flex-col bg-slate-50 font-sans select-none overflow-y-auto relative text-slate-900">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-xl border border-slate-200 space-y-5 my-auto"
          >
            <div className="text-center space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                <Sparkles className="w-3 h-3" /> Official Exam Mode (Strict Fullscreen)
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {activeConfig?.title || 'SAT Real Exam Session'}
              </h1>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-medium">
                ⚠️ <strong>Quy chế thi thật:</strong> Bài thi yêu cầu bắt buộc ở chế độ toàn màn hình. Nếu bạn thoát chế độ toàn màn hình hoặc ấn Exit, hệ thống sẽ <strong>tự động nộp bài thi ngay lập tức</strong>.
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onExit}
                className="px-4 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  setShowInstructions(false);
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                }}
                className="flex-1 py-3 px-6 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-700 transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Đồng ý & Bắt đầu thi thật</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 font-sans text-slate-900">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4 max-w-sm">
          <p className="text-slate-700 font-bold text-sm">Không tìm thấy câu hỏi cho đề thi này.</p>
          <button
            type="button"
            onClick={onExit}
            className="w-full px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Quay lại
          </button>
        </div>
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
    '';

  const rawOpts = currentQ?.options || {};
  const optionsEntries = Array.isArray(rawOpts)
    ? rawOpts.map((opt, i) => [
        String.fromCharCode(65 + i),
        typeof opt === 'object' ? opt.text || opt.value || '' : opt,
      ])
    : Object.entries(rawOpts);

  const hasAnsweredCurrent = answers[currentIndex] !== undefined && answers[currentIndex] !== '';
  const isCurrentChecked = !isRealExam && checkedQuestions[currentIndex];
  const isCurrentCorrect = checkAnswerSafely(currentQ, answers[currentIndex]);
  const isLowTime = isRealExam && timeLeft <= 300;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  // Tính toán style tự động chừa khoảng trống cho Desmos khi đang mở bên phải
  const rightOffsetStyle = isDesmosOpen ? `${desmosCurrentWidth}px` : '0px';

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50/50 select-none overflow-hidden font-sans relative text-slate-900 exam-light-mode">
      {/* 1. TOP BAR */}
      <header className="h-14 px-4 lg:px-6 flex items-center justify-between bg-white border-b border-slate-200 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-7 rounded-full bg-indigo-600" />
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight truncate max-w-md">
            {activeConfig?.title || (isMathSection ? 'Math Module' : 'Reading & Writing')}
          </h2>
        </div>

        {/* TIMER */}
        <div className="flex items-center gap-2">
          <div
            className={`font-mono text-base sm:text-lg font-black tracking-wider px-2.5 py-0.5 rounded-xl ${
              isLowTime ? 'text-rose-600 bg-rose-50 border border-rose-200 animate-pulse' : 'text-slate-900'
            }`}
          >
            {isRealExam ? formatClock(timeLeft) : formatClock(elapsedTime)}
          </div>
          <button
            type="button"
            onClick={() => setIsTimerHidden(!isTimerHidden)}
            className="flex items-center gap-1 border border-slate-200 bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {isTimerHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{isTimerHidden ? 'Show' : 'Hide'}</span>
          </button>
        </div>

        {/* CÔNG CỤ & NÚT EXIT (KÍCH HOẠT TỰ NỘP BÀI) */}
        <div className="flex items-center gap-1.5">
          {isMathSection && (
            <>
              <button
                type="button"
                onClick={() => setIsDesmosOpen(!isDesmosOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isDesmosOpen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 border-slate-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Calculator</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReferenceOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-amber-50 text-slate-700 border border-slate-200 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Reference</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleFinishExam(false)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs"
            title="Thoát và nộp bài"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit & Submit</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-HEADER */}
      <div className="bg-[#0f172a] text-white py-1 px-6 flex items-center justify-between text-[11px] font-semibold tracking-wide shrink-0 relative overflow-hidden">
        <div className="flex items-center gap-2 z-10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Câu hỏi:</span>
          <strong className="text-white">{currentIndex + 1} / {questions.length}</strong>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
            animate={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3. KHU VỰC LÀM BÀI 2 CỘT (TỰ ĐỘNG CHỪA KHOẢNG TRỐNG CHO DESMOS BÊN PHẢI) */}
      <main
        style={{ marginRight: rightOffsetStyle, transition: 'margin-right 0.15s ease-out' }}
        className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white relative exam-light-mode"
      >
        {/* CỘT TRÁI: PASSAGE */}
        <div
          style={{ width: `${leftPaneWidth}%` }}
          className="h-1/2 md:h-full overflow-y-auto px-6 py-5 md:px-10 md:py-7 border-b md:border-b-0 border-slate-200 bg-white"
        >
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div
                key={`passage-${currentIndex}`}
                custom={slideDirection}
                variants={questionTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                ref={readingColRef}
                className="space-y-4"
              >
                <div className="text-[15.5px] text-slate-800 leading-[1.8] font-serif select-text">
                  <MathRenderer
                    text={questionPrompt}
                    image={currentQ?.image || currentQ?.figure || currentQ?.imageUrl}
                    svg={currentQ?.svg || currentQ?.chart}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* RESIZER */}
        <div
          onMouseDown={() => {
            isResizingRef.current = true;
            document.body.style.cursor = 'col-resize';
          }}
          className="hidden md:flex w-2 bg-slate-100 hover:bg-indigo-100 border-x border-slate-200 items-center justify-center cursor-col-resize transition-colors shrink-0 z-10"
        >
          <GripVertical className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* CỘT PHẢI: QUESTIONS & OPTIONS */}
        <div
          style={{ width: `${100 - leftPaneWidth}%` }}
          className="h-1/2 md:h-full overflow-y-auto px-6 py-5 md:px-10 md:py-7 bg-slate-50/40"
        >
          <div className="max-w-xl mx-auto">
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div
                key={`question-${currentIndex}`}
                custom={slideDirection}
                variants={questionTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2">
                  <div className="flex items-center gap-3">
                    <span className="min-w-[28px] h-7 px-2 bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center rounded-lg">
                      {currentIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={toggleBookmark}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        bookmarked[currentIndex] ? 'text-amber-800 bg-amber-100 border border-amber-300' : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${bookmarked[currentIndex] ? 'fill-amber-500 text-amber-500' : ''}`} />
                      <span>{bookmarked[currentIndex] ? 'Marked' : 'Mark for Review'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[15px] font-semibold text-slate-900 leading-relaxed font-serif">
                  <MathRenderer text={currentQ?.question || 'Chọn đáp án phù hợp nhất:'} />
                </div>

                <div className="space-y-2.5 pt-1">
                  {optionsEntries.map(([letter, text]) => {
                    const isSelected = answers[currentIndex] === letter;
                    const isCorrectChoice = String(currentQ?.correctAnswer || '').trim().toUpperCase() === letter;

                    let cardStyle = 'border-slate-200 bg-white hover:border-indigo-300';
                    let badgeStyle = 'border-slate-300 text-slate-700 bg-slate-50';

                    if (isSelected) {
                      cardStyle = 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20';
                      badgeStyle = 'bg-indigo-600 text-white border-indigo-600';
                    }

                    if (isCurrentChecked && isCorrectChoice) {
                      cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950';
                      badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                    }

                    return (
                      <div key={letter} className="flex items-center gap-2">
                        <div
                          onClick={() => handleSelectOption(letter)}
                          className={`flex-1 p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${cardStyle}`}
                        >
                          <div className="flex items-start gap-3 pr-2">
                            <span className={`w-6 h-6 rounded-full border-2 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}`}>
                              {letter}
                            </span>
                            <div className="text-[14px] leading-relaxed font-serif text-slate-800">
                              <MathRenderer text={text} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="h-14 px-4 lg:px-8 flex items-center justify-between bg-white border-t border-slate-200 shrink-0 z-20">
        <button
          type="button"
          onClick={() => setIsMatrixOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => handleJump(currentIndex - 1)}
            className="px-4 py-2 rounded-xl text-xs font-bold border bg-white text-slate-700 border-slate-200 cursor-pointer disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              type="button"
              onClick={() => handleFinishExam(false)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Submit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleJump(currentIndex + 1)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </footer>

      {/* MODALS */}
      <MatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        questions={questions}
        currentIndex={currentIndex}
        answers={answers}
        bookmarked={bookmarked}
        onSelectIndex={(idx) => handleJump(idx)}
        filterMode={questionFilter}
        onFilterChange={setQuestionFilter}
      />

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
          }}
          onHome={onExit}
          reportData={reportData}
        />
      )}

      {isMathSection && (
        <>
          <DesmosModal
            isOpen={isDesmosOpen}
            onClose={() => setIsDesmosOpen(false)}
            onWidthChange={(w) => setDesmosCurrentWidth(w)}
          />
          <ReferenceModal isOpen={isReferenceOpen} onClose={() => setIsReferenceOpen(false)} />
        </>
      )}
    </div>
  );
}