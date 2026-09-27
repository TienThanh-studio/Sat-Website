import React, { useRef } from 'react';
import { Download, X, Award, CheckCircle, AlertTriangle, Lightbulb, FileText } from 'lucide-react';

export default function ScoreReportModal({ reportData, onClose }) {
  const printRef = useRef(null);

  if (!reportData) return null;

  const {
    studentName = 'Phan Tiến Thành',
    testTitle = 'PHASE 1.42 - SAT ĐGNL TEST 01',
    testDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    scoreRange = '570-590',
    totalScore = 580,
    totalQuestions = 54,
    correctAnswers = 37,
    incorrectAnswers = 17,
    omittedAnswers = 0,
    topStrengths = [
      { name: 'Text Structure', rate: '100%' },
      { name: 'Main Idea', rate: '100%' },
      { name: 'Transition', rate: '89%' }
    ],
    topWeaknesses = [
      { name: 'Cross Text', rate: '50%' },
      { name: 'Grammar', rate: '50%' },
      { name: 'Word In Context', rate: '50%' }
    ],
    domainStats = {
      rw: [
        { name: 'Information and Ideas', sub: 'Command of Evidence, Inference, Main Idea, Details', pct: '22% của bài, 12 câu', rate: 71 },
        { name: 'Craft and Structure', sub: 'Word in Context, Text Structure, Cross Text', pct: '31% của bài, 17 câu', rate: 67 },
        { name: 'Expression of Ideas', sub: 'Transition, Rhetorical Synthesis', pct: '28% của bài, 15 câu', rate: 80 },
        { name: 'Standard English Conventions', sub: 'Grammar', pct: '19% của bài, 10 câu', rate: 50 },
      ],
      math: [
        { name: 'Algebra', sub: 'Linear equations, inequalities, systems', pct: '35% của bài, 15 câu', rate: 85 },
        { name: 'Advanced Math', sub: 'Equivalent expressions, nonlinear equations', pct: '35% của bài, 15 câu', rate: 60 },
        { name: 'Problem-Solving and Data Analysis', sub: 'Ratios, percentages, probability, data', pct: '15% của bài, 8 câu', rate: 75 },
        { name: 'Geometry and Trigonometry', sub: 'Area, volume, angles, circles, trigonometry', pct: '15% của bài, 6 câu', rate: 66 },
      ]
    },
    feedback = {
      strengths: [
        'Bạn đạt kết quả rất tốt ở dạng TEXT STRUCTURE và MAIN IDEA với độ chính xác cao.',
        'Dạng TRANSITION cũng là thế mạnh với tỷ lệ đúng áp đảo, nắm chắc logic từ nối.',
        'Thời gian làm bài được phân bố hợp lý, hoàn thành đầy đủ các câu hỏi.'
      ],
      weaknesses: [
        'Dạng WORD IN CONTEXT và GRAMMAR tỉ lệ đúng chưa cao (50%), cần củng cố các cấu trúc câu phức.',
        'COMMAND OF EVIDENCE cần luyện thêm thao tác đối chiếu dữ liệu đối chứng.'
      ],
      advice: [
        'Dành 15 phút mỗi ngày đọc các đoạn văn học thuật để tăng vốn từ theo ngữ cảnh.',
        'Ôn tập kỹ các chủ điểm ngữ pháp cốt lõi: thì, phân từ, mệnh đề quan hệ và dấu câu.',
        'Luyện tập thêm các bài thi dài hơi để duy trì độ tập trung ở Module 2.'
      ]
    }
  } = reportData;

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Vùng Báo Cáo */}
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
        
        {/* Nút hành động */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
            <FileText className="w-5 h-5" />
            <span>Báo cáo phân tích kết quả bài thi</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT REPORT</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NỘI DUNG REPORT (Chuẩn bố cục bản in) */}
        <div ref={printRef} className="space-y-6 text-slate-800 font-sans">
          
          {/* Header Báo Cáo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
            <div>
              <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">VAC SAT Suite</span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
                Your Practice Score Report
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-1">{testTitle}</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-sm font-bold text-slate-800">Thí sinh: <span className="text-indigo-600">{studentName}</span></div>
              <div className="text-xs text-slate-400 mt-0.5">{testDate}</div>
            </div>
          </div>

          {/* Hàng 1: Tổng Điểm & Top Đúng/Sai */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Score Box */}
            <div className="p-5 bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl text-white flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">TOTAL SCORE</span>
                <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight mt-2">{scoreRange}</div>
              </div>
              <div className="text-[11px] text-indigo-200 font-medium pt-3 border-t border-white/20 mt-3">
                Score Range: 200–800 (Ước tính theo mô hình IRT)
              </div>
            </div>

            {/* 3 Dạng đúng nhiều nhất */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  3 DẠNG ĐÚNG NHIỀU NHẤT
                </span>
                <div className="space-y-2">
                  {topStrengths.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium truncate">{item.name}</span>
                      <span className="font-bold font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">{item.rate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3 Dạng sai nhiều nhất */}
            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  3 DẠNG SAI NHIỀU NHẤT
                </span>
                <div className="space-y-2">
                  {topWeaknesses.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium truncate">{item.name}</span>
                      <span className="font-bold font-mono text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">{item.rate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hàng 2: Knowledge & Skills Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">KNOWLEDGE AND SKILLS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reading and Writing Domains */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-indigo-700 block border-b border-slate-200 pb-1.5">
                  Reading and Writing
                </span>
                <div className="space-y-3">
                  {domainStats.rw.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{d.name}</span>
                        <span className="font-bold font-mono text-slate-700">{d.rate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${d.rate}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-400">{d.sub} ({d.pct})</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Math Domains */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-emerald-700 block border-b border-slate-200 pb-1.5">
                  Math
                </span>
                <div className="space-y-3">
                  {domainStats.math.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{d.name}</span>
                        <span className="font-bold font-mono text-slate-700">{d.rate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${d.rate}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-400">{d.sub} ({d.pct})</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hàng 3: Questions Overview */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-around gap-4 text-center">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Total Questions</span>
              <span className="text-2xl font-black font-mono">{totalQuestions}</span>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div>
              <span className="text-[11px] text-emerald-400 block font-medium">Correct Answers</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{correctAnswers}</span>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div>
              <span className="text-[11px] text-rose-400 block font-medium">Incorrect Answers</span>
              <span className="text-2xl font-black font-mono text-rose-400">{incorrectAnswers}</span>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div>
              <span className="text-[11px] text-amber-400 block font-medium">Omitted</span>
              <span className="text-2xl font-black font-mono text-amber-400">{omittedAnswers}</span>
            </div>
          </div>

          {/* Hàng 4: Nhận xét & Lời khuyên */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Ưu điểm
              </span>
              <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Cần cải thiện
              </span>
              <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                {feedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>

            <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-600" /> Lời khuyên
              </span>
              <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                {feedback.advice.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          </div>

          {/* Footer bản quyền */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            This practice score report is provided for personal diagnostic use to help prepare for test day. © 2026 Vietaccepted / SAT Prep Platform.
          </div>
        </div>
      </div>
    </div>
  );
}