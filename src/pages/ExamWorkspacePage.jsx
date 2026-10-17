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
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import MatrixModal from '../components/exam/MatrixModal';
import ScoreReportModal from '../components/exam/ScoreReportModal';
import { calculateSatScaledScore, isAnswerCorrect } from '../services/adaptiveEngine';
import { storageService } from '../services/storageService';

/**
 * Hàm kiểm tra đáp án an toàn tuyệt đối (tương thích mọi thứ tự truyền tham số của adaptiveEngine)
 */
function checkAnswerSafely(question, userAnswer) {
  if (!question || userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return false;
  }
  try {
    // Trong adaptiveEngine.js: isAnswerCorrect(userAns, question)
    if (typeof isAnswerCorrect === 'function') {
      const res1 = isAnswerCorrect(userAnswer, question);
      if (typeof res1 === 'boolean' && res1 === true) return true;
      const res2 = isAnswerCorrect(question, userAnswer);
      if (typeof res2 === 'boolean' && res2 === true) return true;
    }
  } catch {
    // Fallback tự so sánh nếu hàm ngoài gặp lỗi
  }

  const cleanUser = String(userAnswer).trim().toUpperCase();
  const cleanCorrect = String(question.correctAnswer || '').trim().toUpperCase();
  return cleanUser !== '' && cleanUser === cleanCorrect;
}

export default function ExamWorkspacePage({ sessionConfig, currentExam, onExit, currentUser }) {
  const activeConfig = sessionConfig || currentExam || {};

  // Lấy danh sách câu hỏi an toàn từ mọi cấu trúc đề thi (questions hoặc module1)
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

  // Kéo giãn 2 cột (Mặc định 50% - 50%)
  const [leftPaneWidth, setLeftPaneWidth] = useState(50);
  const isResizingRef = useRef(false);

  const currentQ = questions[currentIndex] || {};
  const isMathSection = Boolean(
    currentQ?.section?.toLowerCase()?.includes('math') ||
    activeConfig?.section?.toLowerCase()?.includes('math') ||
    activeConfig?.category?.toLowerCase()?.includes('algebra')
  );

  const isExamMode = Boolean(
    activeConfig?.isRealExam ||
    activeConfig?.isAdaptive ||
    activeConfig?.section === 'Full Test' ||
    activeConfig?.mode === 'real' ||
    activeConfig?.mode === 'exam' ||
    (activeConfig?.title && /test|exam|official|module|prediction|hard/i.test(activeConfig.title))
  );

  const [showInstructions, setShowInstructions] = useState(isExamMode);

  // Chuẩn hóa thời gian làm bài (nếu truyền số phút <= 180 thì nhân 60, nếu đã truyền số giây > 180 thì giữ nguyên)
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

  // Bộ theo dõi nhịp độ từng câu (Pacing Tracker tích hợp trực tiếp chống lỗi thiếu hook)
  const [questionTimes, setQuestionTimes] = useState({});
  const [timeOnCurrentQuestion, setTimeOnCurrentQuestion] = useState(0);

  // Modals
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportData, setReportData] = useState(null);

  const [highlightPopup, setHighlightPopup] = useState(null);
  const readingColRef = useRef(null);

  // Reset bộ đếm giây của câu hiện tại khi chuyển câu
  useEffect(() => {
    setTimeOnCurrentQuestion(questionTimes[currentIndex] || 0);
  }, [currentIndex]);

  // Nhấn Enter ở màn hình chờ quy chế để vào thi ngay
  useEffect(() => {
    if (!showInstructions) return;
    const handleEnterStart = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setShowInstructions(false);
      }
    };
    window.addEventListener('keydown', handleEnterStart);
    return () => window.removeEventListener('keydown', handleEnterStart);
  }, [showInstructions]);

  // Đồng hồ đếm ngược & đo thời gian từng câu
  useEffect(() => {
    if (isReportOpen || showInstructions) return;
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
      setTimeOnCurrentQuestion((prev) => {
        const nextSec = prev + 1;
        setQuestionTimes((map) => ({ ...map, [currentIndex]: nextSec }));
        return nextSec;
      });

      if (isExamMode) {
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
  }, [isExamMode, isReportOpen, showInstructions, currentIndex]);

  // Kéo thanh chia cột trái / phải
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
    if (isExamMode) return;
    setCheckedQuestions((prev) => ({ ...prev, [currentIndex]: true }));
  };

  // Phím tắt bàn phím
  useEffect(() => {
    if (showInstructions || isReportOpen || isMatrixOpen) return;
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        handleJump(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handleJump(currentIndex - 1);
      } else if (e.key.toLowerCase() === 'f') {
        toggleBookmark();
      } else if (!currentQ?.isGridIn && ['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const upperKey = e.key.toUpperCase();
        const isElim = (eliminatedOptions[currentIndex] || []).includes(upperKey);
        if (!isElim) handleSelectOption(upperKey);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions.length, showInstructions, isReportOpen, isMatrixOpen, currentQ, eliminatedOptions, isEliminatorMode]);

  // Bôi đen văn bản để mở thanh Highlight
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
          top: Math.max(12, rect.top - 54),
          left: rect.left + rect.width / 2,
          range: range.cloneRange(),
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
      span.className = `${colorClass} px-1 py-0.5 rounded-sm cursor-pointer transition-colors duration-150 select-text`;
      span.title = 'Nhấp đúp để bỏ tô màu';
      span.ondblclick = () => span.replaceWith(...span.childNodes);
      range.surroundContents(span);
      selection.removeAllRanges();
    } catch (e) {
      console.warn('Vui lòng bôi đen văn bản trong cùng một đoạn:', e);
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
        marks.forEach((m) => {
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

  // Nộp bài và chấm điểm
  const handleFinishExam = (isAuto = false) => {
    if (!isAuto && !window.confirm('Bạn có chắc chắn muốn nộp bài và xem phân tích kết quả?')) {
      return;
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
      module1: {
        questions: reviewedQuestions,
        answers: answers,
        timeSpent: timeSpent,
      },
      module2: {
        path: 'Hard',
        questions: [],
        answers: {},
        timeSpent: 0,
      },
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
      console.warn('[ExamWorkspacePage] Lỗi lưu lịch sử:', err);
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
    initial: (dir) => ({
      opacity: 0,
      x: dir > 0 ? 14 : -14,
    }),
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
    },
    exit: (dir) => ({
      opacity: 0,
      x: dir > 0 ? -14 : 14,
      transition: { duration: 0.12, ease: 'easeIn' },
    }),
  };

  // =========================================================================
  // MÀN HÌNH CHỜ QUY CHẾ THI (INSTRUCTIONS SCREEN)
  // =========================================================================
  if (showInstructions) {
    return (
      <div className="h-screen w-screen flex flex-col bg-slate-50 font-sans select-none overflow-y-auto relative text-slate-900">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] border border-slate-200/90 space-y-5 my-auto"
          >
            <div className="text-center space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                <Sparkles className="w-3 h-3" /> Bluebook™ Digital Testing
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {activeConfig?.title || 'SAT Full Practice Test'}
              </h1>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              {[
                {
                  icon: Clock,
                  title: 'Timing & Pacing',
                  desc: `Bài thi tính giờ chuẩn (${Math.round(initialDuration / 60)} phút) kèm bộ đếm nhịp độ từng câu.`,
                },
                {
                  icon: Award,
                  title: 'Adaptive IRT Scoring',
                  desc: 'Quy đổi điểm Scaled Score (200 - 800) theo thuật toán chuẩn College Board.',
                },
                {
                  icon: FileText,
                  title: 'Official Exam Rules',
                  desc: 'Đáp án và giải thích chi tiết sẽ được mở khóa ngay sau khi bạn nộp bài.',
                },
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 p-2.5 rounded-2xl bg-slate-50/70 border border-slate-100"
                  >
                    <div className="w-9 h-9 rounded-xl border border-slate-200/80 flex items-center justify-center shrink-0 bg-white text-indigo-600">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{item.title}</h4>
                      <p className="mt-0.5 leading-relaxed text-slate-500 text-[11px] sm:text-xs">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onExit}
                className="px-4 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Quay lại
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setShowInstructions(false)}
                className="flex-1 py-3 px-6 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Bắt đầu làm bài ngay (Start Exam)</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Trường hợp đề thi rỗng
  if (questions.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 font-sans text-slate-900">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <p className="text-slate-700 font-bold text-sm">Không tìm thấy câu hỏi cho đề thi này.</p>
          <button
            type="button"
            onClick={onExit}
            className="w-full px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Quay lại màn hình chính
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
    'Đang tải nội dung câu hỏi...';

  const rawOpts = currentQ?.options || {};
  const optionsEntries = Array.isArray(rawOpts)
    ? rawOpts.map((opt, i) => [
        String.fromCharCode(65 + i),
        typeof opt === 'object' ? opt.text || opt.value || '' : opt,
      ])
    : Object.entries(rawOpts);

  const hasAnsweredCurrent = answers[currentIndex] !== undefined && answers[currentIndex] !== '';
  const isCurrentChecked = !isExamMode && checkedQuestions[currentIndex];
  const isCurrentCorrect = checkAnswerSafely(currentQ, answers[currentIndex]);
  const isLowTime = isExamMode && timeLeft <= 300;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50/50 select-none overflow-hidden font-sans relative text-slate-900 exam-light-mode">
      {/* THANH HIGHLIGHT NỔI */}
      <AnimatePresence>
        {highlightPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{
              top: `${highlightPopup.top}px`,
              left: `${highlightPopup.left}px`,
              transform: 'translateX(-50%)',
            }}
            className="fixed z-50 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-full px-3 py-1.5 flex items-center gap-2"
          >
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applyHighlight('bg-amber-200/85 text-slate-950');
              }}
              className="w-5 h-5 rounded-full bg-amber-300 border-2 border-white/20 hover:scale-125 transition-transform cursor-pointer"
              title="Highlight Vàng"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applyHighlight('bg-pink-200/85 text-slate-950');
              }}
              className="w-5 h-5 rounded-full bg-pink-300 border-2 border-white/20 hover:scale-125 transition-transform cursor-pointer"
              title="Highlight Hồng"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applyHighlight('bg-sky-200/85 text-slate-950');
              }}
              className="w-5 h-5 rounded-full bg-sky-300 border-2 border-white/20 hover:scale-125 transition-transform cursor-pointer"
              title="Highlight Xanh"
            />
            <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applyHighlight('bg-amber-100/90 border-b-2 border-amber-500 text-slate-950');
              }}
              className="p-1 text-amber-400 hover:text-amber-300 transition cursor-pointer"
              title="Ghi chú quan trọng"
            >
              <StickyNote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                clearHighlightInRange();
              }}
              className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="Xóa highlight"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP BAR */}
      <header className="h-14 px-4 lg:px-6 flex items-center justify-between bg-white border-b border-slate-200 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-7 rounded-full bg-indigo-600" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-md">
                {activeConfig?.title ||
                  (isMathSection
                    ? 'Section 2, Module 1: Math'
                    : 'Section 1, Module 1: Reading and Writing')}
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                {isExamMode ? 'Official Mode' : 'Practice Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* TIMER */}
        <div className="flex items-center gap-2">
          {!isTimerHidden ? (
            <div
              className={`font-mono text-base sm:text-lg font-black tracking-wider px-2.5 py-0.5 rounded-xl transition-colors ${
                isLowTime
                  ? 'text-rose-600 bg-rose-50 border border-rose-200 animate-pulse'
                  : 'text-slate-900'
              }`}
            >
              {isExamMode ? formatClock(timeLeft) : formatClock(elapsedTime)}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Hidden</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsTimerHidden(!isTimerHidden)}
            className="flex items-center gap-1 border border-slate-200 bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            {isTimerHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{isTimerHidden ? 'Show' : 'Hide'}</span>
          </button>
        </div>

        {/* CÔNG CỤ */}
        <div className="flex items-center gap-1.5">
          {!isMathSection && (
            <button
              type="button"
              onClick={() => {
                if (highlightPopup) setHighlightPopup(null);
                else alert('Mẹo: Hãy bôi đen bất kỳ từ hoặc câu nào bên cột bài đọc để bật bảng màu Highlight & Note!');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition cursor-pointer"
            >
              <Highlighter className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">Highlight</span>
            </button>
          )}

          {isMathSection && (
            <>
              <button
                type="button"
                onClick={() => setIsDesmosOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isDesmosOpen
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 border-slate-200'
                }`}
              >
                <Calculator className={`w-3.5 h-3.5 ${isDesmosOpen ? 'text-white' : 'text-indigo-600'}`} />
                <span className="hidden sm:inline">Calculator</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReferenceOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isReferenceOpen
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border-slate-200'
                }`}
              >
                <BookOpen className={`w-3.5 h-3.5 ${isReferenceOpen ? 'text-white' : 'text-amber-600'}`} />
                <span className="hidden sm:inline">Reference</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-HEADER */}
      <div className="bg-[#0f172a] text-white py-1 px-6 flex items-center justify-between text-[11px] font-semibold tracking-wide shrink-0 relative overflow-hidden">
        <div className="flex items-center gap-2 z-10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Câu hỏi:</span>
          <strong className="text-white">
            {currentIndex + 1} / {questions.length}
          </strong>
        </div>

        <div className="flex items-center gap-4 z-10 text-slate-300">
          <span className="font-mono text-indigo-300 font-bold">
            Đã làm: {Object.keys(answers).filter((k) => answers[k] !== '').length}/{questions.length}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* 3. KHU VỰC LÀM BÀI 2 CỘT */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white relative exam-light-mode">
        {/* CỘT TRÁI: ĐOẠN VĂN / ĐỀ BÀI */}
        <div
          style={{
            width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${leftPaneWidth}%` : '100%',
          }}
          className="h-1/2 md:h-full overflow-y-auto px-6 py-5 md:px-10 md:py-7 border-b md:border-b-0 border-slate-200 bg-white selection:bg-sky-200 selection:text-sky-950"
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
                onMouseUp={handleTextSelection}
                className="space-y-4"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {currentQ?.domain || (isMathSection ? 'Problem Solving & Algebra' : 'Reading & Writing Passage')}
                  </span>

                  {isTimeWarning && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{timeOnCurrentQuestion}s</span>
                    </span>
                  )}
                </div>

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

        {/* THANH KÉO CHIA CỘT */}
        <div
          onMouseDown={() => {
            isResizingRef.current = true;
            document.body.style.cursor = 'col-resize';
          }}
          onDoubleClick={() => setLeftPaneWidth(50)}
          title="Kéo để thay đổi kích thước 2 cột (Nhấp đúp để đặt lại 50/50)"
          className="hidden md:flex w-2 bg-slate-100 hover:bg-indigo-100 active:bg-indigo-200 border-x border-slate-200 items-center justify-center cursor-col-resize transition-colors shrink-0 group relative z-10"
        >
          <div className="w-5 h-9 rounded-md bg-slate-800 group-hover:bg-indigo-600 text-white flex items-center justify-center shadow-md transition-colors">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* CỘT PHẢI: CÂU HỎI & CÁC LỰA CHỌN */}
        <div
          style={{
            width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${100 - leftPaneWidth}%` : '100%',
          }}
          className="h-1/2 md:h-full overflow-y-auto px-6 py-5 md:px-10 md:py-7 bg-slate-50/40 selection:bg-sky-200"
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
                        bookmarked[currentIndex]
                          ? 'text-amber-800 bg-amber-100 border border-amber-300'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                      }`}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${
                          bookmarked[currentIndex] ? 'fill-amber-500 text-amber-500' : ''
                        }`}
                      />
                      <span>{bookmarked[currentIndex] ? 'Marked' : 'Mark for Review'}</span>
                    </button>
                  </div>

                  {!currentQ?.isGridIn && (
                    <button
                      type="button"
                      onClick={() => setIsEliminatorMode(!isEliminatorMode)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer border ${
                        isEliminatorMode
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="line-through">ABC</span>
                    </button>
                  )}
                </div>

                <div className="text-[15px] font-semibold text-slate-900 leading-relaxed font-serif">
                  <MathRenderer
                    text={
                      currentQ?.question ||
                      (currentQ?.isGridIn
                        ? 'Enter your answer in the box below:'
                        : 'Which choice completes the text with the most logical and precise word or phrase?')
                    }
                  />
                </div>

                {!currentQ?.isGridIn && (
                  <div className="space-y-2.5 pt-1" role="radiogroup">
                    {optionsEntries.map(([letter, text]) => {
                      const isSelected = answers[currentIndex] === letter;
                      const isEliminated = (eliminatedOptions[currentIndex] || []).includes(letter);
                      const isCorrectChoice =
                        String(currentQ?.correctAnswer || '').trim().toUpperCase() === letter;

                      let cardStyle = 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/20';
                      let badgeStyle = 'border-slate-300 text-slate-700 bg-slate-50';

                      if (isSelected) {
                        cardStyle = 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20';
                        badgeStyle = 'bg-indigo-600 text-white border-indigo-600';
                      }

                      if (isCurrentChecked) {
                        if (isCorrectChoice) {
                          cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20';
                          badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                        } else if (isSelected && !isCurrentCorrect) {
                          cardStyle = 'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20';
                          badgeStyle = 'bg-rose-600 text-white border-rose-600';
                        }
                      } else if (isEliminated) {
                        cardStyle = 'border-slate-200 bg-slate-100 opacity-50';
                        badgeStyle = 'border-slate-300 text-slate-400 bg-slate-200';
                      }

                      return (
                        <div key={letter} className="flex items-center gap-2">
                          <motion.div
                            whileHover={!isEliminated ? { scale: 1.005 } : {}}
                            whileTap={!isEliminated ? { scale: 0.995 } : {}}
                            onClick={() => !isEliminated && handleSelectOption(letter)}
                            className={`group relative flex-1 p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-150 ${cardStyle}`}
                          >
                            <div className="flex items-start gap-3 pr-2">
                              <span
                                className={`w-6 h-6 rounded-full border-2 font-sans font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}`}
                              >
                                {letter}
                              </span>
                              <div
                                className={`text-[14px] leading-relaxed font-serif ${
                                  isEliminated && !isCurrentChecked
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-800'
                                }`}
                              >
                                <MathRenderer text={text} />
                              </div>
                            </div>

                            {isCurrentChecked && isCorrectChoice && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                            {isCurrentChecked && isSelected && !isCurrentCorrect && (
                              <X className="w-5 h-5 text-rose-600 shrink-0" />
                            )}
                          </motion.div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEliminate(letter);
                            }}
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center text-[11px] font-mono font-bold transition cursor-pointer shrink-0 ${
                              isEliminated
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                            }`}
                          >
                            {isEliminated ? (
                              <RotateCcw className="w-3 h-3" />
                            ) : (
                              <span className="line-through">{letter}</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQ?.isGridIn && (
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Student-Produced Response
                    </label>
                    <input
                      type="text"
                      value={answers[currentIndex] || ''}
                      onChange={(e) => handleSelectOption(e.target.value)}
                      placeholder="VD: 3/2 hoặc 1.5"
                      className="w-full px-4 py-3 border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-base font-mono font-bold text-slate-900 outline-none transition-all"
                    />
                  </div>
                )}

                {isCurrentChecked && (
                  <div
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      isCurrentCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="font-extrabold text-sm">
                      {isCurrentCorrect
                        ? 'Chính xác!'
                        : `Chưa chính xác (Đáp án đúng: ${currentQ?.correctAnswer})`}
                    </div>
                    {currentQ?.explanation && (
                      <div className="text-slate-700 font-serif text-[13px] leading-relaxed pt-2 border-t border-slate-200/60">
                        <MathRenderer text={currentQ.explanation} />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="h-14 px-4 lg:px-8 flex items-center justify-between bg-white border-t border-slate-200 shrink-0 z-20">
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="font-bold text-xs text-slate-800">{userName}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsMatrixOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => handleJump(currentIndex - 1)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-50 border-slate-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {!isExamMode && (
            <button
              type="button"
              disabled={!hasAnsweredCurrent}
              onClick={handleCheckAnswer}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                hasAnsweredCurrent
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Check</span>
            </button>
          )}

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
        onSelectQuestion={(idx) => handleJump(idx)}
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
            setQuestionTimes({});
            setTimeLeft(initialDuration);
            setElapsedTime(0);
            setShowInstructions(isExamMode);
          }}
          onHome={onExit}
          reportData={reportData}
        />
      )}

      {isMathSection && (
        <>
          <DesmosModal isOpen={isDesmosOpen} onClose={() => setIsDesmosOpen(false)} />
          <ReferenceModal isOpen={isReferenceOpen} onClose={() => setIsReferenceOpen(false)} />
        </>
      )}
    </div>
  );
}