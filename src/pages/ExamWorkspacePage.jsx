// src/pages/ExamWorkspacePage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calculator,
  BookOpen,
  Flag,
  CheckCircle2,
  XCircle,
  Sparkles,
  Bot,
  Send,
  RotateCcw,
  Eye,
  EyeOff,
  Check,
  ListFilter,
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import ScoreReportModal from '../components/exam/ScoreReportModal';
import AiTutorModal from '../components/exam/AiTutorModal';
import { questionService } from '../services/questionService';
import { storageService } from '../services/storageService';
import { calculateIrtScore } from '../services/satIrtScoring';

export default function ExamWorkspacePage({
  activeCategory,
  examConfig,
  onExit,
  onComplete,
}) {
  // Lấy danh sách câu hỏi từ bộ đề được chọn (đã được lọc Chưa làm / Đã làm từ QuestionBankPage)
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

  // Bộ lọc phụ ngay trong phòng làm bài nếu muốn chuyển nhanh giữa Tất cả / Chưa làm
  const [inAppFilter, setInAppFilter] = useState('all'); // 'all' | 'unanswered'
  const [completedSet, setCompletedSet] = useState(() => storageService.getCompletedSet());

  const questions = useMemo(() => {
    if (inAppFilter === 'unanswered') {
      const remaining = initialQuestions.filter((q) => !completedSet.has(String(q.id)));
      return remaining.length > 0 ? remaining : initialQuestions;
    }
    return initialQuestions;
  }, [initialQuestions, inAppFilter, completedSet]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [checkedMap, setCheckedMap] = useState({});
  const [flaggedMap, setFlaggedMap] = useState({});
  const [eliminatedMap, setEliminatedMap] = useState({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showTimer, setShowTimer] = useState(true);

  // Trạng thái các Modal công cụ hỗ trợ
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [scoreReport, setScoreReport] = useState(null);

  // Theo dõi thời gian làm từng câu
  const questionTimesRef = useRef({});
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    setCurrentIdx(0);
    setUserAnswers({});
    setCheckedMap({});
    setFlaggedMap({});
    setElapsedSeconds(0);
  }, [activeCategory, examConfig]);

  // Bộ đếm thời gian
  useEffect(() => {
    if (scoreReport) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      questionTimesRef.current[currentIdx] =
        (questionTimesRef.current[currentIdx] || 0) + 1;
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIdx, scoreReport]);

  // Điều hướng nhanh bằng phím mũi tên Trái / Phải
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (scoreReport || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowRight' && currentIdx < questions.length - 1) {
        setCurrentIdx((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIdx > 0) {
        setCurrentIdx((i) => i - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, questions.length, scoreReport]);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-12 text-center text-slate-300 space-y-4">
        <p className="text-lg font-bold">Không tìm thấy câu hỏi nào trong bộ đề này.</p>
        <button
          type="button"
          onClick={onExit}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer"
        >
          Quay lại Ngân hàng câu hỏi
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx] || questions[0];
  const qId = currentQ.id || `q_${currentIdx}`;
  const selectedAnswer = userAnswers[qId] || '';
  const isChecked = Boolean(checkedMap[qId]);
  const isAlreadyCompletedBefore = completedSet.has(String(qId));

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
      [qId]: letter,
    }));
  };

  const handleToggleEliminate = (e, letter) => {
    e.stopPropagation();
    setEliminatedMap((prev) => {
      const currentList = prev[qId] || [];
      const nextList = currentList.includes(letter)
        ? currentList.filter((item) => item !== letter)
        : [...currentList, letter];
      return { ...prev, [qId]: nextList };
    });
  };

  // Khi bấm nút Check đáp án từng câu -> Đánh dấu câu đó vào danh sách "Đã làm" ngay lập tức!
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

  // Nộp bài & Chấm điểm toàn bộ những câu đã làm
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

    // Lưu tất cả các câu có chọn đáp án vào bộ nhớ "Đã làm"
    const answeredIds = detailedQuestions
      .filter((q) => q.userAnswer !== '')
      .map((q) => q.id);
    storageService.markQuestionsCompleted(answeredIds);
    setCompletedSet(storageService.getCompletedSet());

    const totalCount = detailedQuestions.length;
    const correctCount = detailedQuestions.filter((q) => q.isCorrect).length;

    // Tính thống kê theo từng Domain
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
      // Fallback linear scale
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

  return (
    <div className="fixed inset-0 z-40 bg-[#060913] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* =================================================================== */}
      {/* 1. TOP BLUEBOOK HEADER BAR                                          */}
      {/* =================================================================== */}
      <header className="h-16 px-4 lg:px-8 bg-[#090D1A] border-b border-indigo-500/25 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Thoát</span>
          </button>

          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold text-white truncate">
              {activeCategory?.title || examConfig?.title || 'Digital SAT Practice'}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{currentQ.domain || 'Reading & Writing'}</span>
              <span>•</span>
              <span className="text-cyan-300 font-semibold">{currentQ.skill}</span>
            </div>
          </div>
        </div>

        {/* Đồng hồ đếm giờ ở giữa */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 flex items-center gap-2 font-mono text-xs sm:text-sm font-bold text-cyan-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            {showTimer ? <span>{formatTimer(elapsedSeconds)}</span> : <span>••:••</span>}
            <button
              type="button"
              onClick={() => setShowTimer(!showTimer)}
              className="text-slate-400 hover:text-white ml-1 cursor-pointer"
              title={showTimer ? 'Ẩn đồng hồ' : 'Hiện đồng hồ'}
            >
              {showTimer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Cụm công cụ: Lọc câu chưa làm + Máy tính Desmos + Bảng công thức + AI Tutor */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setInAppFilter((prev) => (prev === 'unanswered' ? 'all' : 'unanswered'))
            }
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              inAppFilter === 'unanswered'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Chỉ hiển thị những câu hỏi bạn chưa từng làm trước đây"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>{inAppFilter === 'unanswered' ? 'Đang lọc: Chưa làm' : 'Lọc chưa làm'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDesmosOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReferenceOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reference</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitExam}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài</span>
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. VÙNG LÀM BÀI CHIA 2 CỘT CHUẨN BLUEBOOK                           */}
      {/* =================================================================== */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* CỘT TRÁI: ĐOẠN VĂN / ĐỀ BÀI (PASSAGE) */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto p-6 lg:p-10 border-b md:border-b-0 md:border-r border-indigo-500/20 bg-[#070B16]">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Passage / Stimulus
              </span>
              {isAlreadyCompletedBefore && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3" /> Đã làm
                </span>
              )}
            </div>

            <div className="text-[15.5px] text-slate-100 leading-[1.85] font-serif whitespace-pre-line select-text">
              <MathRenderer
                text={currentQ.passage || currentQ.prompt || 'Đọc câu hỏi ở cột bên phải.'}
                image={currentQ.image || currentQ.figure}
                svg={currentQ.svg}
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: CÂU HỎI & LỰA CHỌN ĐÁP ÁN */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto p-6 lg:p-10 bg-[#0A1020]">
          <div className="max-w-xl mx-auto space-y-5">
            {/* Thanh số thứ tự câu + Mark for Review */}
            <div className="flex items-center justify-between bg-slate-900/90 px-3.5 py-2 rounded-xl border border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 font-mono text-xs font-black flex items-center justify-center">
                  {currentIdx + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFlaggedMap((prev) => ({ ...prev, [qId]: !prev[qId] }))
                  }
                  className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                    flaggedMap[qId] ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flag
                    className={`w-3.5 h-3.5 ${flaggedMap[qId] ? 'fill-amber-400' : ''}`}
                  />
                  <span>Mark for Review</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsAiTutorOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Hỏi AI Tutor</span>
              </button>
            </div>

            {/* Câu hỏi (Question Stem) */}
            <div className="text-[15.5px] font-serif text-white leading-relaxed">
              <MathRenderer text={currentQ.question} />
            </div>

            {/* Danh sách 4 đáp án A, B, C, D */}
            {optionEntries.length > 0 ? (
              <div className="space-y-3">
                {optionEntries.map(([letter, text]) => {
                  const isSelected = selectedAnswer === letter;
                  const isEliminated = (eliminatedMap[qId] || []).includes(letter);
                  const isCorrectOpt =
                    String(letter).trim().toUpperCase() ===
                    String(currentQ.correctAnswer).trim().toUpperCase();

                  let cardStyle =
                    'border-slate-700/80 bg-slate-900/75 text-slate-200 hover:border-cyan-400/50';
                  if (isSelected) {
                    cardStyle =
                      'border-2 border-cyan-400 bg-cyan-500/15 text-white shadow-[0_0_20px_rgba(34,211,238,0.15)]';
                  }
                  if (isChecked) {
                    if (isCorrectOpt) {
                      cardStyle =
                        'border-2 border-emerald-400 bg-emerald-950/40 text-white';
                    } else if (isSelected && !isCorrectOpt) {
                      cardStyle = 'border-2 border-rose-500 bg-rose-950/40 text-rose-100';
                    }
                  }

                  return (
                    <div
                      key={letter}
                      onClick={() => !isEliminated && handleSelectOption(letter)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition cursor-pointer ${cardStyle} ${
                        isEliminated ? 'opacity-40 line-through' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black'
                              : 'border-slate-500 text-slate-300 bg-slate-950'
                          }`}
                        >
                          {letter}
                        </span>
                        <div className="text-[14.5px] font-serif leading-relaxed">
                          <MathRenderer text={text} />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleToggleEliminate(e, letter)}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 shrink-0 cursor-pointer"
                        title="Gạch loại trừ đáp án này"
                      >
                        {isEliminated ? 'Bỏ gạch' : 'ABC'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Ô nhập đáp án tự luận (Grid-in Math) */
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase">
                  Nhập đáp án số hoặc phân số:
                </label>
                <input
                  type="text"
                  value={selectedAnswer}
                  onChange={(e) => handleSelectOption(e.target.value)}
                  placeholder="VD: 14, -3/4, 2.5..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-cyan-400/40 text-white font-mono text-base focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {/* Giải thích chi tiết hiện ra sau khi bấm Check */}
            {isChecked && (
              <div
                className={`p-5 rounded-2xl border space-y-2 ${
                  isCurrentCorrect
                    ? 'bg-emerald-950/35 border-emerald-400/40'
                    : 'bg-rose-950/35 border-rose-400/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    {isCurrentCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">Chính xác! (Đã lưu vào danh sách Đã làm)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-rose-300">
                          Chưa chính xác • Đáp án đúng là: {currentQ.correctAnswer}
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed pt-2 border-t border-white/10">
                  <MathRenderer text={currentQ.explanation} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. BOTTOM NAVIGATION BAR (BACK / CHECK / NEXT)                      */}
      {/* =================================================================== */}
      <footer className="h-16 px-4 lg:px-8 bg-[#090D1A] border-t border-indigo-500/25 flex items-center justify-between shrink-0">
        <div className="text-xs font-bold text-slate-400 hidden sm:block">
          Đã làm trong phiên:{' '}
          <strong className="text-cyan-300">{Object.keys(userAnswers).length}</strong> /{' '}
          {questions.length} câu
        </div>

        <button
          type="button"
          onClick={() => setIsPaletteOpen(!isPaletteOpen)}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-xs font-extrabold text-white cursor-pointer"
        >
          Question {currentIdx + 1} of {questions.length} ▴
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-extrabold text-white cursor-pointer transition"
          >
            Back
          </button>

          <button
            type="button"
            disabled={!selectedAnswer}
            onClick={handleCheckCurrentAnswer}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-md"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Check</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (currentIdx < questions.length - 1) {
                setCurrentIdx((i) => i + 1);
              } else {
                handleSubmitExam();
              }
            }}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white cursor-pointer transition shadow-md"
          >
            {currentIdx < questions.length - 1 ? 'Next' : 'Finish'}
          </button>
        </div>
      </footer>

      {/* Bảng chọn câu hỏi nhanh (Question Palette Popover) */}
      {isPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-extrabold text-white">
                Danh sách câu hỏi ({questions.length} câu)
              </h3>
              <button
                type="button"
                onClick={() => setIsPaletteOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const id = q.id || `q_${idx}`;
                const answered = Boolean(userAnswers[id]);
                const doneBefore = completedSet.has(String(id));
                const isCurr = idx === currentIdx;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setCurrentIdx(idx);
                      setIsPaletteOpen(false);
                    }}
                    className={`h-10 rounded-xl font-mono text-xs font-bold border flex items-center justify-center cursor-pointer transition ${
                      isCurr
                        ? 'ring-2 ring-cyan-400 border-cyan-300 bg-cyan-500/25 text-white'
                        : answered || doneBefore
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Các Modal phụ trợ */}
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
          setCurrentIdx(0);
          setUserAnswers({});
          setCheckedMap({});
        }}
      />
    </div>
  );
}