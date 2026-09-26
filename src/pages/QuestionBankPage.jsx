import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Calculator, Sparkles, ArrowRight, 
  CheckCircle2, Search, Sliders, Cpu 
} from 'lucide-react';
import { questionService } from '../services/questionService';
import { adaptiveEngine } from '../services/adaptiveEngine';
import PerformanceRadar from '../components/analytics/PerformanceRadar';
import CustomQuizModal from '../components/exam/CustomQuizModal';

export default function QuestionBankPage({ onStartSession }) {
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const categories = useMemo(() => {
    return questionService.getCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const matchSection = selectedSection === 'ALL' || cat.section === selectedSection;
      const matchSearch = cat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cat.domain.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSection && matchSearch;
    });
  }, [categories, selectedSection, searchTerm]);

  // Khởi động bài thi thích ứng Adaptive 2 Modules
  const handleStartAdaptive = (section = 'Math') => {
    const session = adaptiveEngine.createAdaptiveSession(section);
    if (!session) {
      alert(`Chưa đủ câu hỏi môn ${section} để tạo đề thích ứng!`);
      return;
    }

    if (onStartSession) {
      onStartSession({
        sessionId: session.testId,
        title: `Digital SAT Official Simulation (${section} - Module 1)`,
        section: section,
        category: 'Adaptive Simulation',
        questions: session.module1Questions,
        duration: 2100, // 35 phút
        mode: 'REAL_EXAM',
        adaptiveSession: session
      });
    }
  };

  const handleStartCategory = (category) => {
    if (!category.questions || category.questions.length === 0) {
      alert('Chủ đề này đang được cập nhật câu hỏi!');
      return;
    }

    if (onStartSession) {
      onStartSession({
        sessionId: `practice_${category.id}_${Date.now()}`,
        title: `Luyện tập: ${category.title}`,
        section: category.section,
        category: category.title,
        questions: category.questions,
        duration: Math.max(category.questions.length * 90, 600),
        mode: 'PRACTICE'
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 select-text">
      
      {/* HEADER & THANH CÔNG CỤ TẠO ĐỀ NHANH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Ngân hàng câu hỏi chuẩn Digital SAT</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Hỗ trợ luyện tập theo kỹ năng, thi thích ứng Adaptive 2 Modules và tạo đề tự chọn.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleStartAdaptive('Math')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="Mô phỏng bài thi thích ứng chuẩn College Board"
          >
            <Cpu className="w-4 h-4" />
            <span>Thi thử Adaptive Math</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Tạo đề theo yêu cầu</span>
          </button>
        </div>
      </div>

      {/* BIỂU ĐỒ NĂNG LỰC & PHÂN TÍCH LỖ HỔNG (RADAR ANALYTICS) */}
      <PerformanceRadar onQuickPractice={(config) => onStartSession && onStartSession(config)} />

      {/* BỘ LỌC TABS THEO PHẦN THI */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSection('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedSection === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tất cả ({categories.length})</span>
            </button>

            <button
              onClick={() => setSelectedSection('Reading & Writing')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedSection === 'Reading & Writing'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reading & Writing</span>
            </button>

            <button
              onClick={() => setSelectedSection('Math')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedSection === 'Math'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Math</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm dạng bài, domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs w-60 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
            />
          </div>
        </div>

        {/* DANH SÁCH THẺ DẠNG BÀI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => {
            const isMath = cat.section === 'Math';
            const hasQuestions = cat.questionCount > 0;

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isMath 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {cat.domain}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {cat.questionCount} câu hỏi
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[11px] font-bold flex items-center gap-1 ${
                    hasQuestions ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {hasQuestions ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sẵn sàng</span>
                      </>
                    ) : (
                      <span>Đang cập nhật</span>
                    )}
                  </span>

                  <button
                    type="button"
                    disabled={!hasQuestions}
                    onClick={() => handleStartCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      hasQuestions
                        ? isMath
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Luyện tập</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL TẠO ĐỀ THEO YÊU CẦU */}
      <CustomQuizModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onStartQuiz={(config) => onStartSession && onStartSession(config)}
      />
    </div>
  );
}