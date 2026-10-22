// src/pages/ExamWorkspacePage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronDown,
  Clock,
  Calculator,
  BookOpen,
  Bookmark,
  CheckCircle2,
  XCircle,
  Bot,
  Highlighter,
  Trash2,
  MapPin,
  Sun,
  Moon,
  Check,
  ListFilter,
  HelpCircle,
  GripVertical,
  MessageSquarePlus,
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import ScoreReportModal from '../components/exam/ScoreReportModal';
import AiTutorModal from '../components/exam/AiTutorModal';
import { questionService } from '../services/questionService';
import { storageService } from '../services/storageService';
import { calculateIrtScore } from '../services/satIrtScoring';

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Vàng', bg: 'bg-yellow-200/90 text-slate-900', hex: '#fef08a' },
  { id: 'blue', label: 'Xanh', bg: 'bg-sky-200/90 text-slate-900', hex: '#bae6fd' },
  { id: 'pink', label: 'Hồng', bg: 'bg-pink-200/90 text-slate-900', hex: '#fbcfe8' },
];

export default function ExamWorkspacePage({
  activeCategory,
  examConfig,
  onExit,
  onComplete,
}) {
  // 1. Lấy danh sách câu hỏi
  const initialQuestions = useMemo(() => {
    const source = activeCategory || examConfig;
    if (source?.questions && Array.isArray(source.questions) && source.questions.length > 0) {
      return source.questions;
    }
    if (source?.id) {
      const cat = questionService.getCategoryById(source.id);
      return cat?.questions || [];
    }
    return questionService.getCategories()[0]?.questions || [];
  }, [activeCategory, examConfig]);

  const [inAppFilter, setInAppFilter] = useState('all'); // 'all' | 'unanswered'
  const [completedSet, setCompletedSet] = useState(() => storageService.getCompletedSet());

  const questions = useMemo(() => {
    if (inAppFilter === 'unanswered') {
      const remaining = initialQuestions.filter((q) => !completedSet.has(String(q.id)));
      return remaining.length > 0 ? remaining : initialQuestions;
    }
    return initialQuestions;
  }, [initialQuestions, inAppFilter, completedSet]);

  // 2. State điều khiển giao diện chuẩn Bluebook
  const [bluebookLightMode, setBluebookLightMode] = useState(true); // Mặc định giao diện sáng giống thi thật 100%
  const [leftPaneWidth, setLeftPaneWidth] = useState(50); // Tỷ lệ chia đôi màn hình (%)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isReviewPageOpen, setIsReviewPageOpen] = useState(false); // Màn hình "Check Your Work" cuối module
  const [showDirections, setShowDirections] = useState(false);
  const [showEliminatorTool, setShowEliminatorTool] = useState(true);

  // 3. State làm bài của học sinh
  const [userAnswers, setUserAnswers] = useState({});
  const [checkedMap, setCheckedMap] = useState({});
  const [flaggedMap, setFlaggedMap] = useState({});
  const [eliminatedMap, setEliminatedMap] = useState({});
  const [annotationsMap, setAnnotationsMap] = useState({}); // Lưu highlight & note theo từng câu hỏi
  const [selectionPopup, setSelectionPopup] = useState(null); // { text, x, y }
  const [activeNoteInput, setActiveNoteInput] = useState('');

  // 4. Đồng hồ & Modals
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [scoreReport, setScoreReport] = useState(null);

  const questionTimesRef = useRef({});
  const passageContainerRef = useRef(null);

  useEffect(() => {
    setCurrentIdx(0);
    setUserAnswers({});
    setCheckedMap({});
    setFlaggedMap({});
    setEliminatedMap({});
    setAnnotationsMap({});
    setIsReviewPageOpen(false);
    setElapsedSeconds(0);
  }, [activeCategory, examConfig]);

  // Bộ đếm thời gian
  useEffect(() => {
    if (scoreReport) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      if (!isReviewPageOpen) {
        questionTimesRef.current[currentIdx] =
          (questionTimesRef.current[currentIdx] || 0) + 1;
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIdx, scoreReport, isReviewPageOpen]);

  // Kéo thanh chia đôi màn hình (Resizable Split Pane)
  useEffect(() => {
    if (!isDraggingSplit) return;
    const handleMouseMove = (e) => {
      const pct = (e.clientX / window.innerWidth) * 100;
      if (pct >= 28 && pct <= 72) {
        setLeftPaneWidth(pct);
      }
    };
    const handleMouseUp = () => setIsDraggingSplit(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit]);

  const currentQ = questions[currentIdx] || questions[0];
  const qId = currentQ?.id || `q_${currentIdx}`;
  const selectedAnswer = userAnswers[qId] || '';
  const isChecked = Boolean(checkedMap[qId]);
  const isAlreadyCompletedBefore = completedSet.has(String(qId));
  const currentAnnotations = annotationsMap[qId] || [];

  const isMathSection = useMemo(() => {
    const secStr = String(
      currentQ?.section || activeCategory?.section || currentQ?.domain || ''
    ).toLowerCase();
    return (
      secStr.includes('math') ||
      secStr.includes('algebra') ||
      secStr.includes('geometry') ||
      secStr.includes('data')
    );
  }, [currentQ, activeCategory]);

  // Phím tắt bàn phím chuẩn thực chiến (A, B, C, D, M, Mũi tên Trái/Phải)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        scoreReport ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      if (!isReviewPageOpen && ['A', 'B', 'C', 'D'].includes(key)) {
        const eliminatedForQ = eliminatedMap[qId] || [];
        if (!eliminatedForQ.includes(key)) {
          setUserAnswers((prev) => ({ ...prev, [qId]: key }));
        }
      } else if (!isReviewPageOpen && key === 'M') {
        setFlaggedMap((prev) => ({ ...prev, [qId]: !prev[qId] }));
      } else if (e.key === 'ArrowRight') {
        if (isReviewPageOpen) return;
        if (currentIdx < questions.length - 1) {
          setCurrentIdx((i) => i + 1);
          setSelectionPopup(null);
        } else {
          setIsReviewPageOpen(true);
        }
      } else if (e.key === 'ArrowLeft') {
        if (isReviewPageOpen) {
          setIsReviewPageOpen(false);
        } else if (currentIdx > 0) {
          setCurrentIdx((i) => i - 1);
          setSelectionPopup(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, questions.length, scoreReport, isReviewPageOpen, qId, eliminatedMap]);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-12 text-center text-slate-300 space-y-4">
        <p className="text-lg font-bold">Không tìm thấy câu hỏi nào trong bộ đề này.</p>
        <button
          type="button"
          onClick={onExit}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer"
        >
          Quay lại Ngân hàng câu hỏi
        </button>
      </div>
    );
  }

  const rawOptions = currentQ.options || {};
  const optionEntries = Array.isArray(rawOptions)
    ? rawOptions.map((opt, idx) => [
        String.fromCharCode(65 + idx),
        typeof opt === 'object' ? opt.text || opt.value || '' : String(opt),
      ])
    : Object.entries(rawOptions);

  const handleSelectOption = (letter) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: prev[qId] === letter ? '' : letter,
    }));
  };

  const handleToggleEliminate = (e, letter) => {
    e.stopPropagation();
    setEliminatedMap((prev) => {
      const currentList = prev[qId] || [];
      const isRemoving = currentList.includes(letter);
      const nextList = isRemoving
        ? currentList.filter((item) => item !== letter)
        : [...currentList, letter];

      // Nếu gạch đáp án đang chọn thì bỏ chọn đáp án đó giống Bluebook
      if (!isRemoving && userAnswers[qId] === letter) {
        setUserAnswers((uPrev) => ({ ...uPrev, [qId]: '' }));
      }
      return { ...prev, [qId]: nextList };
    });
  };

  // Xử lý bôi đen văn bản để Highlight & Note (Chuẩn Bluebook Reading & Writing)
  const handlePassageMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 2) return;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionPopup({
      text,
      x: Math.min(window.innerWidth - 280, Math.max(16, rect.left)),
      y: Math.max(70, rect.top - 48),
    });
  };

  const handleAddAnnotation = (colorObj, withNote = false) => {
    if (!selectionPopup?.text) return;
    const noteText = withNote
      ? window.prompt('Nhập ghi chú (Annotation) cho đoạn vừa chọn:', '') || ''
      : '';

    const newItem = {
      id: `hl_${Date.now()}`,
      quote: selectionPopup.text,
      color: colorObj.id,
      hex: colorObj.hex,
      note: noteText.trim(),
    };

    setAnnotationsMap((prev) => ({
      ...prev,
      [qId]: [...(prev[qId] || []), newItem],
    }));
    window.getSelection()?.removeAllRanges();
    setSelectionPopup(null);
  };

  const handleRemoveAnnotation = (annId) => {
    setAnnotationsMap((prev) => ({
      ...prev,
      [qId]: (prev[qId] || []).filter((a) => a.id !== annId),
    }));
  };

  // Kiểm tra đáp án từng câu (Khi luyện tập) & Tự động lưu vào danh sách Đã làm
  const handleCheckCurrentAnswer = () => {
    if (!selectedAnswer) return;
    setCheckedMap((prev) => ({ ...prev, [qId]: true }));
    storageService.markSingleQuestionCompleted(qId);
    setCompletedSet(storageService.getCompletedSet());

    const isRight =
      String(selectedAnswer).trim().toUpperCase() ===
      String(currentQ.correctAnswer).trim().toUpperCase();
    if (!isRight) {
      storageService.addMistake({
        ...currentQ,
        userAnswer: selectedAnswer,
      });
    }
  };

  // Nộp toàn bộ bài thi
  const handleSubmitExam = () => {
    const detailedQuestions = questions.map((q, idx) => {
      const id = q.id || `q_${idx}`;
      const uAns = String(userAnswers[id] || '').trim().toUpperCase();
      const cAns = String(q.correctAnswer || 'A').trim().toUpperCase();
      const isCorrect = uAns !== '' && uAns === cAns;

      return {
        ...q,
        id,
        userAnswer: uAns,
        correctAnswer: cAns,
        isCorrect,
      };
    });

    const answeredIds = detailedQuestions
      .filter((q) => q.userAnswer !== '')
      .map((q) => q.id);
    storageService.markQuestionsCompleted(answeredIds);
    setCompletedSet(storageService.getCompletedSet());

    const totalCount = detailedQuestions.length;
    const correctCount = detailedQuestions.filter((q) => q.isCorrect).length;

    const domainPerformance = {};
    detailedQuestions.forEach((q) => {
      const dom = q.domain || 'Reading & Writing';
      if (!domainPerformance[dom]) {
        domainPerformance[dom] = { correct: 0, total: 0, percentage: 0 };
      }
      domainPerformance[dom].total += 1;
      if (q.isCorrect) domainPerformance[dom].correct += 1;
    });
    Object.keys(domainPerformance).forEach((dom) => {
      const item = domainPerformance[dom];
      item.percentage =
        item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
    });

    let scaledScore = 200 + Math.round((correctCount / Math.max(1, totalCount)) * 600);
    try {
      if (typeof calculateIrtScore === 'function') {
        const irt = calculateIrtScore(detailedQuestions);
        if (irt && Number(irt.scaledScore) >= 200) {
          scaledScore = irt.scaledScore;
        }
      }
    } catch {
      // Fallback scale
    }

    const report = {
      id: `rep_${Date.now()}`,
      section: activeCategory?.title || examConfig?.title || 'Digital SAT Practice',
      scaledScore,
      totalQuestions: totalCount,
      correctCount,
      timeSpent: elapsedSeconds,
      module2Path: scaledScore >= 600 ? 'Hard' : 'Standard',
      domainPerformance,
      questionTimes: questionTimesRef.current,
      questions: detailedQuestions,
    };

    storageService.saveExamResult(report);
    setScoreReport(report);
    if (typeof onComplete === 'function') {
      onComplete(report);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isCurrentCorrect =
    String(selectedAnswer).trim().toUpperCase() ===
    String(currentQ.correctAnswer).trim().toUpperCase();

  // Render đoạn văn có tô màu Highlight thực tế
  const renderHighlightedPassage = (rawPassage) => {
    if (!rawPassage || currentAnnotations.length === 0) {
      return (
        <MathRenderer
          text={rawPassage || 'Đọc câu hỏi ở cột bên phải.'}
          image={currentQ.image || currentQ.figure}
          svg={currentQ.svg}
        />
      );
    }

    // Nếu không chứa công thức LaTeX phức tạp, áp dụng tô màu trực tiếp trên các đoạn bôi đen
    if (!rawPassage.includes('$') && !rawPassage.includes('\\(')) {
      let parts = [{ text: rawPassage, highlight: null }];
      currentAnnotations.forEach((ann) => {
        if (!ann.quote) return;
        const nextParts = [];
        parts.forEach((part) => {
          if (part.highlight || !part.text.includes(ann.quote)) {
            nextParts.push(part);
          } else {
            const splitArr = part.text.split(ann.quote);
            splitArr.forEach((chunk, i) => {
              if (chunk) nextParts.push({ text: chunk, highlight: null });
              if (i < splitArr.length - 1) {
                nextParts.push({ text: ann.quote, highlight: ann });
              }
            });
          }
        });
        parts = nextParts;
      });

      return (
        <div>
          {parts.map((p, idx) =>
            p.highlight ? (
              <mark
                key={idx}
                style={{ backgroundColor: p.highlight.hex }}
                className="px-0.5 rounded text-slate-900 underline decoration-slate-700/50 cursor-pointer"
                title={p.highlight.note ? `Ghi chú: ${p.highlight.note}` : 'Bấm để xóa highlight'}
                onClick={() => handleRemoveAnnotation(p.highlight.id)}
              >
                {p.text}
              </mark>
            ) : (
              <span key={idx}>{p.text}</span>
            )
          )}
        </div>
      );
    }

    return (
      <MathRenderer
        text={rawPassage}
        image={currentQ.image || currentQ.figure}
        svg={currentQ.svg}
      />
    );
  };

  // Hệ màu chuẩn Bluebook Light Mode vs Dark Mode
  const theme = bluebookLightMode
    ? {
        bgMain: 'bg-white text-slate-900',
        bgHeader: 'bg-white border-slate-300 text-slate-900',
        bgPaneLeft: 'bg-white text-slate-900',
        bgPaneRight: 'bg-white text-slate-900',
        bgQuestionBar: 'bg-[#f0f2f5] border-slate-300 text-slate-900',
        optionDefault: 'border-slate-400 bg-white text-slate-900 hover:bg-slate-50',
        optionSelected: 'border-[2.5px] border-[#1d4ed8] bg-[#eff6ff] text-slate-950',
        textMuted: 'text-slate-600',
        btnTool: 'hover:bg-slate-100 text-slate-800 border-transparent',
      }
    : {
        bgMain: 'bg-[#080C17] text-slate-100',
        bgHeader: 'bg-[#0B1020] border-slate-700 text-slate-100',
        bgPaneLeft: 'bg-[#080C17] text-slate-100',
        bgPaneRight: 'bg-[#0A1020] text-slate-100',
        bgQuestionBar: 'bg-slate-900 border-slate-700 text-slate-100',
        optionDefault: 'border-slate-700 bg-slate-900/80 text-slate-200 hover:border-slate-500',
        optionSelected: 'border-[2.5px] border-cyan-400 bg-cyan-500/15 text-white',
        textMuted: 'text-slate-400',
        btnTool: 'hover:bg-slate-800 text-slate-200 border-white/10',
      };

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col select-none overflow-hidden font-sans ${theme.bgMain}`}
    >
      {/* =================================================================== */}
      {/* 1. HEADER CHUẨN BLUEBOOK (CÓ VIỀN ĐỨT ĐOẠN DASHED BORDER)          */}
      {/* =================================================================== */}
      <header
        className={`h-[66px] px-4 lg:px-8 border-b-2 border-dashed flex items-center justify-between shrink-0 relative ${theme.bgHeader}`}
      >
        {/* Góc trái: Tên Section + Nút Directions dropdown */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold tracking-tight truncate">
              {isMathSection
                ? 'Section 2, Module 1: Math'
                : 'Section 1, Module 1: Reading and Writing'}
            </h1>
            {isAlreadyCompletedBefore && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Đã làm
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDirections(!showDirections)}
            className={`inline-flex items-center gap-1 text-xs font-semibold w-fit cursor-pointer ${theme.textMuted} hover:underline`}
          >
            <span>Directions</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showDirections ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Chính giữa: Đồng hồ Bluebook + Nút Hide */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          {showTimer ? (
            <div className="text-lg sm:text-xl font-bold font-mono tracking-wider leading-none">
              {formatTimer(elapsedSeconds)}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs font-semibold py-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Timer Hidden</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowTimer(!showTimer)}
            className="mt-1 px-2.5 py-0.5 rounded-full border border-slate-400 text-[10px] font-bold hover:bg-slate-200/50 transition cursor-pointer"
          >
            {showTimer ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Góc phải: Bộ công cụ chuẩn Bluebook (Highlights & Notes / Calculator / Reference / More) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {!isMathSection && (
            <button
              type="button"
              onClick={() => {
                const sel = window.getSelection()?.toString()?.trim();
                if (sel) {
                  handleAddAnnotation(HIGHLIGHT_COLORS[0], false);
                } else {
                  alert(
                    'Mẹo chuẩn Bluebook: Hãy dùng chuột bôi đen bất kỳ đoạn văn bản nào ở cột bên trái để tô màu Highlight hoặc thêm Ghi chú (Annotate)!'
                  );
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg flex flex-col items-center gap-0.5 text-[11px] font-semibold transition cursor-pointer ${theme.btnTool}`}
              title="Bôi đen văn bản bên trái rồi bấm để Highlight hoặc Note"
            >
              <Highlighter className="w-4 h-4" />
              <span className="hidden md:inline">Highlights & Notes</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDesmosOpen(true)}
            className={`px-2.5 py-1.5 rounded-lg flex flex-col items-center gap-0.5 text-[11px] font-semibold transition cursor-pointer ${theme.btnTool}`}
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden md:inline">Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReferenceOpen(true)}
            className={`px-2.5 py-1.5 rounded-lg flex flex-col items-center gap-0.5 text-[11px] font-semibold transition cursor-pointer ${theme.btnTool}`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">Reference</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setInAppFilter((prev) => (prev === 'unanswered' ? 'all' : 'unanswered'))
            }
            className={`px-2.5 py-1.5 rounded-lg flex flex-col items-center gap-0.5 text-[11px] font-semibold transition cursor-pointer ${
              inAppFilter === 'unanswered'
                ? 'bg-blue-600 text-white'
                : theme.btnTool
            }`}
            title="Chỉ lọc những câu chưa làm"
          >
            <ListFilter className="w-4 h-4" />
            <span className="hidden lg:inline">
              {inAppFilter === 'unanswered' ? 'Chưa làm' : 'Lọc câu'}
            </span>
          </button>

          {/* Chuyển đổi giao diện Sáng (Bluebook thật) / Tối */}
          <button
            type="button"
            onClick={() => setBluebookLightMode(!bluebookLightMode)}
            className={`p-2 rounded-lg border transition cursor-pointer ${theme.btnTool}`}
            title={
              bluebookLightMode
                ? 'Đang ở giao diện Sáng chuẩn Bluebook (Bấm để sang chế độ Tối)'
                : 'Bấm để về giao diện Sáng chuẩn thi thật Bluebook'
            }
          >
            {bluebookLightMode ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={onExit}
            className="ml-1 px-3 py-1.5 rounded-lg border border-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-xs font-bold transition cursor-pointer"
          >
            Save & Exit
          </button>
        </div>
      </header>

      {/* Popover Directions giống hệt Bluebook */}
      {showDirections && (
        <div className="fixed inset-x-0 top-[66px] z-50 mx-auto max-w-3xl bg-white text-slate-900 border-2 border-slate-800 rounded-b-xl shadow-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700">
              Directions
            </h3>
            <button
              type="button"
              onClick={() => setShowDirections(false)}
              className="px-3 py-1 rounded bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            {isMathSection
              ? 'The questions in this section address a number of important math skills. Use of a calculator is permitted for all questions. Unless otherwise indicated: All variables and expressions represent real numbers. Figures provided are drawn to scale.'
              : 'The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).'}
          </p>
          <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-lg">
            <strong>Phím tắt nhanh:</strong> Nhấn phím <kbd className="px-1.5 py-0.5 bg-white border rounded">A</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded">B</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded">C</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded">D</kbd> để chọn đáp án • <kbd className="px-1.5 py-0.5 bg-white border rounded">M</kbd> để Mark for Review • <kbd className="px-1.5 py-0.5 bg-white border rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded">→</kbd> để chuyển câu.
          </div>
        </div>
      )}

      {/* Thanh nổi Highlight & Note khi bôi đen văn bản */}
      {selectionPopup && (
        <div
          style={{ left: selectionPopup.x, top: selectionPopup.y }}
          className="fixed z-50 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 px-3 py-1.5 flex items-center gap-2 animate-fade-in"
        >
          <span className="text-[11px] font-bold text-slate-300 mr-1">Highlight:</span>
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleAddAnnotation(c, false)}
              style={{ backgroundColor: c.hex }}
              className="w-5 h-5 rounded-full border border-white/40 hover:scale-110 transition cursor-pointer"
              title={`Tô màu ${c.label}`}
            />
          ))}
          <div className="h-4 w-[1px] bg-slate-700 mx-1" />
          <button
            type="button"
            onClick={() => handleAddAnnotation(HIGHLIGHT_COLORS[0], true)}
            className="text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectionPopup(null)}
            className="text-xs text-slate-400 hover:text-white ml-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. MÀN HÌNH LÀM BÀI HOẶC MÀN HÌNH "CHECK YOUR WORK" CUỐI MODULE     */}
      {/* =================================================================== */}
      {isReviewPageOpen ? (
        <div className="flex-1 overflow-y-auto p-6 lg:p-12 flex flex-col items-center">
          <div className="max-w-3xl w-full space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold">Check Your Work</h2>
              <p className={`text-sm ${theme.textMuted}`}>
                On test day, you won&apos;t be able to move on to the next module until time expires.
                For these practice questions, you can click <strong>Submit & Score</strong> when you are ready.
              </p>
            </div>

            <div
              className={`rounded-2xl border p-6 shadow-sm space-y-5 ${
                bluebookLightMode
                  ? 'bg-white border-slate-300'
                  : 'bg-slate-900 border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                <span className="font-bold text-base">
                  {activeCategory?.title || 'Section 1: Reading and Writing'}
                </span>
                <div className="flex items-center gap-5 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 border border-dashed border-slate-500 inline-block rounded-sm" />
                    Unanswered (
                    {
                      questions.filter((q, idx) => !userAnswers[q.id || `q_${idx}`])
                        .length
                    }
                    )
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-red-600 fill-red-600" />
                    For Review ({Object.values(flaggedMap).filter(Boolean).length})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                {questions.map((q, idx) => {
                  const id = q.id || `q_${idx}`;
                  const isAns = Boolean(userAnswers[id]);
                  const isFlag = Boolean(flaggedMap[id]);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setCurrentIdx(idx);
                        setIsReviewPageOpen(false);
                      }}
                      className={`relative h-11 rounded-lg font-mono text-sm font-bold flex items-center justify-center transition cursor-pointer ${
                        isAns
                          ? 'bg-[#1d4ed8] text-white shadow-sm'
                          : bluebookLightMode
                          ? 'border-2 border-dashed border-slate-400 text-slate-800 hover:bg-slate-100'
                          : 'border-2 border-dashed border-slate-600 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {idx + 1}
                      {isFlag && (
                        <Bookmark className="w-3.5 h-3.5 text-red-500 fill-red-500 absolute -top-1.5 -right-1.5 bg-white rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* CỘT TRÁI: ĐOẠN VĂN / NGỮ LIỆU (PASSAGE PANE) */}
          <div
            ref={passageContainerRef}
            onMouseUp={handlePassageMouseUp}
            style={{ width: window.innerWidth >= 768 ? `${leftPaneWidth}%` : '100%' }}
            className={`h-1/2 md:h-full overflow-y-auto p-6 lg:p-12 select-text ${theme.bgPaneLeft}`}
          >
            <div className="max-w-xl mx-auto space-y-5">
              <div className="text-[16px] leading-[1.8] font-serif whitespace-pre-line">
                {renderHighlightedPassage(currentQ.passage || currentQ.prompt)}
              </div>

              {/* Danh sách Ghi chú (Annotations) học sinh đã tạo ở câu này */}
              {currentAnnotations.length > 0 && (
                <div
                  className={`mt-6 p-4 rounded-xl border space-y-2 ${
                    bluebookLightMode
                      ? 'bg-amber-50/70 border-amber-200 text-slate-800'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Highlights & Notes ({currentAnnotations.length})</span>
                    <span className="text-[11px] font-normal opacity-75">
                      Bấm vào chữ đã tô trên bài để xóa
                    </span>
                  </div>
                  {currentAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      className="text-xs flex items-start justify-between gap-2 pt-1.5 border-t border-black/10"
                    >
                      <div>
                        <span
                          style={{ backgroundColor: ann.hex }}
                          className="px-1.5 py-0.5 rounded text-slate-900 font-serif"
                        >
                          &ldquo;{ann.quote}&rdquo;
                        </span>
                        {ann.note && (
                          <p className="mt-1 font-semibold text-blue-700 dark:text-cyan-300">
                            📝 {ann.note}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAnnotation(ann.id)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* THANH KÉO CHIA CỘT CHUẨN BLUEBOOK (RESIZABLE DIVIDER) */}
          <div
            onMouseDown={() => setIsDraggingSplit(true)}
            className="hidden md:flex w-2 bg-slate-300 dark:bg-slate-700 hover:bg-blue-500 cursor-col-resize items-center justify-center shrink-0 transition-colors"
            title="Kéo sang trái/phải để thay đổi độ rộng 2 cột"
          >
            <div className="w-4 h-8 rounded bg-slate-500 text-white flex items-center justify-center shadow">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* CỘT PHẢI: CÂU HỎI & ĐÁP ÁN (QUESTION PANE) */}
          <div
            style={{
              width: window.innerWidth >= 768 ? `${100 - leftPaneWidth}%` : '100%',
            }}
            className={`h-1/2 md:h-full overflow-y-auto p-6 lg:p-12 ${theme.bgPaneRight}`}
          >
            <div className="max-w-xl mx-auto space-y-5">
              {/* THANH HEADER CÂU HỎI CHUẨN BLUEBOOK (Ô đen số câu + Mark for Review + Nút ABC) */}
              <div
                className={`flex items-center justify-between border-b-2 border-dashed pb-2 px-3 py-1.5 rounded-t-lg ${theme.bgQuestionBar}`}
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-sm">
                    {currentIdx + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setFlaggedMap((prev) => ({ ...prev, [qId]: !prev[qId] }))
                    }
                    className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        flaggedMap[qId]
                          ? 'text-red-600 fill-red-600'
                          : 'text-slate-500'
                      }`}
                    />
                    <span className={flaggedMap[qId] ? 'font-bold text-red-600' : ''}>
                      Mark for Review
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAiTutorOpen(true)}
                    className="px-2.5 py-1 rounded border border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Tutor</span>
                  </button>

                  {/* Nút bật/tắt công cụ gạch đáp án ABC chuẩn Bluebook */}
                  <button
                    type="button"
                    onClick={() => setShowEliminatorTool(!showEliminatorTool)}
                    className={`px-2 py-0.5 rounded border text-xs font-serif font-bold line-through cursor-pointer ${
                      showEliminatorTool
                        ? 'bg-slate-800 text-white border-slate-900'
                        : 'border-slate-400 text-slate-600'
                    }`}
                    title="Bật/tắt chế độ gạch loại trừ đáp án (Answer Eliminator)"
                  >
                    ABC
                  </button>
                </div>
              </div>

              {/* Nội dung câu hỏi (Question Stem) */}
              <div className="text-[16px] font-serif leading-relaxed pt-1 select-text">
                <MathRenderer text={currentQ.question} />
              </div>

              {/* 4 lựa chọn A, B, C, D chuẩn thiết kế Bluebook */}
              {optionEntries.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {optionEntries.map(([letter, text]) => {
                    const isSelected = selectedAnswer === letter;
                    const isEliminated = (eliminatedMap[qId] || []).includes(letter);
                    const isCorrectOpt =
                      String(letter).trim().toUpperCase() ===
                      String(currentQ.correctAnswer).trim().toUpperCase();

                    let boxClass = theme.optionDefault;
                    if (isSelected) {
                      boxClass = theme.optionSelected;
                    }
                    if (isChecked) {
                      if (isCorrectOpt) {
                        boxClass =
                          'border-2 border-emerald-600 bg-emerald-500/15 text-emerald-950 dark:text-white';
                      } else if (isSelected && !isCorrectOpt) {
                        boxClass =
                          'border-2 border-rose-600 bg-rose-500/15 text-rose-950 dark:text-white';
                      }
                    }

                    return (
                      <div
                        key={letter}
                         className="flex items-center gap-2.5"
                      >
                        <div
                          onClick={() => !isEliminated && handleSelectOption(letter)}
                          className={`relative flex-1 p-3.5 rounded-lg border flex items-center gap-3.5 transition cursor-pointer ${boxClass} ${
                            isEliminated ? 'opacity-45' : ''
                          }`}
                        >
                          {/* Đường kẻ ngang cắt qua toàn bộ ô khi người dùng bấm gạch loại trừ giống hệt Bluebook */}
                          {isEliminated && (
                            <div className="absolute inset-x-3 top-1/2 h-[2px] bg-slate-800 dark:bg-slate-200 pointer-events-none" />
                          )}

                          <span
                            className={`w-7 h-7 rounded-full border-2 text-xs font-bold flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#1d4ed8] text-white border-[#1d4ed8]'
                                : 'border-slate-600 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {letter}
                          </span>

                          <div className="text-[15px] font-serif leading-relaxed select-text">
                            <MathRenderer text={text} />
                          </div>
                        </div>

                        {/* Nút tròn gạch đáp án nằm bên ngoài cạnh phải giống Bluebook */}
                        {showEliminatorTool && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleEliminate(e, letter)}
                            className={`w-7 h-7 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0 transition cursor-pointer ${
                              isEliminated
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'border-slate-400 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 line-through'
                            }`}
                            title={
                              isEliminated
                                ? `Khôi phục đáp án ${letter}`
                                : `Loại trừ đáp án ${letter}`
                            }
                          >
                            {isEliminated ? 'Undo' : letter}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Giao diện nhập đáp án tự điền (Student-Produced Response / Grid-in) */
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider">
                    Student-Produced Response (Nhập số hoặc phân số):
                  </label>
                  <input
                    type="text"
                    value={selectedAnswer}
                    onChange={(e) =>
                      setUserAnswers((prev) => ({ ...prev, [qId]: e.target.value }))
                    }
                    placeholder="VD: 15/4, -3.5, 42..."
                    className="w-48 px-4 py-2.5 rounded-lg border-2 border-slate-500 font-mono text-base focus:outline-none focus:border-blue-600"
                  />
                  {selectedAnswer && (
                    <div className="text-xs font-semibold">
                      Answer Preview: <strong className="font-mono text-sm">{selectedAnswer}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Giải thích chi tiết khi bấm Check */}
              {isChecked && (
                <div
                  className={`p-5 rounded-xl border-2 space-y-2 ${
                    isCurrentCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-rose-500/10 border-rose-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase">
                    {isCurrentCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-300">
                          Chính xác! (Đã ghi nhận vào danh sách Đã làm)
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span className="text-rose-700 dark:text-rose-300">
                          Chưa chính xác • Đáp án đúng: {currentQ.correctAnswer}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-sm font-serif leading-relaxed pt-2 border-t border-slate-400/30">
                    <MathRenderer text={currentQ.explanation} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. FOOTER CHUẨN BLUEBOOK (TÊN THÍ SINH | QUESTION X OF Y | BACK/NEXT) */}
      {/* =================================================================== */}
      <footer
        className={`h-[64px] px-4 lg:px-8 border-t-2 border-dashed flex items-center justify-between shrink-0 relative ${theme.bgHeader}`}
      >
        {/* Góc trái: Tên học sinh giống Bluebook */}
        <div className="text-xs sm:text-sm font-bold truncate max-w-[200px]">
          Phan Tiến Thành
        </div>

        {/* Chính giữa: Nút đen "Question X of Y ^" mở bảng điều hướng Bluebook */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow cursor-pointer"
          >
            <span>
              {isReviewPageOpen
                ? 'Review Page'
                : `Question ${currentIdx + 1} of ${questions.length}`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                isPaletteOpen ? '' : 'rotate-180'
              }`}
            />
          </button>
        </div>

        {/* Góc phải: Nút Check (khi luyện đề) + Back / Next màu xanh đậm chuẩn Bluebook */}
        <div className="flex items-center gap-2.5">
          {!isReviewPageOpen && (
            <button
              type="button"
              disabled={!selectedAnswer}
              onClick={handleCheckCurrentAnswer}
              className="px-3.5 py-2 rounded-full border border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-40 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
              title="Kiểm tra đáp án câu này ngay và đánh dấu Đã làm"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Check</span>
            </button>
          )}

          <button
            type="button"
            disabled={currentIdx === 0 && !isReviewPageOpen}
            onClick={() => {
              if (isReviewPageOpen) {
                setIsReviewPageOpen(false);
              } else {
                setCurrentIdx((i) => Math.max(0, i - 1));
                setSelectionPopup(null);
              }
            }}
            className="px-5 py-2 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition shadow-sm"
          >
            Back
          </button>

          {isReviewPageOpen ? (
            <button
              type="button"
              onClick={handleSubmitExam}
              className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition shadow-md"
            >
              Submit & Score
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSelectionPopup(null);
                if (currentIdx < questions.length - 1) {
                  setCurrentIdx((i) => i + 1);
                } else {
                  setIsReviewPageOpen(true);
                }
              }}
              className="px-5 py-2 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold cursor-pointer transition shadow-sm"
            >
              Next
            </button>
          )}
        </div>
      </footer>

      {/* =================================================================== */}
      {/* 4. POPOVER BẢNG CHỌN CÂU HỎI CHUẨN BLUEBOOK (QUESTION PALETTE)      */}
      {/* =================================================================== */}
      {isPaletteOpen && (
        <div
          onClick={() => setIsPaletteOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center pb-[72px] px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 border-2 border-slate-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[75vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm">
                {activeCategory?.title || 'Section 1, Module 1: Reading and Writing'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPaletteOpen(false)}
                className="text-slate-500 hover:text-slate-900 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Chú thích ký hiệu giống hệt Bluebook */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-slate-700 border-b border-slate-200 pb-2.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-900" /> Current
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border border-dashed border-slate-500 inline-block" />{' '}
                Unanswered
              </span>
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-red-600 fill-red-600" /> For Review
              </span>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-9 gap-2.5 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const id = q.id || `q_${idx}`;
                const answered = Boolean(userAnswers[id]);
                const flagged = Boolean(flaggedMap[id]);
                const isCurr = idx === currentIdx && !isReviewPageOpen;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setCurrentIdx(idx);
                      setIsReviewPageOpen(false);
                      setIsPaletteOpen(false);
                    }}
                    className={`relative h-9 rounded font-mono text-xs font-bold flex items-center justify-center cursor-pointer transition ${
                      answered
                        ? 'bg-[#1d4ed8] text-white'
                        : 'border border-dashed border-slate-500 text-slate-900 hover:bg-slate-100'
                    } ${isCurr ? 'ring-2 ring-offset-2 ring-slate-900' : ''}`}
                  >
                    {isCurr && (
                      <MapPin className="w-3 h-3 absolute -top-2.5 text-slate-900 fill-slate-900" />
                    )}
                    {idx + 1}
                    {flagged && (
                      <Bookmark className="w-3 h-3 text-red-600 fill-red-600 absolute -top-1 -right-1 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setIsReviewPageOpen(true);
                  setIsPaletteOpen(false);
                }}
                className="px-5 py-2 rounded-full border-2 border-[#1d4ed8] text-[#1d4ed8] hover:bg-blue-50 text-xs font-bold transition cursor-pointer"
              >
                Go to Review Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Các Modal công cụ */}
      <DesmosModal isOpen={isDesmosOpen} onClose={() => setIsDesmosOpen(false)} />
      <ReferenceModal isOpen={isReferenceOpen} onClose={() => setIsReferenceOpen(false)} />
      <AiTutorModal
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
        question={currentQ}
      />
      <ScoreReportModal
        isOpen={Boolean(scoreReport)}
        reportData={scoreReport}
        onClose={() => setScoreReport(null)}
        onHome={onExit}
        onRetry={() => {
          setScoreReport(null);
          setIsReviewPageOpen(false);
          setCurrentIdx(0);
          setUserAnswers({});
          setCheckedMap({});
        }}
      />
    </div>
  );
}