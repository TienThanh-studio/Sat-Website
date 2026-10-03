import React from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, Award } from 'lucide-react';
import MathRenderer from '../common/MathRenderer';

export default function ScoreReportModal({
  isOpen,
  onClose,
  reportData,
  onRetry
}) {
  if (!isOpen || !reportData) return null;

  const {
    scaledScore = 400,
    score = 400,
    section = 'Reading & Writing',
    module2Path = 'Standard',
    totalQuestions = 33,
    correctCount = 0,
    questions = []
  } = reportData;

  const finalScore = scaledScore || score;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 md:p-10 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        
        {/* THANH ĐIỀU HƯỚNG NHANH TRÊN CÙNG ĐỂ THOÁT NGAY LẬP TỨC */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Quay lại trang chủ</span>
          </button>

          <div className="flex items-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại bài này</span>
              </button>
            )}
          </div>
        </div>

        {/* HERO CARD BÁO CÁO ĐIỂM */}
        <div className="p-8 border-b border-slate-100">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Award className="w-3.5 h-3.5" />
                Official Digital SAT Score Report
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {section} (Full Adaptive Modules)
              </h1>
              <p className="text-xs text-slate-500">
                Bài làm đã kết thúc và được chấm điểm an toàn bởi hệ thống máy chủ.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-xl min-w-[200px] text-center">
              <span className="text-[11px] font-bold tracking-widest text-blue-200 uppercase block mb-1">
                SCALED SCORE
              </span>
              <span className="text-5xl font-black font-mono tracking-tight block">
                {finalScore}
              </span>
              <span className="text-[11px] text-blue-200 font-medium block mt-1">
                Thang điểm 200 - 800
              </span>
            </div>
          </div>

          {/* THỐNG KÊ CHI TIẾT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">Số câu đúng</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {correctCount} / {totalQuestions}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">Độ chính xác</span>
              <span className="text-2xl font-black text-blue-600 font-mono">
                {accuracy}%
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">Nhánh Module 2</span>
              <span className="text-2xl font-black text-purple-700 tracking-wide uppercase">
                {module2Path}
              </span>
            </div>
          </div>
        </div>

        {/* CHI TIẾT TỪNG CÂU HỎI */}
        <div className="p-8 bg-slate-50/50 space-y-4">
          <h2 className="text-lg font-black text-slate-900 mb-4">Chi tiết đáp án & Lời giải</h2>

          {questions.map((q, idx) => {
            const isCorrect = q.isCorrect;
            return (
              <div 
                key={q.id || idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    CÂU HỎI {idx + 1}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                    isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : '✕'}
                    <span>{isCorrect ? 'Chính xác' : 'Chưa đúng'}</span>
                  </span>
                </div>

                <div className="text-sm font-medium text-slate-800 leading-relaxed font-serif">
                  <MathRenderer text={q.prompt || q.passage || q.question || ''} />
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-bold pt-2 border-t border-slate-100">
                  <span className="text-slate-500">
                    Đáp án của bạn: <span className={isCorrect ? 'text-emerald-600' : 'text-red-600'}>{q.userAnswer || '(Bỏ trống)'}</span>
                  </span>
                  <span className="text-slate-500">
                    Đáp án đúng: <span className="text-emerald-700">{q.correctAnswer}</span>
                  </span>
                </div>

                {q.explanation && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-700 block mb-0.5">Giải thích:</span>
                    <MathRenderer text={q.explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}