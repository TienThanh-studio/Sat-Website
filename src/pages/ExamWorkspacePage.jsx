import React, { useState, useEffect } from 'react';
import PracticeMode from '../components/exam/PracticeMode';
import RealExamMode from '../components/exam/RealExamMode';
import { storageService } from '../services/storageService';
import { questionService } from '../services/questionService';
import { Timer, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ExamWorkspacePage({ sessionConfig, onExit }) {
  const [questions] = useState(sessionConfig.questions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(sessionConfig.duration || 1800);
  const [isFinished, setIsFinished] = useState(false);

  // Khôi phục session cũ nếu reload F5
  useEffect(() => {
    const saved = storageService.getExamSession();
    if (saved && saved.sessionId === sessionConfig.sessionId) {
      setAnswers(saved.answers || {});
      setMarkedQuestions(saved.markedQuestions || {});
      setTimeLeft(saved.timeLeft || 1800);
      setCurrentIndex(saved.currentIndex || 0);
    }
  }, [sessionConfig.sessionId]);

  // Tự động lưu tiến trình làm bài
  useEffect(() => {
    if (!isFinished && questions.length > 0) {
      storageService.saveExamSession({
        sessionId: sessionConfig.sessionId,
        answers,
        markedQuestions,
        timeLeft,
        currentIndex
      });
    }
  }, [answers, markedQuestions, timeLeft, currentIndex, isFinished, sessionConfig.sessionId, questions.length]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectAnswer = (qId, optionKey) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionKey
    }));

    // Trong chế độ Practice: nếu trả lời đúng câu hiện tại thì lưu ngay vào danh sách câu đúng thật
    const currentQ = questions.find(q => q.id === qId);
    if (sessionConfig.mode === 'PRACTICE' && currentQ && optionKey === currentQ.correctAnswer) {
      questionService.recordCorrectAnswer(qId);
    }
  };

  const handleToggleMark = (qId) => {
    setMarkedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleSubmitExam = () => {
    setIsFinished(true);
    storageService.clearExamSession();

    // Ghi nhận tất cả các câu đã trả lời đúng trong đề thi thật
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        questionService.recordCorrectAnswer(q.id);
      }
    });
  };

  if (isFinished) {
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correctCount++;
    });

    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-xl w-full p-8 rounded-2xl border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Hoàn thành bài thi!</h2>
          <p className="text-xs text-slate-500 mb-6">Kết quả làm bài đã được ghi nhận vào tiến độ của bạn.</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold block">Số câu đúng</span>
              <span className="text-xl font-black text-emerald-600">{correctCount} / {questions.length}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold block">Độ chính xác</span>
              <span className="text-xl font-black text-brand-800">
                {questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}%
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold block">Thời gian</span>
              <span className="text-xl font-black text-slate-700">{formatTime((sessionConfig.duration || 1800) - timeLeft)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="w-full py-3 bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Quay lại Ngân hàng câu hỏi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-white z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onExit} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-800 text-sm">{sessionConfig.title}</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
          <Timer className="w-4 h-4 text-slate-600" />
          <span className="font-mono font-bold text-xs text-slate-800">{formatTime(timeLeft)}</span>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
        >
          Save & Exit
        </button>
      </div>

      {sessionConfig.mode === 'PRACTICE' ? (
        <PracticeMode
          question={questions[currentIndex]}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          selectedAnswer={answers[questions[currentIndex]?.id]}
          onSelectAnswer={(key) => handleSelectAnswer(questions[currentIndex]?.id, key)}
          onNext={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
          onPrev={() => setCurrentIndex(i => Math.max(0, i - 1))}
          isMarked={!!markedQuestions[questions[currentIndex]?.id]}
          onToggleMark={() => handleToggleMark(questions[currentIndex]?.id)}
        />
      ) : (
        <RealExamMode
          questions={questions}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          answers={answers}
          onSelectAnswer={handleSelectAnswer}
          markedQuestions={markedQuestions}
          onToggleMark={handleToggleMark}
          onSubmitExam={handleSubmitExam}
        />
      )}
    </div>
  );
}