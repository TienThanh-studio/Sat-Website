import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import ScoreReportModal from '../components/exam/ScoreReportModal';
import MatrixModal from '../components/exam/MatrixModal';
import { usePacingTracker } from '../hooks/usePacingTracker';
import { 
  normalizeSprAnswer, 
  isAnswerCorrect, 
  routeNextModule 
} from '../services/adaptiveEngine';
import { calculateSatSectionScore } from '../services/satIrtScoring';

// Dữ liệu dự phòng Test 8 Module 2 khi làm đề đơn
import test8Rw2 from '../data/questions/tests/sat_test_8_rw2.json';
import test8Math2 from '../data/questions/tests/sat_test_8_math2.json';

// Component tự động dựng biểu đồ cột SVG cho các câu hỏi Verbal đề cập tới biểu đồ
function VerbalChartRenderer({ question }) {
  if (!question) return null;

  // 1. Nếu có file ảnh biểu đồ đính kèm
  const imgSource = question.image || question.imageUrl || question.chart || question.graph;
  if (imgSource) {
    return (
      <div className="my-5 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <img 
          src={imgSource} 
          alt="Question Diagram" 
          className="max-h-72 max-w-full object-contain rounded-lg"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {question.imageCaption && (
          <span className="text-[11px] text-slate-500 mt-2 font-medium italic text-center">
            {question.imageCaption}
          </span>
        )}
      </div>
    );
  }

  const promptText = (question.prompt || question.passage || question.content || '').toLowerCase();

  // Biểu đồ cho câu Tax Penalties (Form 4720)
  if (promptText.includes('form 4720') || promptText.includes('private foundations')) {
    return (
      <div className="my-5 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs font-sans">
        <div className="text-center font-bold text-xs text-slate-800 mb-3 leading-snug">
          Tax Penalties Assessed on Private Foundations That Filed Form 4720, by Reason, 2003–2005
        </div>
        <div className="flex justify-center items-center gap-4 text-[11px] font-semibold mb-3">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-500 rounded-xs"></span> 2003</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-300 rounded-xs"></span> 2004</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-900 rounded-xs"></span> 2005</div>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 460 210" className="w-full max-w-lg mx-auto text-[10px] font-sans">
            {/* Trục Y và đường lưới */}
            <line x1="45" y1="20" x2="45" y2="160" stroke="#94a3b8" strokeWidth="1.2" />
            <line x1="45" y1="160" x2="440" y2="160" stroke="#94a3b8" strokeWidth="1.2" />
            {[0, 20, 40, 60, 80].map((val) => {
              const y = 160 - (val / 80) * 140;
              return (
                <g key={val}>
                  <line x1="45" y1={y} x2="440" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x="38" y={y + 3} textAnchor="end" fill="#64748b">{val}</text>
                </g>
              );
            })}
            {/* Nhóm 1: Self-dealing (2003: 10%, 2004: 6%, 2005: 40%) */}
            <rect x="75" y={160 - (10/80)*140} width="16" height={(10/80)*140} fill="#64748b" rx="1" />
            <rect x="93" y={160 - (6/80)*140} width="16" height={(6/80)*140} fill="#cbd5e1" rx="1" />
            <rect x="111" y={160 - (40/80)*140} width="16" height={(40/80)*140} fill="#0f172a" rx="1" />
            <text x="101" y="175" textAnchor="middle" fill="#334155" fontWeight="600">self-dealing</text>

            {/* Nhóm 2: Undistributed income (2003: 79%, 2004: 77%, 2005: 55%) */}
            <rect x="165" y={160 - (79/80)*140} width="16" height={(79/80)*140} fill="#64748b" rx="1" />
            <rect x="183" y={160 - (77/80)*140} width="16" height={(77/80)*140} fill="#cbd5e1" rx="1" />
            <rect x="201" y={160 - (55/80)*140} width="16" height={(55/80)*140} fill="#0f172a" rx="1" />
            <text x="191" y="175" textAnchor="middle" fill="#334155" fontWeight="600">undistributed income</text>

            {/* Nhóm 3: Taxable expenditures (2003: 7%, 2004: 14%, 2005: 4%) */}
            <rect x="255" y={160 - (7/80)*140} width="16" height={(7/80)*140} fill="#64748b" rx="1" />
            <rect x="273" y={160 - (14/80)*140} width="16" height={(14/80)*140} fill="#cbd5e1" rx="1" />
            <rect x="291" y={160 - (4/80)*140} width="16" height={(4/80)*140} fill="#0f172a" rx="1" />
            <text x="281" y="175" textAnchor="middle" fill="#334155" fontWeight="600">taxable expenditures</text>

            {/* Nhóm 4: Excess business holdings (2003: 3%, 2004: 4%, 2005: 1%) */}
            <rect x="345" y={160 - (3/80)*140} width="16" height={(3/80)*140} fill="#64748b" rx="1" />
            <rect x="363" y={160 - (4/80)*140} width="16" height={(4/80)*140} fill="#cbd5e1" rx="1" />
            <rect x="381" y={160 - (1/80)*140} width="16" height={(1/80)*140} fill="#0f172a" rx="1" />
            <text x="371" y="175" textAnchor="middle" fill="#334155" fontWeight="600">excess business holdings</text>
            <text x="15" y="90" textAnchor="middle" transform="rotate(-90, 15, 90)" fill="#64748b" fontWeight="500">Percentage of total penalty</text>
          </svg>
        </div>
      </div>
    );
  }

  // Biểu đồ cho câu Núi lửa Tanzania / Ethiopia
  if (promptText.includes('volcanoes') || promptText.includes('tanzania')) {
    return (
      <div className="my-5 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs font-sans">
        <div className="text-center font-bold text-xs text-slate-800 mb-3 leading-snug">
          Volcanoes Active since 1800 and since 1960 in Two Countries
        </div>
        <div className="flex justify-center items-center gap-4 text-[11px] font-semibold mb-3">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-700 rounded-xs"></span> Tanzania</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-300 rounded-xs"></span> Ethiopia</div>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 340 190" className="w-full max-w-sm mx-auto text-[10px] font-sans">
            <line x1="40" y1="20" x2="40" y2="150" stroke="#94a3b8" strokeWidth="1.2" />
            <line x1="40" y1="150" x2="320" y2="150" stroke="#94a3b8" strokeWidth="1.2" />
            {[0, 2, 4, 6, 8, 10, 12].map((val) => {
              const y = 150 - (val / 12) * 130;
              return (
                <g key={val}>
                  <line x1="40" y1={y} x2="320" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x="34" y={y + 3} textAnchor="end" fill="#64748b">{val}</text>
                </g>
              );
            })}
            {/* Active since 1800: Tanzania ~3, Ethiopia ~11 */}
            <rect x="90" y={150 - (3/12)*130} width="24" height={(3/12)*130} fill="#334155" rx="1" />
            <rect x="118" y={150 - (11/12)*130} width="24" height={(11/12)*130} fill="#cbd5e1" rx="1" />
            <text x="116" y="168" textAnchor="middle" fill="#334155" fontWeight="600">active since 1800</text>

            {/* Active since 1960: Tanzania ~2, Ethiopia ~8 */}
            <rect x="210" y={150 - (2/12)*130} width="24" height={(2/12)*130} fill="#334155" rx="1" />
            <rect x="238" y={150 - (8/12)*130} width="24" height={(8/12)*130} fill="#cbd5e1" rx="1" />
            <text x="236" y="168" textAnchor="middle" fill="#334155" fontWeight="600">active since 1960</text>
            <text x="15" y="85" textAnchor="middle" transform="rotate(-90, 15, 85)" fill="#64748b" fontWeight="500">Number of active volcanoes</text>
          </svg>
        </div>
      </div>
    );
  }

  // Tự động phân tích các câu văn bản mô tả tỷ lệ phần trăm
  const fullText = `${question.prompt || ''} ${question.passage || ''} ${question.content || ''}`;
  const chartMatch = fullText.match(/The graph shows[^.]*?:([^.]*?\.\s)/i) || 
                     fullText.match(/The table shows[^.]*?:([^.]*?\.\s)/i);

  if (chartMatch && chartMatch[1]) {
    const rawSegments = chartMatch[1].split(/,(?![^(]*\))/);
    const parsedData = [];

    rawSegments.forEach(seg => {
      const match = seg.match(/(.+?)\s*\((?:about\s*)?(\d+(?:\.\d+)?)\s*%\)/i);
      if (match) {
        let label = match[1].replace(/and\s+/i, '').trim();
        label = label.charAt(0).toUpperCase() + label.slice(1);
        const val = parseFloat(match[2]);
        parsedData.push({ label, val });
      }
    });

    if (parsedData.length >= 2) {
      return (
        <div className="my-5 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs font-sans">
          <div className="text-center font-bold text-xs text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            Factors Influencing Behavior (% of Participants)
          </div>
          <div className="space-y-3.5 max-w-md mx-auto">
            {parsedData.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="truncate max-w-[240px]">{item.label}</span>
                  <span className="font-mono font-bold text-blue-600">{item.val}%</span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, item.val))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      );
    }
  }

  return null;
}

export default function ExamWorkspacePage({
  sessionConfig,
  currentExam,
  category,
  onExit,
  currentUser
}) {
  const examConfig = useMemo(() => {
    return sessionConfig || currentExam || category || {};
  }, [sessionConfig, currentExam, category]);

  const examTitle = examConfig.title || examConfig.name || 'SAT Practice Test';
  const isMathSection = useMemo(() => {
    const sec = String(examConfig.section || examConfig.domain || examTitle).toLowerCase();
    return sec.includes('math') || sec.includes('algebra') || sec.includes('geometry');
  }, [examConfig, examTitle]);

  // Phân biệt chế độ thi thật / đề tổng hợp với chế độ luyện kỹ năng lẻ
  const isExamMode = useMemo(() => {
    return examConfig.mode === 'exam' || 
           examConfig.isExam === true || 
           Boolean(examConfig.isFullTest) ||
           examTitle.toLowerCase().includes('test') ||
           examTitle.toLowerCase().includes('module');
  }, [examConfig, examTitle]);

  const initialPools = useMemo(() => {
    if (Array.isArray(examConfig.module1) && examConfig.module1.length > 0) {
      const m1 = examConfig.module1;
      const m2 = examConfig.module2 || examConfig.module2Easy || examConfig.module2Hard || (isMathSection ? test8Math2 : test8Rw2);
      return {
        hasTwoModules: true,
        mod1: m1,
        mod2Easy: examConfig.module2Easy || m2,
        mod2Hard: examConfig.module2Hard || m2
      };
    }

    let rawList = Array.isArray(examConfig.questions) ? examConfig.questions : [];
    if (rawList.length === 0) {
      const fallbackList = isMathSection ? test8Math2 : test8Rw2;
      return { hasTwoModules: true, mod1: fallbackList, mod2Easy: fallbackList, mod2Hard: fallbackList };
    }

    const m1Explicit = rawList.filter(q => q.stage === 1 || q.module === 1);
    const m2Explicit = rawList.filter(q => q.stage === 2 || q.module === 2);
    if (m1Explicit.length > 0 && m2Explicit.length > 0) {
      const m2H = m2Explicit.filter(q => q.branch === 'hard');
      const m2E = m2Explicit.filter(q => q.branch === 'easy');
      return {
        hasTwoModules: true,
        mod1: m1Explicit,
        mod2Easy: m2E.length > 0 ? m2E : m2Explicit,
        mod2Hard: m2H.length > 0 ? m2H : m2Explicit
      };
    }

    if (rawList.length >= 36) {
      const half = Math.floor(rawList.length / 2);
      return {
        hasTwoModules: true,
        mod1: rawList.slice(0, half),
        mod2Easy: rawList.slice(half),
        mod2Hard: rawList.slice(half)
      };
    }

    const backupMod2 = isMathSection ? test8Math2 : test8Rw2;
    return {
      hasTwoModules: isExamMode,
      mod1: rawList,
      mod2Easy: backupMod2,
      mod2Hard: backupMod2
    };
  }, [examConfig, isMathSection, isExamMode]);

  const [currentModule, setCurrentModule] = useState(1);
  const [module2Branch, setModule2Branch] = useState(null);
  const [showInstructions, setShowInstructions] = useState(isExamMode);
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  const activeQuestions = useMemo(() => {
    if (currentModule === 1) return initialPools.mod1;
    return module2Branch === 'hard' ? initialPools.mod2Hard : initialPools.mod2Easy;
  }, [currentModule, module2Branch, initialPools]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQ = activeQuestions[currentIndex] || null;

  const [moduleAnswers, setModuleAnswers] = useState({ 1: {}, 2: {} });
  const [moduleFlags, setModuleFlags] = useState({ 1: new Set(), 2: new Set() });
  const [eliminatedOptions, setEliminatedOptions] = useState({});
  const [checkedAnswers, setCheckedAnswers] = useState({});

  const [showDesmos, setShowDesmos] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [finalReportData, setFinalReportData] = useState(null);

  const defaultDuration = isMathSection ? 35 * 60 : 32 * 60;
  const [timeLeft, setTimeLeft] = useState(defaultDuration);
  const [isTimerHidden, setIsTimerHidden] = useState(false);

  const endTimeRef = useRef(null);
  const isAutoSubmittingRef = useRef(false);

  const resetTimerForModule = useCallback((durationInSeconds) => {
    endTimeRef.current = Date.now() + durationInSeconds * 1000;
    setTimeLeft(durationInSeconds);
    isAutoSubmittingRef.current = false;
  }, []);

  const { questionTimes } = usePacingTracker({
    currentIndex,
    isExamRunning: !showInstructions && !showTransitionModal && !showReport,
    section: isMathSection ? 'Math' : 'Reading & Writing'
  });

  const [highlightTooltip, setHighlightTooltip] = useState(null);
  const passageRef = useRef(null);

  const answersRef = useRef(moduleAnswers);
  answersRef.current = moduleAnswers;

  // Hàm chấm và nộp bài toàn diện
  const finishWholeExam = useCallback(() => {
    const m1Answers = answersRef.current[1] || {};
    const m2Answers = answersRef.current[2] || {};

    const allReviewed = [];
    let totalCorrect = 0;

    initialPools.mod1.forEach(q => {
      const uAns = m1Answers[q.id];
      const correct = isAnswerCorrect(uAns, q);
      if (correct) totalCorrect += 1;
      allReviewed.push({ ...q, userAnswer: uAns, isCorrect: correct, module: 1 });
    });

    const m2List = module2Branch === 'hard' ? initialPools.mod2Hard : initialPools.mod2Easy;
    if (currentModule === 2 && m2List.length > 0) {
      m2List.forEach(q => {
        const uAns = m2Answers[q.id];
        const correct = isAnswerCorrect(uAns, q);
        if (correct) totalCorrect += 1;
        allReviewed.push({ ...q, userAnswer: uAns, isCorrect: correct, module: 2 });
      });
    }

    let scaledScore = 400;
    try {
      scaledScore = calculateSatSectionScore({
        module1Responses: initialPools.mod1.map(q => ({
          questionId: q.id,
          correct: isAnswerCorrect(m1Answers[q.id], q),
          difficulty: q.difficulty || 'medium'
        })),
        module2Responses: (m2List || []).map(q => ({
          questionId: q.id,
          correct: isAnswerCorrect(m2Answers[q.id], q),
          difficulty: q.difficulty || 'medium'
        })),
        forcedBranch: module2Branch || 'easy'
      });
    } catch (e) {
      const totalQ = allReviewed.length || 1;
      scaledScore = Math.round(200 + (totalCorrect / totalQ) * 600);
      scaledScore = Math.min(800, Math.max(200, Math.round(scaledScore / 10) * 10));
    }

    const report = {
      score: scaledScore,
      scaledScore: scaledScore,
      section: isMathSection ? 'Math' : 'Reading & Writing',
      module2Path: module2Branch ? (module2Branch === 'hard' ? 'Hard' : 'Easy') : 'Standard',
      totalQuestions: allReviewed.length,
      correctCount: totalCorrect,
      timeSpent: defaultDuration - timeLeft,
      questionTimes: questionTimes || {},
      questions: allReviewed
    };

    setFinalReportData(report);
    setShowReport(true);
  }, [initialPools, module2Branch, currentModule, isMathSection, defaultDuration, timeLeft, questionTimes]);

  // Xử lý nút Save & Exit: Tự động nộp bài nếu là thi thật / luyện tập đề
  const handleSaveAndExit = () => {
    if (isExamMode) {
      if (window.confirm("Bạn đang làm bài thi. Thoát ra hệ thống sẽ tự động nộp bài và chấm điểm kết quả làm bài hiện tại. Bạn có chắc chắn muốn nộp và thoát?")) {
        finishWholeExam();
      }
    } else {
      if (onExit) onExit();
    }
  };

  const completeModule1 = useCallback(() => {
    const m1Answers = answersRef.current[1] || {};
    let correctCount = 0;
    initialPools.mod1.forEach(q => {
      if (isAnswerCorrect(m1Answers[q.id], q)) {
        correctCount += 1;
      }
    });

    const branch = routeNextModule(correctCount, initialPools.mod1.length);
    setModule2Branch(branch);
    setShowTransitionModal(true);
  }, [initialPools]);

  const startModule2 = () => {
    setShowTransitionModal(false);
    setCurrentModule(2);
    setCurrentIndex(0);
    resetTimerForModule(defaultDuration);
  };

  const handleAutoSubmit = useCallback(() => {
    if (isAutoSubmittingRef.current) return;
    isAutoSubmittingRef.current = true;
    if (currentModule === 1 && initialPools.hasTwoModules) {
      completeModule1();
    } else {
      finishWholeExam();
    }
  }, [currentModule, initialPools, completeModule1, finishWholeExam]);

  useEffect(() => {
    if (!showInstructions && !endTimeRef.current) {
      resetTimerForModule(defaultDuration);
    }
  }, [showInstructions, defaultDuration, resetTimerForModule]);

  useEffect(() => {
    if (showInstructions || showTransitionModal || showReport) return;

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;
      const now = Date.now();
      const secondsRemaining = Math.max(0, Math.round((endTimeRef.current - now) / 1000));
      setTimeLeft(secondsRemaining);

      if (secondsRemaining <= 0) {
        clearInterval(interval);
        handleAutoSubmit();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [showInstructions, showTransitionModal, showReport, handleAutoSubmit]);

  const currentAnswers = moduleAnswers[currentModule] || {};
  const currentFlags = moduleFlags[currentModule] || new Set();

  const handleSelectAnswer = (ans) => {
    setModuleAnswers(prev => ({
      ...prev,
      [currentModule]: {
        ...prev[currentModule],
        [currentQ.id]: ans
      }
    }));
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    setModuleFlags(prev => {
      const nextSet = new Set(prev[currentModule]);
      nextSet.has(currentQ.id) ? nextSet.delete(currentQ.id) : nextSet.add(currentQ.id);
      return { ...prev, [currentModule]: nextSet };
    });
  };

  const handleToggleEliminate = (optKey) => {
    if (!currentQ) return;
    setEliminatedOptions(prev => {
      const set = new Set(prev[currentQ.id] || []);
      set.has(optKey) ? set.delete(optKey) : set.add(optKey);
      return { ...prev, [currentQ.id]: set };
    });
  };

  const handleCheckAnswer = () => {
    if (!currentQ || !currentAnswers[currentQ.id]) return;
    setCheckedAnswers(prev => ({
      ...prev,
      [currentQ.id]: true
    }));
  };

  const handleMouseUpPassage = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setHighlightTooltip(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setHighlightTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 46
      });
    } else {
      setHighlightTooltip(null);
    }
  };

  const applyHighlightColor = (colorClass) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.className = `${colorClass} cursor-pointer rounded px-0.5 transition-colors`;
    span.ondblclick = () => span.replaceWith(...span.childNodes);
    try {
      range.surroundContents(span);
      sel.removeAllRanges();
    } catch (e) {
      console.warn('Vui lòng chỉ highlight trong cùng một đoạn:', e);
    }
    setHighlightTooltip(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showInstructions || showTransitionModal || showReport) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA'].includes(t.tagName))) return;

      const k = e.key.toLowerCase();
      if (k === 'arrowright') {
        if (currentIndex < activeQuestions.length - 1) setCurrentIndex(i => i + 1);
      } else if (k === 'arrowleft') {
        if (currentIndex > 0) setCurrentIndex(i => i - 1);
      } else if (k === 'f') {
        handleToggleFlag();
      } else if (!currentQ?.isGridIn && ['a', 'b', 'c', 'd'].includes(k)) {
        handleSelectAnswer(k.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeQuestions, currentQ, showInstructions, showTransitionModal, showReport]);

  const formatTime = (secs) => {
    const m = Math.floor(Math.abs(secs) / 60);
    const s = Math.abs(secs) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const matrixAnswers = useMemo(() => {
    const res = {};
    activeQuestions.forEach((q, idx) => {
      const val = currentAnswers[q.id] ?? currentAnswers[idx];
      if (val !== undefined && val !== null && val !== '') {
        res[idx] = val;
        res[q.id] = val;
      }
    });
    return res;
  }, [activeQuestions, currentAnswers]);

  const matrixBookmarked = useMemo(() => {
    const res = {};
    activeQuestions.forEach((q, idx) => {
      if (currentFlags.has(q.id) || currentFlags.has(idx)) {
        res[idx] = true;
        res[q.id] = true;
      }
    });
    return res;
  }, [activeQuestions, currentFlags]);

  const answeredCount = useMemo(() => {
    return activeQuestions.filter(q => {
      const ans = currentAnswers[q.id];
      return ans !== undefined && ans !== null && String(ans).trim() !== '';
    }).length;
  }, [activeQuestions, currentAnswers]);

  const isModuleFullyCompleted = answeredCount === activeQuestions.length;

  if (showInstructions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-800 p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {isMathSection ? 'Math Section' : 'Reading and Writing'}
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-3 mb-2">{examTitle}</h1>
            <p className="text-sm text-slate-500 mb-6">
              Vui lòng đọc kỹ quy chế trước khi bấm nút Bắt đầu để vào tính giờ làm bài.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="text-xl">⏱️</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Thời gian quy chuẩn</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isMathSection ? '35 phút / Module' : '32 phút / Module'}.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="text-xl">📊</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Cấu trúc 2 Module</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tự động phân nhánh Module 2 theo mô hình thi thích ứng.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Khóa Module 1</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Chỉ có thể nộp Module 1 khi đã hoàn thành đủ 100% câu hỏi.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="text-xl">🧮</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Công cụ hỗ trợ</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isMathSection ? 'Tích hợp máy tính Desmos & Reference sheet.' : 'Bộ công cụ Highlight màu và gạch đáp án.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-5 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              Thí sinh: <span className="font-semibold text-slate-800">{currentUser?.name || 'Phan Tiến Thành'}</span>
            </div>
            <div className="flex items-center gap-3">
              {onExit && (
                <button
                  onClick={onExit}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Thoát
                </button>
              )}
              <button
                onClick={() => {
                  resetTimerForModule(defaultDuration);
                  setShowInstructions(false);
                }}
                className="px-6 py-2.5 bg-[#b91c1c] hover:bg-red-700 text-white text-sm font-bold rounded-xl transition shadow-md cursor-pointer"
              >
                Bắt đầu làm bài
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAnswered = currentQ ? Boolean(currentAnswers[currentQ.id]) : false;
  const isFlagged = currentQ ? currentFlags.has(currentQ.id) : false;

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-800 select-none overflow-hidden font-sans">
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-2">
          <span className="font-black text-sm tracking-tight text-slate-900">
            {isMathSection ? 'Math' : 'Reading and Writing'}
          </span>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs font-semibold text-slate-600 truncate max-w-xs">
            {examTitle}
          </span>
        </div>

        {/* Đồng hồ đếm ngược */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            {!isTimerHidden ? (
              <span className={`font-mono text-lg font-black tracking-wider ${
                timeLeft <= 300 ? 'text-red-600 animate-pulse' : 'text-slate-800'
              }`}>
                {formatTime(timeLeft)}
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Đang ẩn giờ
              </span>
            )}
          </div>
          <button
            onClick={() => setIsTimerHidden(h => !h)}
            className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold underline mt-0.5 cursor-pointer"
          >
            {isTimerHidden ? 'Hiện đồng hồ' : 'Ẩn'}
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          {isMathSection && (
            <>
              <button
                onClick={() => setShowDesmos(true)}
                className="flex flex-col items-center hover:text-blue-600 transition cursor-pointer"
                title="Graphing Calculator"
              >
                <span className="text-base">🧮</span>
                <span className="text-[10px] mt-0.5">Calculator</span>
              </button>
              <button
                onClick={() => setShowReference(true)}
                className="flex flex-col items-center hover:text-blue-600 transition cursor-pointer"
                title="Formula Sheet"
              >
                <span className="text-base">📐</span>
                <span className="text-[10px] mt-0.5">Reference</span>
              </button>
            </>
          )}

          {/* Nút Save & Exit: Tự động nộp bài nếu đang ở phần thi thật */}
          <button
            onClick={handleSaveAndExit}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-xs ml-2 cursor-pointer"
          >
            Save & Exit
          </button>
        </div>
      </header>

      <div className="h-8 bg-[#11224d] text-white px-6 flex items-center justify-between text-xs font-bold tracking-wide shrink-0">
        <span>Section: {isMathSection ? 'Math' : 'Reading and Writing'}</span>
        <span className="bg-blue-600/40 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-400/30">
          Module {currentModule} {module2Branch ? `(${module2Branch.toUpperCase()})` : ''}
        </span>
      </div>

      {currentQ && (
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white relative">
          
          {/* Cột đề bài */}
          <div
            ref={passageRef}
            onMouseUp={handleMouseUpPassage}
            className="flex-1 p-6 md:p-8 overflow-y-auto leading-relaxed text-slate-800 text-[15px] select-text"
          >
            {highlightTooltip && (
              <div
                style={{ top: `${highlightTooltip.y}px`, left: `${highlightTooltip.x}px` }}
                className="fixed -translate-x-1/2 z-50 flex items-center gap-1.5 bg-slate-900 text-white p-1 rounded-full shadow-2xl border border-slate-700 animate-in fade-in"
              >
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyHighlightColor('bg-yellow-200 text-slate-900'); }}
                  className="w-5 h-5 rounded-full bg-yellow-300 hover:scale-110 transition border border-white/20"
                  title="Vàng nhạt"
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyHighlightColor('bg-pink-200 text-slate-900'); }}
                  className="w-5 h-5 rounded-full bg-pink-300 hover:scale-110 transition border border-white/20"
                  title="Hồng pastel"
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyHighlightColor('bg-sky-200 text-slate-900'); }}
                  className="w-5 h-5 rounded-full bg-sky-300 hover:scale-110 transition border border-white/20"
                  title="Xanh ngọc"
                />
                <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const sel = window.getSelection();
                    if (sel) sel.removeAllRanges();
                    setHighlightTooltip(null);
                  }}
                  className="text-[10px] px-1.5 py-0.5 text-slate-300 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="prose max-w-none text-slate-800 leading-relaxed font-serif">
              {currentQ.prompt || currentQ.passage || currentQ.content ? (
                <MathRenderer text={currentQ.prompt || currentQ.passage || currentQ.content} />
              ) : (
                <div className="font-sans font-medium text-slate-900 text-base">
                  <MathRenderer text={currentQ.question || ''} />
                </div>
              )}
            </div>

            {/* Render biểu đồ cho Verbal */}
            <VerbalChartRenderer question={currentQ} />
          </div>

          {/* Cột câu hỏi và phương án */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-md">
                    {currentIndex + 1}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleFlag}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition border cursor-pointer ${
                      isFlagged
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isFlagged ? '⚑' : '⚐'}</span>
                    <span>{isFlagged ? 'Marked for Review' : 'Mark for review'}</span>
                  </button>
                </div>

                <div className="text-xs font-bold text-slate-400 tracking-wider">
                  QUESTION {currentIndex + 1} OF {activeQuestions.length}
                </div>
              </div>

              {(currentQ.prompt || currentQ.passage || currentQ.content) && currentQ.question && (
                <div className="text-[15px] font-medium text-slate-900 mb-6 leading-relaxed">
                  <MathRenderer text={currentQ.question} />
                </div>
              )}

              {currentQ.isGridIn ? (
                <div className="mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs max-w-sm">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Student-Produced Response
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={currentAnswers[currentQ.id] ?? ''}
                    onChange={(e) => handleSelectAnswer(normalizeSprAnswer(e.target.value))}
                    placeholder="e.g. 7/4 or 1.75"
                    className="w-full px-4 py-3 text-lg font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Nhập phân số (ví dụ 3/2) hoặc số thập phân (ví dụ 1.5).
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(currentQ.options || {}).map(([key, text]) => {
                    const isSelected = currentAnswers[currentQ.id] === key;
                    const isEliminated = (eliminatedOptions[currentQ.id] || new Set()).has(key);

                    return (
                      <div key={key} className="flex items-center gap-2 group">
                        <button
                          type="button"
                          onClick={() => handleSelectAnswer(key)}
                          className={`flex-1 flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-600 ring-1 ring-blue-600 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          } ${isEliminated ? 'opacity-40 line-through' : ''}`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                            }`}
                          >
                            {key}
                          </span>
                          <div className="pt-0.5 flex-1 text-sm font-medium text-slate-800 leading-relaxed">
                            <MathRenderer text={typeof text === 'object' ? text.text : text} />
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleEliminate(key)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            isEliminated
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600'
                          }`}
                          title="Gạch bỏ phương án này"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isExamMode && checkedAnswers[currentQ.id] && (
                <div className={`mt-6 p-4 rounded-xl border ${
                  isAnswerCorrect(currentAnswers[currentQ.id], currentQ)
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}>
                  <div className="font-bold text-sm mb-1">
                    {isAnswerCorrect(currentAnswers[currentQ.id], currentQ) ? '✓ Chính xác!' : '✗ Chưa chính xác'}
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed mt-2">
                    <MathRenderer text={currentQ.explanation || 'Không có giải thích chi tiết cho câu hỏi này.'} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="h-16 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="text-xs font-semibold text-slate-500">
          Thí sinh: <span className="text-slate-800 font-bold">{currentUser?.name || 'Phan Tiến Thành'}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMatrix(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Question {currentIndex + 1} of {activeQuestions.length}</span>
            <span className="text-[10px]">▲</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Back
          </button>

          {!isExamMode && isAnswered && (
            <button
              type="button"
              onClick={handleCheckAnswer}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Check
            </button>
          )}

          {currentIndex < activeQuestions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex(i => Math.min(activeQuestions.length - 1, i + 1))}
              className="px-6 py-2 bg-[#b91c1c] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              Next
            </button>
          ) : (
            <div className="relative group">
              <button
                type="button"
                disabled={!isModuleFullyCompleted}
                onClick={() => {
                  if (!isModuleFullyCompleted) return;
                  if (currentModule === 1 && initialPools.hasTwoModules) {
                    completeModule1();
                  } else {
                    finishWholeExam();
                  }
                }}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 ${
                  isModuleFullyCompleted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-200'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
              >
                <span>
                  {currentModule === 1 && initialPools.hasTwoModules
                    ? 'Nộp Module 1' 
                    : 'Finish Exam'}
                </span>
              </button>

              {!isModuleFullyCompleted && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[11px] font-medium py-1 px-2.5 rounded-lg shadow-lg z-30">
                  Cần hoàn thành 100% ({answeredCount}/{activeQuestions.length} câu) để nộp module
                </div>
              )}
            </div>
          )}
        </div>
      </footer>

      {showTransitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto mb-4 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-2xl">
              ✓
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Module 1 Completed</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Bạn đã hoàn thành 100% câu hỏi của Module 1 ({initialPools.mod1.length} câu). Khi bấm tiếp tục, bạn sẽ bắt đầu <strong>Module 2</strong> ({initialPools.mod2Easy.length} câu) và không thể quay lại chỉnh sửa các câu hỏi của Module 1.
            </p>
            <button
              type="button"
              onClick={startModule2}
              className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md cursor-pointer"
            >
              Bắt đầu Module 2
            </button>
          </div>
        </div>
      )}

      <MatrixModal
        isOpen={showMatrix}
        onClose={() => setShowMatrix(false)}
        questions={activeQuestions}
        totalQuestions={activeQuestions.length}
        currentIndex={currentIndex}
        answers={matrixAnswers}
        bookmarked={matrixBookmarked}
        flags={currentFlags}
        onSelectIndex={(idx) => {
          setCurrentIndex(idx);
          setShowMatrix(false);
        }}
        onSelectQuestion={(idx) => {
          setCurrentIndex(idx);
          setShowMatrix(false);
        }}
      />

      {isMathSection && (
        <>
          <DesmosModal isOpen={showDesmos} onClose={() => setShowDesmos(false)} />
          <ReferenceModal isOpen={showReference} onClose={() => setShowReference(false)} />
        </>
      )}

      {showReport && finalReportData && (
        <ScoreReportModal
          isOpen={showReport}
          onClose={() => {
            setShowReport(false);
            if (onExit) onExit();
          }}
          reportData={finalReportData}
          onRetry={() => {
            setShowReport(false);
            setCurrentModule(1);
            setCurrentIndex(0);
            resetTimerForModule(defaultDuration);
            setModuleAnswers({ 1: {}, 2: {} });
            setModuleFlags({ 1: new Set(), 2: new Set() });
          }}
        />
      )}
    </div>
  );
}