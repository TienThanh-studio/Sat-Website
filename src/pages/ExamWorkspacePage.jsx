// src/pages/ExamWorkspacePage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  GripVertical,
  MessageSquarePlus,
  Coffee,
  FastForward,
  Calendar,
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import ScoreReportModal from '../components/exam/ScoreReportModal';
import AiTutorModal from '../components/exam/AiTutorModal';
import { questionService } from '../services/questionService';
import { storageService } from '../services/storageService';
import * as satIrtScoring from '../services/satIrtScoring';

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Vàng', hex: '#fef08a' },
  { id: 'blue', label: 'Xanh', hex: '#bae6fd' },
  { id: 'pink', label: 'Hồng', hex: '#fbcfe8' },
];

export default function ExamWorkspacePage({
  config,
  activeCategory,
  examConfig,
  onExit,
  onFinishExam,
  onComplete,
}) {
  const resolvedSource = useMemo(() => {
    const direct = config || activeCategory || examConfig;
    if (
      direct &&
      Array.isArray(direct.questions) &&
      direct.questions.length > 0
    ) {
      return direct;
    }

    try {
      const savedRaw = sessionStorage.getItem('sat_active_exam_payload');
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (
          parsed &&
          Array.isArray(parsed.questions) &&
          parsed.questions.length > 0
        ) {
          if (
            !direct?.id ||
            direct.id === parsed.id ||
            direct.categoryId === parsed.id
          ) {
            return parsed;
          }
        }
      }
    } catch {
      // ignore
    }

    const targetId =
      direct?.id ||
      direct?.categoryId ||
      direct?.testId ||
      direct?.skill ||
      direct?.title;
    if (targetId) {
      const foundCat = questionService.getCategoryById(targetId);
      if (
        foundCat &&
        Array.isArray(foundCat.questions) &&
        foundCat.questions.length > 0
      ) {
        return foundCat;
      }
    }

    return questionService.getCategories()[0];
  }, [config, activeCategory, examConfig]);

  const isMultiModuleExam = Boolean(
    resolvedSource?.isFull4ModuleExam &&
      Array.isArray(resolvedSource?.modules) &&
      resolvedSource.modules.length > 0
  );
  const examModules = isMultiModuleExam ? resolvedSource.modules : null;

  const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
  const [isBreakScreenOpen, setIsBreakScreenOpen] = useState(false);
  const [breakRemainingSeconds, setBreakRemainingSeconds] = useState(600);

  const activeModuleObj = isMultiModuleExam
    ? examModules[currentModuleIdx] || examModules[0]
    : null;

  const initialQuestions = useMemo(() => {
    const rawList =
      isMultiModuleExam && activeModuleObj
        ? activeModuleObj.questions || []
        : resolvedSource?.questions || [];

    // Đảm bảo mọi câu hỏi (kể cả khi đọc lại từ sessionStorage) đều được gạch chân từ cần hỏi và chuẩn hóa NFC
    return rawList.map((q, idx) =>
      questionService.normalizeQuestionItem
        ? questionService.normalizeQuestionItem(
            q,
            q?.domain || resolvedSource?.domain || 'Reading & Writing',
            q?.skill || resolvedSource?.skill || 'Words in Context',
            idx,
            q?.section || resolvedSource?.section || 'Reading & Writing'
          )
        : q
    );
  }, [isMultiModuleExam, activeModuleObj, resolvedSource]);

  const [inAppFilter, setInAppFilter] = useState('all');
  const [completedSet, setCompletedSet] = useState(() =>
    storageService.getCompletedSet()
  );

  const questions = useMemo(() => {
    if (!isMultiModuleExam && inAppFilter === 'unanswered') {
      const remaining = initialQuestions.filter(
        (q) => !completedSet.has(String(q.id))
      );
      return remaining.length > 0 ? remaining : initialQuestions;
    }
    return initialQuestions;
  }, [initialQuestions, inAppFilter, completedSet, isMultiModuleExam]);

  const [bluebookLightMode, setBluebookLightMode] = useState(true);
  const [leftPaneWidth, setLeftPaneWidth] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isReviewPageOpen, setIsReviewPageOpen] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showEliminatorTool, setShowEliminatorTool] = useState(true);

  const [userAnswers, setUserAnswers] = useState({});
  const [checkedMap, setCheckedMap] = useState({});
  const [flaggedMap, setFlaggedMap] = useState({});
  const [eliminatedMap, setEliminatedMap] = useState({});
  const [annotationsMap, setAnnotationsMap] = useState({});
  const [selectionPopup, setSelectionPopup] = useState(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [moduleRemainingSeconds, setModuleRemainingSeconds] = useState(
    activeModuleObj?.durationSeconds || 32 * 60
  );
  const [showTimer, setShowTimer] = useState(true);

  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [scoreReport, setScoreReport] = useState(null);

  const questionTimesRef = useRef({});
  const passageContainerRef = useRef(null);

  useEffect(() => {
    setCurrentModuleIdx(0);
    setIsBreakScreenOpen(false);
    setCurrentIdx(0);
    setUserAnswers({});
    setCheckedMap({});
    setFlaggedMap({});
    setEliminatedMap({});
    setAnnotationsMap({});
    setIsReviewPageOpen(false);
    setElapsedSeconds(0);
    if (resolvedSource?.modules?.[0]?.durationSeconds) {
      setModuleRemainingSeconds(resolvedSource.modules[0].durationSeconds);
    }
  }, [resolvedSource]);

  useEffect(() => {
    if (scoreReport) return;

    const timer = setInterval(() => {
      if (isBreakScreenOpen) {
        setBreakRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsBreakScreenOpen(false);
            const nextModIdx = currentModuleIdx + 1;
            setCurrentModuleIdx(nextModIdx);
            setCurrentIdx(0);
            setIsReviewPageOpen(false);
            setModuleRemainingSeconds(
              examModules?.[nextModIdx]?.durationSeconds || 35 * 60
            );
            return 0;
          }
          return prev - 1;
        });
        return;
      }

      setElapsedSeconds((prev) => prev + 1);
      if (!isReviewPageOpen) {
        const qKey = currentQ?.id || `m${currentModuleIdx}_q${currentIdx}`;
        questionTimesRef.current[qKey] =
          (questionTimesRef.current[qKey] || 0) + 1;
      }

      if (isMultiModuleExam) {
        setModuleRemainingSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  });

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
    if (activeModuleObj) {
      return String(activeModuleObj.section).toLowerCase().includes('math');
    }
    const secStr = String(
      currentQ?.section ||
        resolvedSource?.section ||
        currentQ?.domain ||
        resolvedSource?.title ||
        ''
    ).toLowerCase();
    return (
      secStr.includes('math') ||
      secStr.includes('algebra') ||
      secStr.includes('geometry') ||
      secStr.includes('data')
    );
  }, [currentQ, resolvedSource, activeModuleObj]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        scoreReport ||
        isBreakScreenOpen ||
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
  }, [
    currentIdx,
    questions.length,
    scoreReport,
    isBreakScreenOpen,
    isReviewPageOpen,
    qId,
    eliminatedMap,
  ]);

  const handleExitWorkspace = () => {
    if (typeof onExit === 'function') onExit();
    else if (typeof onFinishExam === 'function') onFinishExam(null);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="p-12 text-center text-slate-300 space-y-4">
        <p className="text-lg font-bold">
          Không tìm thấy câu hỏi nào trong bộ đề này.
        </p>
        <button
          type="button"
          onClick={handleExitWorkspace}
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

      if (!isRemoving && userAnswers[qId] === letter) {
        setUserAnswers((uPrev) => ({ ...uPrev, [qId]: '' }));
      }
      return { ...prev, [qId]: nextList };
    });
  };

  const handlePassageMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
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

  const handleAdvanceNextModule = () => {
    if (!isMultiModuleExam || !examModules) {
      handleSubmitExam();
      return;
    }

    if (currentModuleIdx >= examModules.length - 1) {
      handleSubmitExam();
      return;
    }

    const currentMod = examModules[currentModuleIdx];
    if (currentMod?.breakAfterSeconds) {
      setBreakRemainingSeconds(currentMod.breakAfterSeconds);
      setIsReviewPageOpen(false);
      setIsBreakScreenOpen(true);
      return;
    }

    const nextIdx = currentModuleIdx + 1;
    setCurrentModuleIdx(nextIdx);
    setCurrentIdx(0);
    setIsReviewPageOpen(false);
    setModuleRemainingSeconds(
      examModules[nextIdx]?.durationSeconds || 32 * 60
    );
  };

  const handleSkipBreakAndResume = () => {
    if (!examModules) return;
    setIsBreakScreenOpen(false);
    const nextIdx = currentModuleIdx + 1;
    setCurrentModuleIdx(nextIdx);
    setCurrentIdx(0);
    setIsReviewPageOpen(false);
    setModuleRemainingSeconds(
      examModules[nextIdx]?.durationSeconds || 35 * 60
    );
  };

  const handleSubmitExam = () => {
    const allExamQuestions = isMultiModuleExam
      ? examModules.flatMap((m) => m.questions || [])
      : questions;

    const detailedQuestions = allExamQuestions.map((q, idx) => {
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

    let scaledScore =
      200 + Math.round((correctCount / Math.max(1, totalCount)) * 600);

    if (isMultiModuleExam) {
      const rwQs = detailedQuestions.filter((q) =>
        String(q.section).toLowerCase().includes('read')
      );
      const mathQs = detailedQuestions.filter((q) =>
        String(q.section).toLowerCase().includes('math')
      );
      const rwCorrect = rwQs.filter((q) => q.isCorrect).length;
      const mathCorrect = mathQs.filter((q) => q.isCorrect).length;

      const rwScore =
        Math.round(
          (200 + (rwCorrect / Math.max(1, rwQs.length)) * 600) / 10
        ) * 10;
      const mathScore =
        Math.round(
          (200 + (mathCorrect / Math.max(1, mathQs.length)) * 600) / 10
        ) * 10;
      scaledScore = rwScore + mathScore;
    } else {
      try {
        const scoreFn =
          satIrtScoring.calculateIrtScore ||
          satIrtScoring.calculateSATScore ||
          satIrtScoring.calculateSectionScore ||
          satIrtScoring.default?.calculateIrtScore ||
          satIrtScoring.default;
        if (typeof scoreFn === 'function') {
          const irt = scoreFn(detailedQuestions);
          const val =
            typeof irt === 'number' ? irt : irt?.scaledScore || irt?.score;
          if (Number(val) >= 200) scaledScore = Number(val);
        }
      } catch {
        // Fallback scale
      }
    }

    const report = {
      id: `rep_${Date.now()}`,
      section: resolvedSource?.title || 'Digital SAT Practice',
      scaledScore,
      totalQuestions: totalCount,
      correctCount,
      timeSpent: elapsedSeconds,
      module2Path:
        scaledScore >= (isMultiModuleExam ? 1250 : 600) ? 'Hard' : 'Standard',
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

  // Render đoạn văn hỗ trợ cả thẻ gạch chân <u> lẫn Highlight của người dùng
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

    if (
      !rawPassage.includes('$') &&
      !rawPassage.includes('\\(') &&
      !rawPassage.includes('<u')
    ) {
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
                title={
                  p.highlight.note
                    ? `Ghi chú: ${p.highlight.note}`
                    : 'Bấm để xóa highlight'
                }
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

  // Không dùng prefix dark: của Tailwind vì thẻ html gốc luôn có class dark; điều khiển trực tiếp qua biến bluebookLightMode
  const theme = bluebookLightMode
    ? {
        bgMain: 'bg-white text-slate-900',
        bgHeader: 'bg-white border-slate-300 text-slate-900',
        bgPaneLeft: 'bg-white text-slate-900',
        bgPaneRight: 'bg-white text-slate-900',
        bgQuestionBar: 'bg-[#f0f2f5] border-slate-300 text-slate-900',
        optionDefault:
          'border-slate-400 bg-white text-slate-900 hover:bg-slate-50',
        optionSelected:
          'border-[2.5px] border-[#1d4ed8] bg-[#eff6ff] text-slate-950 font-semibold',
        optionCorrect:
          'border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold',
        optionWrong:
          'border-2 border-rose-600 bg-rose-50 text-rose-950',
        letterCircleDefault: 'border-slate-600 text-slate-800',
        textMuted: 'text-slate-600',
        btnTool: 'hover:bg-slate-100 text-slate-800 border-transparent',
      }
    : {
        bgMain: 'bg-[#080C17] text-slate-100',
        bgHeader: 'bg-[#0B1020] border-slate-700 text-slate-100',
        bgPaneLeft: 'bg-[#080C17] text-slate-100',
        bgPaneRight: 'bg-[#0A1020] text-slate-100',
        bgQuestionBar: 'bg-slate-900 border-slate-700 text-slate-100',
        optionDefault:
          'border-slate-700 bg-slate-900/80 text-slate-100 hover:border-slate-500',
        optionSelected:
          'border-[2.5px] border-cyan-400 bg-cyan-500/15 text-white font-semibold',
        optionCorrect:
          'border-2 border-emerald-500 bg-emerald-950/60 text-emerald-100 font-semibold',
        optionWrong:
          'border-2 border-rose-500 bg-rose-950/60 text-rose-100',
        letterCircleDefault: 'border-slate-400 text-slate-200',
        textMuted: 'text-slate-400',
        btnTool: 'hover:bg-slate-800 text-slate-200 border-white/10',
      };

  if (isBreakScreenOpen) {
    const breakUI = (
      <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#111827] text-white flex flex-col justify-between p-6 lg:p-12 select-none font-sans">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Coffee className="w-5 h-5" />
            <span>College Board Bluebook • Scheduled Break</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Completed: Section 1 (Reading & Writing) • Up Next: Section 2 (Math)
          </span>
        </div>

        <div className="max-w-3xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center my-auto">
          <div className="bg-slate-900 border-2 border-white/15 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Remaining Break Time
            </div>
            <div className="text-6xl font-black font-mono text-amber-400 tracking-wider">
              {formatTimer(breakRemainingSeconds)}
            </div>
            <button
              type="button"
              onClick={handleSkipBreakAndResume}
              className="w-full py-3.5 px-6 rounded-full bg-[#1d4ed8] hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition"
            >
              <FastForward className="w-4 h-4" />
              <span>Resume Testing Now (Vào thi Toán ngay)</span>
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold text-white">
              Practice Test Break (10 Minutes)
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              You have completed <strong>Section 1: Reading and Writing</strong>.
              On test day, you get a 10-minute break before starting{' '}
              <strong>Section 2: Math</strong>.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-white">Phan Tiến Thành</span>
          <span>
            Module 3 of 4 (Math Module 1) will begin automatically when timer
            ends.
          </span>
        </div>
      </div>
    );

    return typeof document !== 'undefined'
      ? createPortal(breakUI, document.body)
      : breakUI;
  }

  const diffBadgeColor =
    String(currentQ.difficulty || '').toLowerCase() === 'hard'
      ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
      : String(currentQ.difficulty || '').toLowerCase() === 'easy'
      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
      : 'bg-amber-500/15 text-amber-700 border-amber-500/30';

  const workspaceUI = (
    <div
      className={`fixed inset-0 z-[9999] w-screen h-screen flex flex-col select-none overflow-hidden font-sans ${theme.bgMain}`}
    >
      {/* 1. HEADER CHUẨN BLUEBOOK */}
      <header
        className={`h-[60px] px-4 lg:px-8 border-b-2 border-dashed flex items-center justify-between shrink-0 relative ${theme.bgHeader}`}
      >
        <div className="flex flex-col justify-center min-w-0 max-w-[38%]">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight truncate">
              {activeModuleObj
                ? activeModuleObj.title
                : resolvedSource?.title ||
                  (isMathSection
                    ? 'Section 2, Module 1: Math'
                    : 'Section 1, Module 1: Reading and Writing')}
            </h1>
            {isMultiModuleExam && (
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold shrink-0">
                Module {currentModuleIdx + 1}/4
              </span>
            )}
            {!isMultiModuleExam && isAlreadyCompletedBefore && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 shrink-0">
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

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          {showTimer ? (
            <div
              className={`text-base sm:text-lg font-bold font-mono tracking-wider leading-none ${
                isMultiModuleExam && moduleRemainingSeconds < 300
                  ? 'text-red-600 animate-pulse'
                  : ''
              }`}
            >
              {formatTimer(
                isMultiModuleExam ? moduleRemainingSeconds : elapsedSeconds
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs font-semibold py-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Hidden</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowTimer(!showTimer)}
            className="mt-0.5 px-2.5 py-0.5 rounded-full border border-slate-400 text-[10px] font-bold hover:bg-slate-200/50 transition cursor-pointer"
          >
            {showTimer ? 'Hide' : 'Show'}
          </button>
        </div>

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
              className={`px-2 py-1 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-semibold transition cursor-pointer ${theme.btnTool}`}
            >
              <Highlighter className="w-4 h-4" />
              <span className="hidden lg:inline">Highlights & Notes</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDesmosOpen(true)}
            className={`px-2 py-1 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-semibold transition cursor-pointer ${theme.btnTool}`}
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden lg:inline">Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReferenceOpen(true)}
            className={`px-2 py-1 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-semibold transition cursor-pointer ${theme.btnTool}`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden lg:inline">Reference</span>
          </button>

          {!isMultiModuleExam && (
            <button
              type="button"
              onClick={() =>
                setInAppFilter((prev) =>
                  prev === 'unanswered' ? 'all' : 'unanswered'
                )
              }
              className={`px-2 py-1 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-semibold transition cursor-pointer ${
                inAppFilter === 'unanswered'
                  ? 'bg-blue-600 text-white'
                  : theme.btnTool
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span className="hidden xl:inline">
                {inAppFilter === 'unanswered' ? 'Chưa làm' : 'Lọc câu'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setBluebookLightMode(!bluebookLightMode)}
            className={`p-2 rounded-lg border transition cursor-pointer ${theme.btnTool}`}
          >
            {bluebookLightMode ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={handleExitWorkspace}
            className="ml-1 px-3 py-1.5 rounded-lg border border-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-xs font-bold transition cursor-pointer"
          >
            Save & Exit
          </button>
        </div>
      </header>

      {showDirections && (
        <div className="fixed inset-x-0 top-[60px] z-50 mx-auto max-w-3xl bg-white text-slate-900 border-2 border-slate-800 rounded-b-xl shadow-2xl p-6 space-y-4">
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
        </div>
      )}

      {selectionPopup && (
        <div
          style={{ left: selectionPopup.x, top: selectionPopup.y }}
          className="fixed z-50 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 px-3 py-1.5 flex items-center gap-2"
        >
          <span className="text-[11px] font-bold text-slate-300 mr-1">
            Highlight:
          </span>
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleAddAnnotation(c, false)}
              style={{ backgroundColor: c.hex }}
              className="w-5 h-5 rounded-full border border-white/40 hover:scale-110 transition cursor-pointer"
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

      {/* 2. VÙNG NỘI DUNG CHÍNH */}
      {isReviewPageOpen ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-10 flex flex-col items-center">
          <div className="max-w-3xl w-full space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold">Check Your Work</h2>
              <p className={`text-sm ${theme.textMuted}`}>
                {isMultiModuleExam && currentModuleIdx < examModules.length - 1
                  ? 'Once you move to the next module, you will NOT be able to return to these questions.'
                  : 'Review your answers before submitting the exam for final scoring.'}
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
                  {activeModuleObj
                    ? activeModuleObj.title
                    : resolvedSource?.title || 'Section 1: Reading and Writing'}
                </span>
                <div className="flex items-center gap-5 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 border border-dashed border-slate-500 inline-block rounded-sm" />
                    Unanswered (
                    {
                      questions.filter(
                        (q, idx) => !userAnswers[q.id || `q_${idx}`]
                      ).length
                    }
                    )
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-red-600 fill-red-600" />
                    For Review (
                    {
                      questions.filter(
                        (q, idx) => flaggedMap[q.id || `q_${idx}`]
                      ).length
                    }
                    )
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
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
          {/* CỘT TRÁI: PASSAGE */}
          <div
            ref={passageContainerRef}
            onMouseUp={handlePassageMouseUp}
            style={{
              width: window.innerWidth >= 768 ? `${leftPaneWidth}%` : '100%',
            }}
            className={`h-1/2 md:h-full overflow-y-auto p-6 lg:p-10 select-text ${theme.bgPaneLeft}`}
          >
            <div className="max-w-xl mx-auto space-y-5">
              <div className="text-[16px] leading-[1.8] font-serif whitespace-pre-line">
                {renderHighlightedPassage(currentQ.passage || currentQ.prompt)}
              </div>

              {currentAnnotations.length > 0 && (
                <div
                  className={`mt-6 p-4 rounded-xl border space-y-2 ${
                    bluebookLightMode
                      ? 'bg-amber-50/70 border-amber-200 text-slate-800'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>
                      Highlights & Notes ({currentAnnotations.length})
                    </span>
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
                          <p className="mt-1 font-semibold text-blue-700">
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

          <div
            onMouseDown={() => setIsDraggingSplit(true)}
            className="hidden md:flex w-2 bg-slate-300 hover:bg-blue-500 cursor-col-resize items-center justify-center shrink-0 transition-colors"
          >
            <div className="w-4 h-8 rounded bg-slate-500 text-white flex items-center justify-center shadow">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* CỘT PHẢI: QUESTION & OPTIONS */}
          <div
            style={{
              width:
                window.innerWidth >= 768 ? `${100 - leftPaneWidth}%` : '100%',
            }}
            className={`h-1/2 md:h-full overflow-y-auto p-6 lg:p-10 ${theme.bgPaneRight}`}
          >
            <div className="max-w-xl mx-auto space-y-4">
              {/* THANH HEADER CÂU HỎI KÈM METADATA ĐỢT THI (testDate) & ĐỘ KHÓ (difficulty) */}
              <div
                className={`flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed pb-2 px-3 py-1.5 rounded-t-lg ${theme.bgQuestionBar}`}
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-sm">
                    {currentIdx + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setFlaggedMap((prev) => ({
                        ...prev,
                        [qId]: !prev[qId],
                      }))
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
                    <span
                      className={
                        flaggedMap[qId] ? 'font-bold text-red-600' : ''
                      }
                    >
                      Mark for Review
                    </span>
                  </button>

                  {/* Hiển thị Đợt thi thật (testDate) nếu có */}
                  {currentQ.testDate && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-700 text-[11px] font-mono font-bold">
                      <Calendar className="w-3 h-3" />
                      <span>Đề thi: {currentQ.testDate}</span>
                    </span>
                  )}

                  {/* Hiển thị Cấp độ câu hỏi (Difficulty) */}
                  {currentQ.difficulty && (
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-extrabold uppercase ${diffBadgeColor}`}
                    >
                      {currentQ.difficulty}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAiTutorOpen(true)}
                    className="px-2.5 py-1 rounded border border-indigo-500/40 bg-indigo-500/10 text-indigo-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Tutor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEliminatorTool(!showEliminatorTool)}
                    className={`px-2 py-0.5 rounded border text-xs font-serif font-bold line-through cursor-pointer ${
                      showEliminatorTool
                        ? 'bg-slate-800 text-white border-slate-900'
                        : 'border-slate-400 text-slate-600'
                    }`}
                  >
                    ABC
                  </button>
                </div>
              </div>

              {/* Nội dung câu hỏi (Question Stem) */}
              <div className="text-[16px] font-serif leading-relaxed pt-1 select-text">
                <MathRenderer text={currentQ.question} />
              </div>

              {/* 4 Đáp án A, B, C, D */}
              {optionEntries.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {optionEntries.map(([letter, text]) => {
                    const isSelected = selectedAnswer === letter;
                    const isEliminated = (eliminatedMap[qId] || []).includes(
                      letter
                    );
                    const isCorrectOpt =
                      String(letter).trim().toUpperCase() ===
                      String(currentQ.correctAnswer).trim().toUpperCase();

                    let boxClass = theme.optionDefault;
                    if (isSelected) {
                      boxClass = theme.optionSelected;
                    }
                    if (isChecked) {
                      if (isCorrectOpt) {
                        boxClass = theme.optionCorrect;
                      } else if (isSelected && !isCorrectOpt) {
                        boxClass = theme.optionWrong;
                      }
                    }

                    return (
                      <div key={letter} className="flex items-center gap-2.5">
                        <div
                          onClick={() =>
                            !isEliminated && handleSelectOption(letter)
                          }
                          className={`relative flex-1 p-3 rounded-lg border flex items-center gap-3.5 transition cursor-pointer ${boxClass} ${
                            isEliminated ? 'opacity-45' : ''
                          }`}
                        >
                          {isEliminated && (
                            <div className="absolute inset-x-3 top-1/2 h-[2px] bg-slate-800 pointer-events-none" />
                          )}

                          <span
                            className={`w-7 h-7 rounded-full border-2 text-xs font-bold flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#1d4ed8] text-white border-[#1d4ed8]'
                                : theme.letterCircleDefault
                            }`}
                          >
                            {letter}
                          </span>

                          <div className="text-[15px] font-serif leading-relaxed select-text">
                            <MathRenderer text={text} />
                          </div>
                        </div>

                        {showEliminatorTool && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleEliminate(e, letter)}
                            className={`w-7 h-7 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0 transition cursor-pointer ${
                              isEliminated
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'border-slate-400 text-slate-600 hover:bg-slate-200 line-through'
                            }`}
                          >
                            {isEliminated ? 'Undo' : letter}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider">
                    Student-Produced Response (Nhập số hoặc phân số):
                  </label>
                  <input
                    type="text"
                    value={selectedAnswer}
                    onChange={(e) =>
                      setUserAnswers((prev) => ({
                        ...prev,
                        [qId]: e.target.value,
                      }))
                    }
                    placeholder="VD: 15/4, -3.5, 42..."
                    className="w-48 px-4 py-2.5 rounded-lg border-2 border-slate-500 font-mono text-base focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              {/* Hộp giải thích dùng font-sans rõ nét cho tiếng Việt */}
              {isChecked && (
                <div
                  className={`p-4 rounded-xl border-2 space-y-2 ${
                    isCurrentCorrect
                      ? bluebookLightMode
                        ? 'bg-emerald-50 border-emerald-500 text-slate-900'
                        : 'bg-emerald-950/50 border-emerald-500/60 text-slate-100'
                      : bluebookLightMode
                      ? 'bg-rose-50 border-rose-500 text-slate-900'
                      : 'bg-rose-950/50 border-rose-500/60 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase">
                    {isCurrentCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">
                          Chính xác! (Đã ghi nhận vào danh sách Đã làm)
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span className="text-rose-700">
                          Chưa chính xác • Đáp án đúng:{' '}
                          {currentQ.correctAnswer}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-sm font-sans leading-relaxed pt-2 border-t border-slate-400/30">
                    <MathRenderer text={currentQ.explanation} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. FOOTER CHUẨN BLUEBOOK */}
      <footer
        className={`h-[58px] px-4 lg:px-8 border-t-2 border-dashed flex items-center justify-between shrink-0 relative ${theme.bgHeader}`}
      >
        <div className="text-xs sm:text-sm font-bold truncate max-w-[200px]">
          Phan Tiến Thành
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow cursor-pointer"
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

        <div className="flex items-center gap-2">
          {!isReviewPageOpen && !isMultiModuleExam && (
            <button
              type="button"
              disabled={!selectedAnswer}
              onClick={handleCheckCurrentAnswer}
              className="px-3.5 py-1.5 rounded-full border border-emerald-600 text-emerald-700 hover:bg-emerald-500/15 disabled:opacity-40 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
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
            className="px-5 py-1.5 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition shadow-sm"
          >
            Back
          </button>

          {isReviewPageOpen ? (
            <button
              type="button"
              onClick={
                isMultiModuleExam && currentModuleIdx < examModules.length - 1
                  ? handleAdvanceNextModule
                  : handleSubmitExam
              }
              className="px-5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition shadow-md"
            >
              {isMultiModuleExam && currentModuleIdx < examModules.length - 1
                ? examModules[currentModuleIdx]?.breakAfterSeconds
                  ? 'Finish Section 1 & Start 10m Break →'
                  : `Next Module (Module ${currentModuleIdx + 2}/4) →`
                : 'Submit & Score'}
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
              className="px-5 py-1.5 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold cursor-pointer transition shadow-sm"
            >
              Next
            </button>
          )}
        </div>
      </footer>

      {isPaletteOpen && (
        <div
          onClick={() => setIsPaletteOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center pb-[66px] px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 border-2 border-slate-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[75vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm">
                {activeModuleObj
                  ? activeModuleObj.title
                  : resolvedSource?.title ||
                    'Section 1, Module 1: Reading and Writing'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPaletteOpen(false)}
                className="text-slate-500 hover:text-slate-900 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-slate-700 border-b border-slate-200 pb-2.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-900" /> Current
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border border-dashed border-slate-500 inline-block" />{' '}
                Unanswered
              </span>
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-red-600 fill-red-600" />{' '}
                For Review
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

      <DesmosModal
        isOpen={isDesmosOpen}
        onClose={() => setIsDesmosOpen(false)}
      />
      <ReferenceModal
        isOpen={isReferenceOpen}
        onClose={() => setIsReferenceOpen(false)}
      />
      <AiTutorModal
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
        question={currentQ}
      />
      <ScoreReportModal
        isOpen={Boolean(scoreReport)}
        reportData={scoreReport}
        onClose={() => setScoreReport(null)}
        onHome={handleExitWorkspace}
        onRetry={() => {
          setScoreReport(null);
          setCurrentModuleIdx(0);
          setIsBreakScreenOpen(false);
          setIsReviewPageOpen(false);
          setCurrentIdx(0);
          setUserAnswers({});
          setCheckedMap({});
        }}
      />
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(workspaceUI, document.body);
  }
  return workspaceUI;
}