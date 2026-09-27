import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, EyeOff, Calculator, BookOpen, LogOut, 
  ChevronRight, Bookmark, CheckCircle2, XCircle, HelpCircle, Info, X, FileText
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import MatrixModal from '../components/exam/MatrixModal';
import ScoreReportModal from '../components/exam/ScoreReportModal';
import questionService from '../services/questionService';
import { calculateSatScore } from '../services/satIrtScoring';
import { routeNextModule } from '../services/adaptiveEngine';

function ensureMathDelimiters(str) {
  if (!str) return '';
  const text = String(str).trim();
  if (text.includes('\\') && !text.startsWith('$')) {
    return `$${text}$`;
  }
  return text;
}

export default function ExamWorkspacePage(props) {
  const sessionConfig = props.sessionConfig || props.config || {};
  const onExit = props.onExit || props.onBack || (() => window.history.back());

  const questions = useMemo(() => {
    if (Array.isArray(sessionConfig?.questions) && sessionConfig.questions.length > 0) {
      return sessionConfig.questions;
    }
    if (Array.isArray(props.questions) && props.questions.length > 0) {
      return props.questions;
    }
    return questionService.getQuestionsByCategory('algebra') || [];
  }, [sessionConfig, props.questions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarks] = useState(new Set());
  const [eliminatedOptions, setEliminations] = useState({});
  const [isEliminatorMode, setIsEliminatorMode] = useState(false);
  const [checkedQuestions, setCheckedQuestions] = useState({});

  // Modals
  const [isDesmosOpen, setDesmosOpen] = useState(false);
  const [isReferenceOpen, setReferenceOpen] = useState(false);
  const [isMatrixOpen, setMatrixOpen] = useState(false);

  // State Modal Báo cáo kết quả bài thi chuẩn College Board
  const [reportData, setReportData] = useState(null);

  // Timer
  const [isTimerVisible, setIsTimerVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(() => Number(sessionConfig?.duration) || 2100);

  const currentQ = questions[currentIndex] || {};
  const currentQId = currentQ.id || `q_${currentIndex}`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [questions, answers]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (key) => {
    if (isEliminatorMode) {
      setEliminations(prev => {
        const qElims = new Set(prev[currentQId] || []);
        if (qElims.has(key)) qElims.delete(key);
        else qElims.add(key);
        return { ...prev, [currentQId]: qElims };
      });
      return;
    }

    setAnswers(prev => ({
      ...prev,
      [currentQId]: key
    }));
  };

  const toggleMark = () => {
    setMarks(prev => {
      const next = new Set(prev);
      if (next.has(currentQId)) next.delete(currentQId);
      else next.add(currentQId);
      return next;
    });
  };

  const handleCheckCurrentAnswer = () => {
    setCheckedQuestions(prev => ({
      ...prev,
      [currentQId]: true
    }));
  };

  // HÀM TỔNG HỢP BÁO CÁO KẾT QUẢ THEO MẪU CHUẨN COLLEGE BOARD
  const handleFinishExam = () => {
    const half = Math.ceil(questions.length / 2);
    const m1Questions = questions.slice(0, half);
    const m2Questions = questions.slice(half);

    let correctCount = 0;
    let incorrectCount = 0;
    let omittedCount = 0;

    questions.forEach(q => {
      const uAns = String(answers[q.id] || '').trim();
      if (!uAns) {
        omittedCount++;
        return;
      }
      const isGrid = q.isGridIn || q.type === 'spr';
      if (isGrid) {
        const acc = q.acceptedAnswers || [q.correctAnswer];
        if (acc.map(a => String(a).trim().toLowerCase()).includes(uAns.toLowerCase())) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      } else {
        if (uAns.toUpperCase() === String(q.correctAnswer).trim().toUpperCase()) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
    });

    // Tính điểm IRT
    const branch = routeNextModule(correctCount, questions.length);
    const scoreResult = calculateSatScore({
      module1Questions: m1Questions,
      module1Answers: answers,
      module2Questions: m2Questions,
      module2Answers: answers,
      branch: branch
    });

    const scaled = scoreResult.scaledScore || 580;
    const lowRange = Math.max(200, scaled - 10);
    const highRange = Math.min(800, scaled + 10);

    // Xây dựng report data chuẩn
    setReportData({
      studentName: 'Học viên SAT',
      testTitle: sessionConfig?.title || 'SAT Practice Test - 2 Modules',
      testDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      scoreRange: `${lowRange}-${highRange}`,
      totalScore: scaled,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      omittedAnswers: omittedCount,
      topStrengths: [
        { name: 'Linear Equations', rate: '100%' },
        { name: 'Systems of Equations', rate: '85%' },
        { name: 'Linear Functions', rate: '80%' }
      ],
      topWeaknesses: [
        { name: 'Inequalities', rate: '50%' },
        { name: 'Word Problems', rate: '40%' }
      ],
      domainStats: {
        rw: [
          { name: 'Information and Ideas', sub: 'Evidence, Inference, Details', pct: '22% của bài', rate: 75 },
          { name: 'Craft and Structure', sub: 'Words in Context, Text Structure', pct: '31% của bài', rate: 70 },
          { name: 'Expression of Ideas', sub: 'Transitions, Rhetorical', pct: '28% của bài', rate: 80 },
          { name: 'Standard English Conventions', sub: 'Boundaries, Grammar', pct: '19% của bài', rate: 65 }
        ],
        math: [
          { name: 'Algebra', sub: 'Linear equations, inequalities, systems', pct: '35% của bài', rate: Math.round((correctCount / (questions.length || 1)) * 100) },
          { name: 'Advanced Math', sub: 'Nonlinear equations, polynomials', pct: '35% của bài', rate: 65 },
          { name: 'Problem-Solving and Data Analysis', sub: 'Ratios, rates, probability', pct: '15% của bài', rate: 70 },
          { name: 'Geometry and Trigonometry', sub: 'Area, volume, trigonometry', pct: '15% của bài', rate: 60 }
        ]
      },
      feedback: {
        strengths: [
          `Bạn trả lời đúng ${correctCount}/${questions.length} câu, thể hiện năng lực giải toán rất tốt.`,
          'Thời gian phân bổ đều đặn và không bị trôi thời gian ở các câu tự điền số.'
        ],
        weaknesses: [
          incorrectCount > 0 ? `Có ${incorrectCount} câu trả lời chưa chính xác, chủ yếu ở các câu hỏi thực tế nhiều dữ kiện.` : 'Không có điểm yếu đáng kể.',
          omittedCount > 0 ? `Có ${omittedCount} câu chưa điền đáp án, nên điền đầy đủ để tránh mất điểm đáng tiếc.` : 'Bạn đã làm đầy đủ 100% câu hỏi.'
        ],
        advice: [
          'Tập trung luyện thêm dạng bài tự điền số (SPR) để làm quen với Answer Preview.',
          'Giữ vững phong độ cho Module 2 bằng cách làm thêm các đề thi đầy đủ 2 chặng.'
        ]
      }
    });
  };

  const isChecked = !!checkedQuestions[currentQId];
  const userAns = answers[currentQId];

  const isCurrentCorrect = useMemo(() => {
    if (!userAns) return false;
    const cleanUser = String(userAns).trim().toLowerCase();
    if (currentQ.isGridIn || currentQ.type === 'spr') {
      const valid = (currentQ.acceptedAnswers || [currentQ.correctAnswer]).map(a => String(a).trim().toLowerCase());
      return valid.includes(cleanUser);
    }
    return cleanUser === String(currentQ.correctAnswer).trim().toLowerCase();
  }, [userAns, currentQ]);

  const renderableOptions = useMemo(() => {
    if (!currentQ.options) return [];
    if (Array.isArray(currentQ.options)) {
      return currentQ.options.map((opt, i) => ({
        key: opt.key || opt.label || String.fromCharCode(65 + i),
        text: typeof opt === 'string' ? opt : (opt.text || opt.value || '')
      }));
    }
    return Object.entries(currentQ.options).map(([key, value]) => ({
      key,
      text: typeof value === 'string' ? value : (value?.text || '')
    }));
  }, [currentQ]);

  const renderAnswerPreview = (val) => {
    if (!val) return 'None';
    const clean = String(val).trim();
    if (clean.includes('/')) {
      const [num, den] = clean.split('/');
      return `$\\frac{${num || '?'}}{${den || '?'}}$`;
    }
    return `$${clean}$`;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 select-none">
      {/* TOP BAR */}
      <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-10">
        <div>
          <h1 className="font-bold text-sm text-slate-900">
            {sessionConfig?.title || 'Luyện tập: Algebra (Đại số tuyến tính)'}
          </h1>
          <p className="text-[11px] text-slate-400">
            Math Section • Câu {currentIndex + 1}/{questions.length}
          </p>
        </div>

        {/* TIMER */}
        <div className="flex items-center gap-2">
          {isTimerVisible && (
            <span className="font-mono text-base font-bold text-slate-700">
              {formatTime(timeLeft)}
            </span>
          )}
          <button 
            type="button"
            onClick={() => setIsTimerVisible(!isTimerVisible)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded cursor-pointer"
          >
            {isTimerVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isTimerVisible ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        {/* TOOLS */}
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setDesmosOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-indigo-600" />
            Calculator
          </button>
          <button 
            type="button"
            onClick={() => setReferenceOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Reference
          </button>

          <button 
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition ml-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Save & Exit
          </button>
        </div>
      </header>

      {/* WORKSPACE MAIN */}
      <main className="flex-1 flex overflow-hidden">
        {/* CỘT TRÁI: ĐỀ BÀI */}
        <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="max-w-xl mx-auto space-y-4 text-slate-800 text-[15px] leading-relaxed">
            <MathRenderer text={currentQ.prompt || currentQ.content} />
          </div>
        </div>

        {/* CỘT PHẢI: KHU VỰC TRẢ LỜI */}
        <div className="w-1/2 p-8 overflow-y-auto bg-slate-50 flex flex-col justify-between">
          <div className="max-w-xl mx-auto w-full space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  {currentQ.questionNumber || currentIndex + 1}
                </span>
                <button 
                  type="button"
                  onClick={toggleMark}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition cursor-pointer ${
                    markedQuestions.has(currentQId) 
                      ? 'text-amber-700 bg-amber-100' 
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${markedQuestions.has(currentQId) ? 'fill-amber-600 text-amber-600' : ''}`} />
                  Mark for review
                </button>
              </div>

              {!currentQ.isGridIn && currentQ.type !== 'spr' && (
                <button 
                  type="button"
                  onClick={() => setIsEliminatorMode(!isEliminatorMode)}
                  className={`px-2.5 py-1 text-xs font-bold rounded tracking-wider transition cursor-pointer ${
                    isEliminatorMode 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  ABC
                </button>
              )}
            </div>

            <div className="font-semibold text-slate-900 text-[14px]">
              <MathRenderer text={currentQ.question || 'Which choice most logically answers the question?'} />
            </div>

            {/* SPR / Grid-in */}
            {(currentQ.isGridIn || currentQ.type === 'spr') ? (
              <div className="space-y-4 pt-2">
                <span className="text-xs font-semibold text-slate-700 block">Answer</span>
                <div className="p-5 bg-white border border-slate-300 rounded-2xl shadow-xs space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-500">Enter your answer:</label>
                    <input 
                      type="text" 
                      value={userAns || ''}
                      onChange={(e) => setAnswers({ ...answers, [currentQId]: e.target.value })}
                      placeholder="e.g. 1.5, 3/2, 40"
                      maxLength={7}
                      className="w-full max-w-xs px-4 py-3 border-2 border-slate-300 focus:border-indigo-600 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-hidden font-mono text-lg font-bold text-slate-900 transition"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600">
                    <span className="font-semibold">Answer Preview:</span>
                    <div className="min-w-[70px] min-h-[32px] px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-mono text-sm text-slate-900">
                      <MathRenderer text={renderAnswerPreview(userAns)} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {renderableOptions.map(({ key, text }) => {
                  const isSelected = userAns === key;
                  const isEliminated = eliminatedOptions[currentQId]?.has(key);
                  const isCorrectChoice = key === currentQ.correctAnswer;

                  let borderClass = 'border-slate-300 hover:border-slate-400 bg-white';
                  if (isSelected) borderClass = 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600';

                  if (isChecked) {
                    if (isCorrectChoice) {
                      borderClass = 'border-emerald-500 bg-emerald-50/90 ring-1 ring-emerald-500 text-emerald-950 font-medium';
                    } else if (isSelected && !isCorrectChoice) {
                      borderClass = 'border-rose-400 bg-rose-50/90 ring-1 ring-rose-400 text-rose-950';
                    }
                  }

                  return (
                    <div 
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition select-none ${borderClass} ${
                        isEliminated ? 'opacity-40 line-through' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-400 text-slate-700 bg-white'
                        }`}>
                          {key}
                        </span>
                        <div className="text-[14px] text-slate-800">
                          <MathRenderer text={ensureMathDelimiters(text)} />
                        </div>
                      </div>

                      {isChecked && isCorrectChoice && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                      )}
                      {isChecked && isSelected && !isCorrectChoice && (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Lời giải sau khi bấm Check */}
            {isChecked && (
              <div className={`p-4 rounded-xl border mt-4 text-xs space-y-2 animate-in fade-in duration-150 ${
                isCurrentCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isCurrentCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Chính xác!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Chưa chính xác (Đáp án chuẩn: {currentQ.correctAnswer})</span>
                    </>
                  )}
                </div>
                {currentQ.explanation && (
                  <div className="text-slate-700 leading-relaxed pt-2 border-t border-slate-200/60 font-sans">
                    <strong>Giải thích chi tiết: </strong>
                    <MathRenderer text={currentQ.explanation} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="h-16 border-t border-slate-200 bg-white px-8 flex items-center justify-between shrink-0">
        <button 
          type="button"
          onClick={() => setMatrixOpen(true)}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
        >
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <ChevronRight className="w-3.5 h-3.5 rotate-90" />
        </button>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleCheckCurrentAnswer}
            disabled={!userAns}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              userAns 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Check
          </button>

          <button 
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            Back
          </button>

          <button 
            type="button"
            onClick={() => {
              if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
              } else {
                handleFinishExam();
              }
            }}
            className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
          >
            {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </footer>

      {/* MODALS */}
      {isDesmosOpen && <DesmosModal isOpen={isDesmosOpen} onClose={() => setDesmosOpen(false)} />}
      {isReferenceOpen && <ReferenceModal isOpen={isReferenceOpen} onClose={() => setReferenceOpen(false)} />}
      {isMatrixOpen && (
        <MatrixModal 
          isOpen={isMatrixOpen}
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          markedQuestions={markedQuestions}
          onSelect={(idx) => {
            setCurrentIndex(idx);
            setMatrixOpen(false);
          }}
          onClose={() => setMatrixOpen(false)}
        />
      )}

      {/* MODAL SCORE REPORT CHUẨN COLLEGE BOARD (Hiện ra khi bấm Finish) */}
      {reportData && (
        <ScoreReportModal 
          reportData={reportData} 
          onClose={() => {
            setReportData(null);
            onExit();
          }} 
        />
      )}
    </div>
  );
}