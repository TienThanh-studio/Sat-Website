import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import ScoreReportModal from '../components/exam/ScoreReportModal';
import MatrixModal from '../components/exam/MatrixModal';
import { usePacingTracker } from '../hooks/usePacingTracker';
import { normalizeSprAnswer, isAnswerCorrect } from '../services/adaptiveEngine';
import { calculateModuleScore } from '../services/satIrtScoring';

// Dữ liệu dự phòng
import test8Rw2 from '../data/questions/tests/sat_test_8_rw2.json';
import test8Math2 from '../data/questions/tests/sat_test_8_math2.json';

// =========================================================================
// 1. COMPONENT DỰNG HÌNH VẼ HỌC & ĐỒ THỊ SVG CHO PHẦN MATH
// =========================================================================
function MathFigureRenderer({ question }) {
  if (!question) return null;
  const prompt = (question.prompt || question.passage || question.question || '').toLowerCase();

  // 1. Tam giác vuông 45-45-90
  if (prompt.includes('45°') || prompt.includes('45^\\circ') || (prompt.includes('triangle') && prompt.includes('sin a'))) {
    return (
      <div className="my-5 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center select-none">
        <svg viewBox="0 0 240 180" className="w-56 h-auto text-xs font-sans">
          <polygon points="40,140 180,140 40,30" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
          <polyline points="40,125 55,125 55,140" fill="none" stroke="#334155" strokeWidth="1.5" />
          <path d="M 160 140 A 20 20 0 0 1 168 126" fill="none" stroke="#64748b" strokeWidth="1.5" />
          <text x="145" y="134" fill="#0f172a" fontSize="11" fontWeight="bold">45°</text>
          <text x="25" y="150" fill="#0f172a" fontSize="13" fontWeight="bold">C</text>
          <text x="190" y="150" fill="#0f172a" fontSize="13" fontWeight="bold">A</text>
          <text x="32" y="24" fill="#0f172a" fontSize="13" fontWeight="bold">B</text>
          <text x="115" y="78" fill="#2563eb" fontSize="12" fontWeight="bold">x = 19</text>
        </svg>
        <span className="text-[11px] text-slate-400 italic mt-1 font-sans">Note: Figure not drawn to scale.</span>
      </div>
    );
  }

  // 2. Hai đường thẳng cắt nhau tạo góc kề bù r và s
  if (prompt.includes('intersect') && (prompt.includes('71') || (prompt.includes('r') && prompt.includes('s')))) {
    return (
      <div className="my-5 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center select-none">
        <svg viewBox="0 0 240 140" className="w-56 h-auto text-xs font-sans">
          <line x1="20" y1="110" x2="220" y2="30" stroke="#334155" strokeWidth="2" />
          <line x1="40" y1="30" x2="200" y2="110" stroke="#334155" strokeWidth="2" />
          <text x="115" y="55" fill="#2563eb" fontSize="12" fontWeight="bold">r°</text>
          <text x="150" y="75" fill="#0f172a" fontSize="12" fontWeight="bold">s°</text>
        </svg>
        <span className="text-[11px] text-slate-400 italic mt-1 font-sans">Note: Figure not drawn to scale.</span>
      </div>
    );
  }

  // 3. Tam giác đồng dạng DE song song AC
  if (prompt.includes('parallel to') && (prompt.includes('ac') || prompt.includes('de'))) {
    return (
      <div className="my-5 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center select-none">
        <svg viewBox="0 0 240 180" className="w-56 h-auto text-xs font-sans">
          <polygon points="120,20 30,160 210,160" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
          <line x1="75" y1="90" x2="165" y2="90" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 2" />
          <text x="115" y="15" fill="#0f172a" fontSize="12" fontWeight="bold">B</text>
          <text x="18" y="168" fill="#0f172a" fontSize="12" fontWeight="bold">A</text>
          <text x="215" y="168" fill="#0f172a" fontSize="12" fontWeight="bold">C</text>
          <text x="60" y="88" fill="#2563eb" fontSize="11" fontWeight="bold">D</text>
          <text x="172" y="88" fill="#2563eb" fontSize="11" fontWeight="bold">E</text>
          <text x="145" y="55" fill="#64748b" fontSize="10">BE = 9</text>
          <text x="120" y="175" fill="#64748b" fontSize="10" textAnchor="middle">AC = 8</text>
        </svg>
        <span className="text-[11px] text-slate-400 italic mt-1 font-sans">Note: Figure not drawn to scale.</span>
      </div>
    );
  }

  // 4. Biểu đồ giá trị xe đạp leo núi (Mountain bike value)
  if (prompt.includes('mountain bike') || (prompt.includes('275') && prompt.includes('purchased'))) {
    return (
      <div className="my-5 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center select-none">
        <svg viewBox="0 0 280 180" className="w-64 h-auto text-[10px] font-sans">
          <line x1="40" y1="20" x2="40" y2="150" stroke="#94a3b8" strokeWidth="1.2" />
          <line x1="40" y1="150" x2="260" y2="150" stroke="#94a3b8" strokeWidth="1.2" />
          <text x="35" y="28" textAnchor="end" fill="#64748b">350</text>
          <text x="35" y="65" textAnchor="end" fill="#64748b">275</text>
          <text x="35" y="150" textAnchor="end" fill="#64748b">0</text>
          <text x="200" y="165" textAnchor="middle" fill="#64748b">Months (x)</text>
          <text x="15" y="85" textAnchor="middle" transform="rotate(-90, 15, 85)" fill="#64748b">Value ($)</text>
          <line x1="40" y1="62" x2="220" y2="115" stroke="#2563eb" strokeWidth="2.5" />
          <circle cx="40" cy="62" r="3.5" fill="#1d4ed8" />
        </svg>
        <span className="text-[11px] text-slate-400 italic mt-1 font-sans">Graph of Estimated Bike Value</span>
      </div>
    );
  }

  return null;
}

// =========================================================================
// 2. COMPONENT DỰNG BIỂU ĐỒ CỘT SVG CHO PHẦN VERBAL
// =========================================================================
function VerbalChartRenderer({ question }) {
  if (!question) return null;

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

  // Biểu đồ Tax Penalties (Form 4720)
  if (promptText.includes('form 4720') || promptText.includes('private foundations')) {
    return (
      <div className="my-5 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs font-sans select-none">
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
            <rect x="75" y={160 - (10/80)*140} width="16" height={(10/80)*140} fill="#64748b" rx="1" />
            <rect x="93" y={160 - (6/80)*140} width="16" height={(6/80)*140} fill="#cbd5e1" rx="1" />
            <rect x="111" y={160 - (40/80)*140} width="16" height={(40/80)*140} fill="#0f172a" rx="1" />
            <text x="101" y="175" textAnchor="middle" fill="#334155" fontWeight="600">self-dealing</text>

            <rect x="165" y={160 - (79/80)*140} width="16" height={(79/80)*140} fill="#64748b" rx="1" />
            <rect x="183" y={160 - (77/80)*140} width="16" height={(77/80)*140} fill="#cbd5e1" rx="1" />
            <rect x="201" y={160 - (55/80)*140} width="16" height={(55/80)*140} fill="#0f172a" rx="1" />
            <text x="191" y="175" textAnchor="middle" fill="#334155" fontWeight="600">undistributed income</text>

            <rect x="255" y={160 - (7/80)*140} width="16" height={(7/80)*140} fill="#64748b" rx="1" />
            <rect x="273" y={160 - (14/80)*140} width="16" height={(14/80)*140} fill="#cbd5e1" rx="1" />
            <rect x="291" y={160 - (4/80)*140} width="16" height={(4/80)*140} fill="#0f172a" rx="1" />
            <text x="281" y="175" textAnchor="middle" fill="#334155" fontWeight="600">taxable expenditures</text>

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

  // Biểu đồ Núi lửa Tanzania / Ethiopia
  if (promptText.includes('volcanoes') || promptText.includes('tanzania') || promptText.includes('ethiopia')) {
    return (
      <div className="my-5 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs font-sans select-none">
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
            <rect x="90" y={150 - (3/12)*130} width="24" height={(3/12)*130} fill="#334155" rx="1" />
            <rect x="118" y={150 - (11/12)*130} width="24" height={(11/12)*130} fill="#cbd5e1" rx="1" />
            <text x="116" y="168" textAnchor="middle" fill="#334155" fontWeight="600">active since 1800</text>

            <rect x="210" y={150 - (2/12)*130} width="24" height={(2/12)*130} fill="#334155" rx="1" />
            <rect x="238" y={150 - (8/12)*130} width="24" height={(8/12)*130} fill="#cbd5e1" rx="1" />
            <text x="236" y="168" textAnchor="middle" fill="#334155" fontWeight="600">active since 1960</text>
            <text x="15" y="85" textAnchor="middle" transform="rotate(-90, 15, 85)" fill="#64748b" fontWeight="500">Number of volcanoes</text>
          </svg>
        </div>
      </div>
    );
  }

  return null;
}

// =========================================================================
// 3. WORKSPACE PHÒNG THI CHÍNH (TOÀN DIỆN LOGIC 4 MODULES & PRACTICE MODE)
// =========================================================================
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

  // Phân biệt chế độ Full Test 4 Modules hay bài luyện tập thông thường
  const isFullTest4Modules = useMemo(() => {
    return Boolean(
      examConfig.isFullTest ||
      (Array.isArray(examConfig.sections) && examConfig.sections.length >= 2)
    );
  }, [examConfig]);

  const isExamMode = useMemo(() => {
    if (examConfig.mode === 'practice' || examConfig.isExam === false) return false;
    return Boolean(examConfig.mode === 'exam' || examConfig.isExam === true || examConfig.isFullTest);
  }, [examConfig]);

  // Section index: 0 = Reading & Writing, 1 = Math
  const [sectionIndex, setSectionIndex] = useState(0);
  const [currentModule, setCurrentModule] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Nghỉ giữa giờ (10 phút = 600s)
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(600);

  // Quản lý câu trả lời & cờ
  const [answers, setAnswers] = useState({
    rw: { 1: {}, 2: {} },
    math: { 1: {}, 2: {} }
  });
  const [flags, setFlags] = useState({
    rw: { 1: new Set(), 2: new Set() },
    math: { 1: new Set(), 2: new Set() }
  });

  const [eliminatedOptions, setEliminatedOptions] = useState({});
  const [checkedAnswers, setCheckedAnswers] = useState({});

  // Modals & Công cụ
  const [showDesmos, setShowDesmos] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [finalReportData, setFinalReportData] = useState(null);

  // Highlight tooltip
  const [highlightTooltip, setHighlightTooltip] = useState(null);
  const passageRef = useRef(null);

  // Lấy danh sách câu hỏi hiện tại
  const currentQuestionPool = useMemo(() => {
    if (isFullTest4Modules && examConfig.sections) {
      const sec = examConfig.sections[sectionIndex];
      if (sec && Array.isArray(sec.modules)) {
        const mod = sec.modules.find(m => m.moduleNumber === currentModule);
        if (mod && Array.isArray(mod.questions)) return mod.questions;
      }
    }

    if (Array.isArray(examConfig.questions) && examConfig.questions.length > 0) {
      return examConfig.questions;
    }
    return sectionIndex === 0 ? test8Rw2 : test8Math2;
  }, [isFullTest4Modules, examConfig, sectionIndex, currentModule]);

  const currentQ = currentQuestionPool[currentIndex] || null;

  const currentSectionName = sectionIndex === 0 ? 'Reading and Writing' : 'Math';
  const isMathSection = sectionIndex === 1 || String(examConfig.section || '').toLowerCase().includes('math');

  // ================= BỘ ĐẾM THỜI GIAN CHUẨN XÁC =================
  const defaultDuration = isMathSection ? 35 * 60 : 32 * 60;
  const [timeLeft, setTimeLeft] = useState(isExamMode ? defaultDuration : 0);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const endTimeRef = useRef(Date.now() + defaultDuration * 1000);
  const startTimeRef = useRef(Date.now());
  const isAutoSubmittingRef = useRef(false);

  const resetTimerForCurrent = useCallback((durationInSecs) => {
    if (isExamMode) {
      endTimeRef.current = Date.now() + durationInSecs * 1000;
      setTimeLeft(durationInSecs);
    } else {
      startTimeRef.current = Date.now();
      setTimeLeft(0);
    }
    isAutoSubmittingRef.current = false;
  }, [isExamMode]);

  // Hook theo dõi thời gian từng câu
  const { questionTimes } = usePacingTracker({
    currentIndex,
    isExamRunning: !isOnBreak && !showReport,
    section: currentSectionName
  });

  // ================= KẾT THÚC BÀI THI & TÍNH ĐIỂM =================
  const finishFullExam = useCallback(() => {
    let rwM1 = [];
    let rwM2 = [];
    let mathM1 = [];
    let mathM2 = [];

    if (isFullTest4Modules && examConfig.sections) {
      rwM1 = examConfig.sections[0]?.modules[0]?.questions || [];
      rwM2 = examConfig.sections[0]?.modules[1]?.questions || [];
      mathM1 = examConfig.sections[1]?.modules[0]?.questions || [];
      mathM2 = examConfig.sections[1]?.modules[1]?.questions || [];
    }

    const rwResult = calculateModuleScore({
      m1Questions: rwM1,
      m1Answers: answers.rw[1],
      m2Questions: rwM2,
      m2Answers: answers.rw[2]
    });

    const mathResult = calculateModuleScore({
      m1Questions: mathM1,
      m1Answers: answers.math[1],
      m2Questions: mathM2,
      m2Answers: answers.math[2]
    });

    const totalScore = rwResult.sectionScore + mathResult.sectionScore;

    const report = {
      score: totalScore,
      totalScore,
      scaledScore: totalScore,
      rwScore: rwResult.sectionScore,
      mathScore: mathResult.sectionScore,
      rwCorrect: rwResult.correctCount,
      mathCorrect: mathResult.correctCount,
      totalQuestions: rwM1.length + rwM2.length + mathM1.length + mathM2.length,
      rwDetails: rwResult,
      mathDetails: mathResult,
      questionTimes: questionTimes || {}
    };

    setFinalReportData(report);
    setShowReport(true);
  }, [isFullTest4Modules, examConfig, answers, questionTimes]);

  const handleAutoNextModule = useCallback(() => {
    if (isAutoSubmittingRef.current) return;
    isAutoSubmittingRef.current = true;

    if (sectionIndex === 0) {
      if (currentModule === 1) {
        setCurrentModule(2);
        setCurrentIndex(0);
        resetTimerForCurrent(32 * 60);
      } else {
        setIsOnBreak(true);
        setBreakTimeLeft(600);
      }
    } else {
      if (currentModule === 1) {
        setCurrentModule(2);
        setCurrentIndex(0);
        resetTimerForCurrent(35 * 60);
      } else {
        finishFullExam();
      }
    }
  }, [sectionIndex, currentModule, resetTimerForCurrent, finishFullExam]);

  // Bộ đếm thời gian chính
  useEffect(() => {
    if (isOnBreak || showReport) return;

    const timer = setInterval(() => {
      const now = Date.now();
      if (isExamMode) {
        const remain = Math.max(0, Math.round((endTimeRef.current - now) / 1000));
        setTimeLeft(remain);

        if (remain <= 0 && !isAutoSubmittingRef.current) {
          clearInterval(timer);
          handleAutoNextModule();
        }
      } else {
        const elapsed = Math.round((now - startTimeRef.current) / 1000);
        setTimeLeft(elapsed);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [isOnBreak, showReport, isExamMode, handleAutoNextModule]);

  // Bộ đếm thời gian nghỉ 10 phút
  useEffect(() => {
    if (!isOnBreak) return;
    const breakTimer = setInterval(() => {
      setBreakTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(breakTimer);
          handleEndBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(breakTimer);
  }, [isOnBreak]);

  const handleEndBreak = () => {
    setIsOnBreak(false);
    setSectionIndex(1); // Chuyển sang Math
    setCurrentModule(1);
    setCurrentIndex(0);
    resetTimerForCurrent(35 * 60);
  };

  const handleManualNextModule = () => {
    if (sectionIndex === 0 && currentModule === 1) {
      if (window.confirm('Bạn có chắc chắn muốn nộp Reading & Writing Module 1 để chuyển sang Module 2?')) {
        setCurrentModule(2);
        setCurrentIndex(0);
        resetTimerForCurrent(32 * 60);
      }
    } else if (sectionIndex === 0 && currentModule === 2) {
      if (window.confirm('Bạn đã hoàn thành phần Reading & Writing. Bắt đầu thời gian nghỉ giải lao 10 phút?')) {
        setIsOnBreak(true);
        setBreakTimeLeft(600);
      }
    } else if (sectionIndex === 1 && currentModule === 1) {
      if (window.confirm('Bạn có chắc chắn muốn nộp Math Module 1 để chuyển sang Module 2?')) {
        setCurrentModule(2);
        setCurrentIndex(0);
        resetTimerForCurrent(35 * 60);
      }
    } else {
      if (window.confirm('Bạn có chắc chắn muốn kết thúc và nộp toàn bộ bài thi?')) {
        finishFullExam();
      }
    }
  };

  // ================= TƯƠNG TÁC ĐÁP ÁN & CỜ =================
  const activeKey = sectionIndex === 0 ? 'rw' : 'math';
  const currentAnswersMap = answers[activeKey][currentModule] || {};
  const currentFlagsSet = flags[activeKey][currentModule] || new Set();

  const handleSelectAnswer = (ans) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        [currentModule]: {
          ...prev[activeKey][currentModule],
          [currentQ.id]: ans
        }
      }
    }));
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    setFlags((prev) => {
      const nextSet = new Set(prev[activeKey][currentModule]);
      if (nextSet.has(currentQ.id)) {
        nextSet.delete(currentQ.id);
      } else {
        nextSet.add(currentQ.id);
      }
      return {
        ...prev,
        [activeKey]: {
          ...prev[activeKey],
          [currentModule]: nextSet
        }
      };
    });
  };

  const handleToggleEliminate = (optKey) => {
    if (!currentQ) return;
    setEliminatedOptions((prev) => {
      const set = new Set(prev[currentQ.id] || []);
      set.has(optKey) ? set.delete(optKey) : set.add(optKey);
      return { ...prev, [currentQ.id]: set };
    });
  };

  const handleCheckAnswer = () => {
    if (!currentQ || currentAnswersMap[currentQ.id] === undefined) return;
    setCheckedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: true
    }));
  };

  // ================= BỘ HIGHLIGHT MÀU VĂN BẢN =================
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

  // ================= BỘ PHÍM TẮT BÀN PHÍM =================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOnBreak || showReport) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA'].includes(t.tagName))) return;

      const k = e.key.toLowerCase();
      if (k === 'arrowright') {
        if (currentIndex < currentQuestionPool.length - 1) setCurrentIndex(i => i + 1);
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
  }, [currentIndex, currentQuestionPool, currentQ, isOnBreak, showReport]);

  // SỬA LỖI TRIỆT ĐỂ: Khai báo đầy đủ m và s trong hàm formatTime
  const formatTime = (totalSeconds) => {
    const m = Math.floor(Math.abs(totalSeconds) / 60);
    const s = Math.abs(totalSeconds) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isAnswered = currentQ ? (currentAnswersMap[currentQ.id] !== undefined && currentAnswersMap[currentQ.id] !== '') : false;
  const isFlagged = currentQ ? currentFlagsSet.has(currentQ.id) : false;

  const isCurrentAnswerCorrect = useMemo(() => {
    if (!currentQ || currentAnswersMap[currentQ.id] === undefined) return false;
    const userVal = String(currentAnswersMap[currentQ.id]).trim().toUpperCase();
    const correctVal = String(currentQ.correctAnswer || '').trim().toUpperCase();
    return userVal === correctVal || isAnswerCorrect(currentAnswersMap[currentQ.id], currentQ);
  }, [currentQ, currentAnswersMap]);

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-800 select-none overflow-hidden font-sans">
      {/* HEADER BẢNG THI */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2">
          <span className="font-black text-sm tracking-tight text-slate-900">
            {currentSectionName}
          </span>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs font-semibold text-slate-600 truncate max-w-xs">
            {examConfig.title || 'Official Digital SAT'}
          </span>
        </div>

        {/* Đồng hồ đếm thời gian */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            {!isTimerHidden ? (
              <span className={`font-mono text-lg font-black tracking-wider ${
                isExamMode && timeLeft <= 300 ? 'text-red-600 animate-pulse' : 'text-slate-800'
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
            type="button"
            onClick={() => setIsTimerHidden(!isTimerHidden)}
            className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold underline mt-0.5 cursor-pointer"
          >
            {isTimerHidden ? 'Hiện đồng hồ' : 'Ẩn'}
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          {isMathSection && (
            <>
              <button
                type="button"
                onClick={() => setShowDesmos(true)}
                className="flex flex-col items-center hover:text-blue-600 transition cursor-pointer"
                title="Calculator"
              >
                <span className="text-base">🧮</span>
                <span className="text-[10px] mt-0.5">Calculator</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReference(true)}
                className="flex flex-col items-center hover:text-blue-600 transition cursor-pointer"
                title="Reference"
              >
                <span className="text-base">📐</span>
                <span className="text-[10px] mt-0.5">Reference</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn thoát khỏi phòng thi?')) {
                onExit && onExit();
              }
            }}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Save & Exit
          </button>
        </div>
      </header>

      {/* DẢI TIÊU ĐỀ SUB-HEADER */}
      <div className="h-8 bg-[#11224d] text-white px-6 flex items-center justify-between text-xs font-bold tracking-wide shrink-0">
        <span>Section: {currentSectionName}</span>
        <span className="bg-blue-600/40 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-400/30">
          Module {currentModule}
        </span>
      </div>

      {/* KHU VỰC LÀM BÀI CHÍNH */}
      {currentQ && (
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white relative">
          
          {/* CỘT ĐỀ BÀI (CÓ HIGHLIGHT TOOLTIP) */}
          <div 
            ref={passageRef}
            onMouseUp={handleMouseUpPassage}
            className="flex-1 p-6 md:p-8 overflow-y-auto leading-relaxed text-slate-800 text-[15px] select-text relative"
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
                  title="Vàng"
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyHighlightColor('bg-pink-200 text-slate-900'); }}
                  className="w-5 h-5 rounded-full bg-pink-300 hover:scale-110 transition border border-white/20"
                  title="Hồng"
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyHighlightColor('bg-sky-200 text-slate-900'); }}
                  className="w-5 h-5 rounded-full bg-sky-300 hover:scale-110 transition border border-white/20"
                  title="Xanh"
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

            {/* Dựng biểu đồ cột cho Verbal */}
            {!isMathSection && <VerbalChartRenderer question={currentQ} />}

            {/* Dựng hình học cho Math */}
            {isMathSection && <MathFigureRenderer question={currentQ} />}
          </div>

          {/* CỘT CÂU HỎI & ĐÁP ÁN */}
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
                  QUESTION {currentIndex + 1} OF {currentQuestionPool.length}
                </div>
              </div>

              {(currentQ.prompt || currentQ.passage || currentQ.content) && currentQ.question && (
                <div className="text-[15px] font-medium text-slate-900 mb-6 leading-relaxed">
                  <MathRenderer text={currentQ.question} />
                </div>
              )}

              {/* DẠNG ĐIỀN SỐ (SPR / Grid-In) */}
              {currentQ.isGridIn ? (
                <div className="mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs max-w-sm">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Student-Produced Response
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={currentAnswersMap[currentQ.id] ?? ''}
                    onChange={(e) => handleSelectAnswer(normalizeSprAnswer(e.target.value))}
                    placeholder="e.g. 7/4 or 1.75"
                    className="w-full px-4 py-3 text-lg font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Nhập phân số (ví dụ 3/2) hoặc số thập phân (ví dụ 1.5).
                  </p>
                </div>
              ) : (
                /* DẠNG TRẮC NGHIỆM */
                <div className="space-y-3">
                  {Object.entries(currentQ.options || {}).map(([key, text]) => {
                    const isSelected = currentAnswersMap[currentQ.id] === key;
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
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                          }`}>
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
                          title="Gạch phương án này"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Lời giải tức thì khi bấm Check trong chế độ luyện tập */}
              {!isExamMode && checkedAnswers[currentQ.id] && (
                <div className={`mt-6 p-4 rounded-xl border animate-in fade-in zoom-in-95 ${
                  isCurrentAnswerCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}>
                  <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
                    <span>{isCurrentAnswerCorrect ? '✓ Chính xác!' : '✗ Chưa chính xác'}</span>
                    {!isCurrentAnswerCorrect && currentQ.correctAnswer && (
                      <span className="text-xs font-semibold ml-2">
                        (Đáp án đúng: <span className="font-bold">{currentQ.correctAnswer}</span>)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed mt-2 pt-2 border-t border-slate-200/60">
                    <span className="font-bold block mb-1">Giải thích chi tiết:</span>
                    <MathRenderer text={currentQ.explanation || 'Không có giải thích chi tiết cho câu hỏi này.'} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* FOOTER ĐIỀU HƯỚNG */}
      <footer className="h-16 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="text-xs font-semibold text-slate-500">
          Thí sinh: <span className="text-slate-800 font-bold">{currentUser?.name || 'Học viên'}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMatrix(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Question {currentIndex + 1} of {currentQuestionPool.length}</span>
            <span className="text-[10px]">▲</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Back
          </button>

          {/* Nút Check chỉ xuất hiện ở chế độ luyện tập */}
          {!isExamMode && isAnswered && (
            <button
              type="button"
              onClick={handleCheckAnswer}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              Check
            </button>
          )}

          {currentIndex < currentQuestionPool.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(currentQuestionPool.length - 1, i + 1))}
              className="px-6 py-2 bg-[#b91c1c] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleManualNextModule}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              {sectionIndex === 1 && currentModule === 2 ? 'Finish Full Exam' : `Nộp Module ${currentModule}`}
            </button>
          )}
        </div>
      </footer>

      {/* MODAL NGHỈ GIẢI LAO 10 PHÚT (BREAK MODAL) */}
      {isOnBreak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 text-center shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xs">
              ☕
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Official 10-Minute Break
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-3">Thời gian nghỉ giải lao</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bạn đã hoàn thành 2 Modules Reading & Writing. Hãy thư giãn mắt và chuẩn bị bắt đầu phần thi Math.
              </p>
            </div>

            <div className="py-4">
              <span className="font-mono text-5xl font-black text-slate-900 tracking-wider">
                {Math.floor(breakTimeLeft / 60).toString().padStart(2, '0')}:{(breakTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleEndBreak}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer"
            >
              Bỏ qua nghỉ & Bắt đầu phần Math ngay
            </button>
          </div>
        </div>
      )}

      {/* MODAL MÁY TÍNH DESMOS & BẢNG CÔNG THỨC */}
      {isMathSection && (
        <>
          <DesmosModal isOpen={showDesmos} onClose={() => setShowDesmos(false)} />
          <ReferenceModal isOpen={showReference} onClose={() => setShowReference(false)} />
        </>
      )}

      {/* MODAL BẢNG MATRIX CÂU HỎI */}
      <MatrixModal
        isOpen={showMatrix}
        onClose={() => setShowMatrix(false)}
        questions={currentQuestionPool}
        totalQuestions={currentQuestionPool.length}
        currentIndex={currentIndex}
        answers={currentAnswersMap}
        flags={currentFlagsSet}
        onSelectIndex={(idx) => {
          setCurrentIndex(idx);
          setShowMatrix(false);
        }}
      />

      {/* MODAL BÁO CÁO KẾT QUẢ THI */}
      {showReport && finalReportData && (
        <ScoreReportModal
          isOpen={showReport}
          onClose={() => {
            setShowReport(false);
            onExit && onExit();
          }}
          reportData={finalReportData}
        />
      )}
    </div>
  );
}