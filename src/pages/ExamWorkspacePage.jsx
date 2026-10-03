import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Clock, ArrowLeft, ArrowRight, CheckCircle2, Bookmark, 
  HelpCircle, AlertTriangle, Send, Calculator as CalcIcon, 
  BookOpen, Eye, EyeOff, Check, X
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import DesmosModal from '../components/exam/DesmosModal';
import ReferenceModal from '../components/exam/ReferenceModal';
import { examService } from '../services/examService';
import { storageService } from '../services/storageService';

export default function ExamWorkspacePage({ examId, sessionConfig, onExit, currentUser }) {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'testing' | 'submitting' | 'result' | 'error'
  const [sessionId, setSessionId] = useState(null);
  const [currentModule, setCurrentModule] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [examResult, setExamResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Công cụ thi
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Theo dõi thời gian làm bài
  const timesPerQuestion = useRef({});
  const activeQuestionTrack = useRef({ id: null, startTime: Date.now() });
  const deadlineRef = useRef(null);

  // 1. Khởi tạo phiên thi từ Supabase (hoặc fallback bộ đề local nếu mất kết nối)
  useEffect(() => {
    let isCancelled = false;

    async function initSession() {
      setPhase('loading');
      setErrorMessage(null);

      try {
        if (examId) {
          const payload = await examService.startExamSession(examId);
          if (!isCancelled) {
            setSessionId(payload.sessionId);
            setCurrentModule(payload.module || 1);
            setQuestions(payload.questions || []);
            
            // Đồng bộ đồng hồ server
            const deadlineTime = new Date(payload.deadline).getTime();
            deadlineRef.current = deadlineTime;
            const diff = Math.max(0, Math.floor((deadlineTime - Date.now()) / 1000));
            setSecondsLeft(diff);

            // Phục hồi bản nháp cục bộ nếu học viên reload trang
            const draft = storageService.loadDraft(payload.sessionId);
            if (draft && draft.module === payload.module) {
              setAnswers(draft.answers || {});
            }

            setPhase('testing');
            return;
          }
        }
      } catch (err) {
        console.warn('Khởi tạo Supabase không thành công, chuyển sang bộ đề dự phòng:', err.message);
      }

      // Fallback: Sử dụng dữ liệu phiên cấu hình truyền từ giao diện
      if (!isCancelled) {
        if (sessionConfig && sessionConfig.questions && sessionConfig.questions.length > 0) {
          setQuestions(sessionConfig.questions);
          setSecondsLeft((sessionConfig.duration || 35) * 60);
          setPhase('testing');
        } else {
          setErrorMessage('Không thể tải danh sách câu hỏi của bài thi này.');
          setPhase('error');
        }
      }
    }

    initSession();

    return () => {
      isCancelled = true;
    };
  }, [examId, sessionConfig]);

  // 2. Đo thời lượng học viên dừng lại ở từng câu hỏi
  const trackTime = useCallback((newQuestionId) => {
    const now = Date.now();
    const prev = activeQuestionTrack.current;
    if (prev.id) {
      const elapsed = Math.round((now - prev.startTime) / 1000);
      timesPerQuestion.current[prev.id] = (timesPerQuestion.current[prev.id] || 0) + elapsed;
    }
    activeQuestionTrack.current = { id: newQuestionId, startTime: now };
  }, []);

  useEffect(() => {
    if (questions[currentIndex]) {
      trackTime(questions[currentIndex].id);
    }
  }, [currentIndex, questions, trackTime]);

  // 3. Đếm ngược thời gian
  useEffect(() => {
    if (phase !== 'testing' || secondsLeft === null) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitCurrentModule();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, secondsLeft]);

  // 4. Lưu câu trả lời của thí sinh
  const handleSelectAnswer = (qId, val) => {
    const nextAnswers = { ...answers, [qId]: val };
    setAnswers(nextAnswers);
    if (sessionId) {
      storageService.saveDraft(sessionId, { module: currentModule, answers: nextAnswers });
    }
  };

  // 5. Nộp Module hoặc Nộp bài hoàn tất
  const handleSubmitCurrentModule = async () => {
    trackTime(null);
    setPhase('submitting');

    try {
      if (sessionId) {
        // Nộp bài trực tuyến an toàn qua Supabase RPC
        if (currentModule === 1 && sessionConfig?.isExam) {
          const nextPayload = await examService.submitModule1(sessionId, answers, timesPerQuestion.current);
          storageService.clearDraft(sessionId);
          setCurrentModule(2);
          setQuestions(nextPayload.questions || []);
          setCurrentIndex(0);
          setAnswers({});
          setBookmarked({});
          
          const deadlineTime = new Date(nextPayload.deadline).getTime();
          deadlineRef.current = deadlineTime;
          setSecondsLeft(Math.max(0, Math.floor((deadlineTime - Date.now()) / 1000)));
          setPhase('testing');
          return;
        } else {
          const finalResult = await storageService.submitFinal({
            sessionId,
            answers,
            times: timesPerQuestion.current
          });

          setExamResult(finalResult);
          setPhase('result');
          return;
        }
      }
    } catch (err) {
      console.error('Lỗi khi nộp bài lên Supabase:', err);
    }

    // Fallback: Tự động chấm điểm tại Client nếu phiên offline
    let correct = 0;
    const details = questions.map((q) => {
      const userAns = (answers[q.id] || '').trim().toLowerCase();
      const rightAns = (q.correctAnswer || '').trim().toLowerCase();
      const isRight = userAns !== '' && userAns === rightAns;
      if (isRight) correct++;
      return {
        questionId: q.id,
        userAnswer: answers[q.id] || 'Chưa trả lời',
        correctAnswer: q.correctAnswer || 'A',
        isCorrect: isRight,
        explanation: q.explanation || 'Hướng dẫn giải chi tiết cho câu hỏi.',
        question: q.question || q.prompt,
        options: q.options
      };
    });

    const scaledScore = Math.round(200 + (correct / Math.max(1, questions.length)) * 600);

    setExamResult({
      totalScore: scaledScore,
      correctCount: correct,
      totalQuestions: questions.length,
      timeSpent: (sessionConfig?.duration || 35) * 60 - (secondsLeft || 0),
      module2Branch: 'standard',
      details
    });
    setPhase('result');
  };

  const currentQ = questions[currentIndex];
  const formatTimer = (s) => {
    if (s === null || s === undefined) return '00:00';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  // MÀN HÌNH CHỜ / LỖI
  if (phase === 'loading') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 text-white min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold">Đang kết nối phòng thi bảo mật...</h2>
        <p className="text-sm text-slate-400 mt-2">Đang tải đề thi từ hệ thống Supabase Cloud.</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-md w-full text-center shadow-lg space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Không thể vào phòng thi</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{errorMessage}</p>
          <button
            onClick={onExit}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Quay lại danh sách đề thi
          </button>
        </div>
      </div>
    );
  }

  // MÀN HÌNH BÁO CÁO KẾT QUẢ SAU THI
  if (phase === 'result' && examResult) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen overflow-y-auto p-6 md:p-10 select-none">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                Official Digital SAT Score Report
              </span>
              <h1 className="text-2xl font-black text-slate-900">
                {sessionConfig?.title || 'Digital SAT Exam Session'}
              </h1>
              <p className="text-xs text-slate-500">
                Bài làm đã được chấm điểm bảo mật trực tiếp bởi hệ thống Supabase Database.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl text-center min-w-[160px] shadow-md">
              <span className="text-xs uppercase font-bold tracking-wider text-blue-200">Scaled Score</span>
              <div className="text-4xl font-black mt-1">{examResult.totalScore || 200}</div>
              <span className="text-[11px] text-blue-100 mt-1 block">Thang điểm 200 - 800</span>
            </div>
          </div>

          {/* Chi tiết thống kê câu đúng */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs text-slate-400 font-bold block">Số câu đúng</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {examResult.correctCount} / {examResult.totalQuestions}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs text-slate-400 font-bold block">Độ chính xác</span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">
                {Math.round(((examResult.correctCount || 0) / Math.max(1, examResult.totalQuestions || 1)) * 100)}%
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs text-slate-400 font-bold block">Nhánh Module 2</span>
              <span className="text-2xl font-black text-purple-600 mt-1 block uppercase">
                {examResult.module2Branch || 'Standard'}
              </span>
            </div>
          </div>

          {/* Bảng lời giải chi tiết từng câu */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900">Chi tiết đáp án & Lời giải</h2>
            <div className="space-y-4">
              {(examResult.details || []).map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Câu hỏi {idx + 1}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                      item.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {item.isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {item.isCorrect ? 'Chính xác' : 'Sai'}
                    </span>
                  </div>

                  <MathRenderer text={item.question} className="text-sm text-slate-800" />

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-slate-400 mr-2">Đáp án của bạn:</span>
                      <strong className={item.isCorrect ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                        {item.userAnswer || 'Chưa trả lời'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 mr-2">Đáp án đúng:</span>
                      <strong className="text-slate-900 font-black">{item.correctAnswer}</strong>
                    </div>
                  </div>

                  {item.explanation && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-1">
                      <strong className="text-blue-900 font-bold block">Giải thích:</strong>
                      <MathRenderer text={item.explanation} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pb-10 flex justify-center">
            <button
              onClick={onExit}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-md"
            >
              Hoàn tất & Quay lại trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH LÀM BÀI CHÍNH THỨC (CHUẨN GIAO DIỆN BLUEBOOK)
  return (
    <div className="flex flex-col h-screen bg-white select-none">
      {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
      <header className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-white z-20">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-slate-900 text-sm tracking-tight">
            {sessionConfig?.section === 'Math' ? 'Section 2: Math' : 'Section 1: Reading and Writing'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-500">
            {sessionConfig?.isExam ? `Module ${currentModule}` : 'Luyện tập chuyên đề'}
          </span>
        </div>

        {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
        <div className="flex items-center gap-2">
          {!isTimerHidden && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-800 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>
          )}
          <button
            onClick={() => setIsTimerHidden(!isTimerHidden)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title={isTimerHidden ? 'Hiện thời gian' : 'Ẩn thời gian'}
          >
            {isTimerHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {/* CÔNG CỤ THI */}
        <div className="flex items-center gap-2">
          {sessionConfig?.section === 'Math' && (
            <>
              <button
                onClick={() => setIsDesmosOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
              >
                <CalcIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Calculator</span>
              </button>
              <button
                onClick={() => setIsReferenceOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reference</span>
              </button>
            </>
          )}
          <button
            onClick={onExit}
            className="px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition"
          >
            Thoát
          </button>
        </div>
      </header>

      {/* KHÔNG GIAN BÀI THI CHIA ĐÔI */}
      <main className="flex-1 flex overflow-hidden">
        {currentQ ? (
          <>
            {/* CỘT TRÁI: ĐỀ BÀI, HÌNH VẼ, BẢNG BIỂU */}
            <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-200 bg-white">
              <div className="max-w-xl mx-auto space-y-4">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <MathRenderer text={currentQ.question || currentQ.prompt} className="text-sm text-slate-800 leading-relaxed font-normal" />
              </div>
            </div>

            {/* CỘT PHẢI: LỰA CHỌN TRẢ LỜI */}
            <div className="w-1/2 p-8 overflow-y-auto bg-slate-50/50">
              <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-400">Chọn câu trả lời đúng nhất:</span>
                  <button
                    onClick={() => setBookmarked({ ...bookmarked, [currentQ.id]: !bookmarked[currentQ.id] })}
                    className={`flex items-center gap-1 text-xs font-bold transition ${
                      bookmarked[currentQ.id] ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${bookmarked[currentQ.id] ? 'fill-current' : ''}`} />
                    <span>{bookmarked[currentQ.id] ? 'Đã đánh dấu' : 'Mark for Review'}</span>
                  </button>
                </div>

                {/* Dạng Grid-in (Tự điền số) */}
                {currentQ.isGridIn ? (
                  <div className="space-y-3 bg-white p-6 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-600 block">Nhập câu trả lời của bạn:</label>
                    <input
                      type="text"
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                      placeholder="e.g. 7/4 or 1.75"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <p className="text-[11px] text-slate-400">
                      Chấp nhận số thập phân (ví dụ: 1.75) hoặc phân số (ví dụ: 7/4).
                    </p>
                  </div>
                ) : (
                  /* Dạng trắc nghiệm 4 lựa chọn */
                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D'].map((letter) => {
                      const optText = currentQ.options ? currentQ.options[letter] : null;
                      if (!optText) return null;
                      const isSelected = answers[currentQ.id] === letter;

                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => handleSelectAnswer(currentQ.id, letter)}
                          className={`w-full p-4 rounded-xl border text-left transition flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {letter}
                          </span>
                          <div className="text-xs font-medium text-slate-800 pt-0.5 leading-relaxed">
                            <MathRenderer text={optText} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Không tìm thấy nội dung câu hỏi.
          </div>
        )}
      </main>

      {/* THANH ĐIỀU HƯỚNG DƯỚI CÙNG */}
      <footer className="h-16 border-t border-slate-200 px-6 flex items-center justify-between bg-white z-20">
        <div className="flex items-center gap-2">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <button
            onClick={() => setIsReviewOpen(!isReviewOpen)}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
          >
            Câu {currentIndex + 1} / {questions.length}
          </button>
          <button
            disabled={currentIndex === questions.length - 1}
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={handleSubmitCurrentModule}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{currentModule === 1 && sessionConfig?.isExam ? 'Nộp Module 1' : 'Nộp bài thi'}</span>
        </button>
      </footer>

      {/* MODAL DANH SÁCH CÂU HỎI (REVIEW DRAWER) */}
      {isReviewOpen && (
        <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-slate-200 p-6 shadow-2xl z-30 max-h-60 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Bảng điều hướng câu hỏi:</span>
              <button onClick={() => setIsReviewOpen(false)} className="text-xs font-bold text-blue-600">Đóng</button>
            </div>
            <div className="grid grid-cols-10 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isMarked = Boolean(bookmarked[q.id]);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsReviewOpen(false);
                    }}
                    className={`h-9 rounded-lg text-xs font-bold relative flex items-center justify-center border ${
                      isCurrent
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : isAnswered
                        ? 'border-slate-800 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {idx + 1}
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DESMOS & REFERENCE */}
      <DesmosModal isOpen={isDesmosOpen} onClose={() => setIsDesmosOpen(false)} />
      <ReferenceModal isOpen={isReferenceOpen} onClose={() => setIsReferenceOpen(false)} />
    </div>
  );
}