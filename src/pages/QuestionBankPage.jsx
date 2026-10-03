import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Clock, Play, Zap, HelpCircle, Calculator, Sparkles } from 'lucide-react';
import { DEFAULT_CATEGORIES, createAdaptiveExamSession } from '../services/questionService';
import CustomQuizModal from '../components/exam/CustomQuizModal';

// Tải bộ câu hỏi Real-test từ file dữ liệu
import realVerbalQuestions from '../data/questions/real_verbal_bank.json';
import realMathQuestions from '../data/questions/real_math_bank.json';

export default function QuestionBankPage(props) {
  // Quản lý tab: 'all' | 'exam' | 'practice' | 'real_verbal' | 'real_math' | 'math' | 'rw'
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomQuizOpen, setIsCustomQuizOpen] = useState(false);

  // Kích hoạt bài thi / buổi luyện tập
  const launchExamSession = (rawItem) => {
    const questionsList = Array.isArray(rawItem.questions) && rawItem.questions.length > 0
      ? rawItem.questions
      : Array.isArray(rawItem.module1) && rawItem.module1.length > 0
      ? rawItem.module1
      : [];

    const examConfig = {
      ...rawItem,
      id: rawItem.id || `session_${Date.now()}`,
      title: rawItem.title || 'SAT Practice Session',
      section: rawItem.section || 'Reading and Writing',
      questions: questionsList,
      module1: rawItem.module1 || questionsList,
      module2: rawItem.module2 || questionsList,
      isRealExam: rawItem.isExam === true,
      mode: rawItem.isExam ? 'exam' : 'practice',
      duration: rawItem.duration || (rawItem.section === 'Math' ? 35 : 32)
    };

    if (typeof props.onStartExam === 'function') {
      props.onStartExam(examConfig);
    } else if (typeof props.onStartPractice === 'function') {
      props.onStartPractice(examConfig);
    } else if (typeof props.onStartRealExam === 'function') {
      props.onStartRealExam(examConfig);
    } else if (typeof props.onSelectCategory === 'function') {
      props.onSelectCategory(examConfig);
    }
  };

  // Danh mục đầy đủ: Gộp cả DEFAULT_CATEGORIES gốc và 2 danh mục Real-test mới
  const allMergedCategories = useMemo(() => {
    const realItems = [
      {
        id: 'real_test_verbal_bank',
        title: 'Real-test Verbal (Đề thi thật trích xuất)',
        domain: 'Reading & Writing',
        section: 'Reading and Writing',
        description: 'Tổng hợp 27 câu hỏi Reading & Writing trích xuất trực tiếp từ đề thi thật Digital SAT chuẩn College Board.',
        questions: realVerbalQuestions,
        isExam: false,
        isRealTest: true,
        categoryType: 'real_verbal'
      },
      {
        id: 'real_test_math_bank',
        title: 'Real-test Math (Đề thi thật trích xuất)',
        domain: 'Math',
        section: 'Math',
        description: 'Tổng hợp 22 câu hỏi Toán học trích xuất trực tiếp từ đề thi thật Digital SAT kèm công thức KaTeX và biểu đồ số liệu.',
        questions: realMathQuestions,
        isExam: false,
        isRealTest: true,
        categoryType: 'real_math'
      }
    ];

    return [...realItems, ...DEFAULT_CATEGORIES];
  }, []);

  // Bộ lọc theo Tab và từ khóa tìm kiếm
  const filteredCategories = useMemo(() => {
    return allMergedCategories.filter((item) => {
      const matchSearch =
        (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.domain && item.domain.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      // 1. Tab Đề thi thật: Chỉ hiện các đề Full 2 Modules
      if (activeTab === 'exam') {
        return item.isExam === true;
      }

      // 2. Tab Luyện tập tự do
      if (activeTab === 'practice') {
        return item.isExam !== true;
      }

      // 3. Tab Real-test Verbal
      if (activeTab === 'real_verbal') {
        return item.categoryType === 'real_verbal';
      }

      // 4. Tab Real-test Math
      if (activeTab === 'real_math') {
        return item.categoryType === 'real_math';
      }

      // 5. Tab Math chung
      if (activeTab === 'math') {
        return item.section === 'Math' && item.isExam !== true;
      }

      // 6. Tab R&W chung
      if (activeTab === 'rw') {
        return item.section === 'Reading and Writing' && item.isExam !== true;
      }

      return true;
    });
  }, [allMergedCategories, activeTab, searchTerm]);

  const handleLaunchAdaptive = (section) => {
    const session = createAdaptiveExamSession(section);
    launchExamSession(session);
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-6 md:p-10 select-none font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* BANNER THI THỬ THÍCH ỨNG 2 MODULES GỐC */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
          <div className="max-w-xl space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Digital SAT Multistage Adaptive Engine
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Thi thử thích ứng chuẩn College Board
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Mô phỏng đầy đủ 2 chặng: Module 1 định tuyến tự động sang Module 2 (Hard / Easy) theo tỷ lệ chính xác. Bấm giờ chuẩn và chấm điểm IRT 200 - 800.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => handleLaunchAdaptive('Reading and Writing')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Thi R&W (32 phút)</span>
              </button>
              <button
                type="button"
                onClick={() => handleLaunchAdaptive('Math')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition border border-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Thi Math (35 phút)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCustomQuizOpen(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/10 flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tùy chỉnh đề</span>
              </button>
            </div>
          </div>
        </div>

        {/* BỘ LỌC TÌM KIẾM & PHÂN LOẠI TAB */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Ngân hàng Đề thi & Luyện tập ({filteredCategories.length})
                </h2>
                {activeTab.startsWith('real_') && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Đề thi thật
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'exam' && 'Chỉ hiển thị các đề thi thử thật Full 2 Modules bắt buộc.'}
                {activeTab === 'practice' && 'Chỉ hiển thị bài luyện tập chuyên đề tự do và module lẻ.'}
                {activeTab === 'real_verbal' && 'Chỉ hiển thị câu hỏi Reading & Writing trích xuất từ đề thi thật.'}
                {activeTab === 'real_math' && 'Chỉ hiển thị câu hỏi Math trích xuất từ đề thi thật.'}
                {activeTab === 'math' && 'Chỉ hiển thị bài luyện tập môn Math.'}
                {activeTab === 'rw' && 'Chỉ hiển thị bài luyện tập môn Reading & Writing.'}
                {activeTab === 'all' && 'Toàn bộ danh sách đề thi, bài luyện tập và câu hỏi thi thật.'}
              </p>
            </div>

            {/* Ô TÌM KIẾM */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm đề hoặc chủ đề..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
            </div>
          </div>

          {/* CÁC NÚT TAB ĐIỀU HƯỚNG */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('real_verbal')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'real_verbal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Real-test Verbal ({realVerbalQuestions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('real_math')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'real_math'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Real-test Math ({realMathQuestions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exam')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'exam'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Đề thi thật (Full)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'practice'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Luyện tập
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('math')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'math'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Math
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rw')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'rw'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              R&W
            </button>
          </div>
        </div>

        {/* LƯỚI DANH SÁCH BÀI THI / DANH MỤC */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((item) => {
            const isExam = item.isExam === true;
            const isReal = item.isRealTest === true;
            const qCount = item.questions ? item.questions.length : 0;
            const isMath = item.section === 'Math';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-lg transition group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      isReal
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : isExam
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isReal ? 'REAL-TEST DATABASE' : isExam ? 'THI THẬT DIGITAL SAT' : 'LUYỆN TẬP TỰ DO'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {isMath ? 'Math' : 'Reading & Writing'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      {isExam ? 'Đủ 2 Modules' : `${qCount} câu hỏi`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {isExam ? (isMath ? '35 phút / mod' : '32 phút / mod') : 'Đếm tăng tự do'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => launchExamSession(item)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                      isReal
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : isExam
                        ? 'bg-[#b91c1c] hover:bg-red-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>
                      {isReal
                        ? `Luyện tập ngay (${qCount} câu)`
                        : isExam
                        ? 'Vào thi thật (2 Modules)'
                        : 'Bắt đầu luyện tập ngay'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL TỰ TẠO ĐỀ */}
        <CustomQuizModal
          isOpen={isCustomQuizOpen}
          onClose={() => setIsCustomQuizOpen(false)}
          onStartQuiz={(cfg) => {
            setIsCustomQuizOpen(false);
            launchExamSession(cfg);
          }}
        />

      </div>
    </div>
  );
}