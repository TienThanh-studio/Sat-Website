import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Clock, Play, Zap, HelpCircle } from 'lucide-react';
import { DEFAULT_CATEGORIES, createAdaptiveExamSession } from '../services/questionService';
import CustomQuizModal from '../components/exam/CustomQuizModal';

export default function QuestionBankPage(props) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'exam' | 'practice' | 'math' | 'rw'
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomQuizOpen, setIsCustomQuizOpen] = useState(false);

  // Bộ lọc triệt để từng Tab
  const filteredCategories = useMemo(() => {
    return DEFAULT_CATEGORIES.filter((item) => {
      const matchSearch =
        (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.domain && item.domain.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      // 1. Tab Đề thi thật: CHỈ HIỆN ĐỀ FULL 2 MODULES
      if (activeTab === 'exam') {
        return item.isExam === true;
      }

      // 2. Tab Luyện tập: CHỈ HIỆN DẠNG BÀI LUYỆN TẬP VÀ MODULE LẺ
      if (activeTab === 'practice') {
        return item.isExam !== true;
      }

      // 3. Tab Math: CHỈ HIỆN CÂU HỎI LUYỆN TẬP TOÁN (ẨN HẾT ĐỀ THI THẬT)
      if (activeTab === 'math') {
        return item.section === 'Math' && item.isExam !== true;
      }

      // 4. Tab R&W: CHỈ HIỆN CÂU HỎI LUYỆN TẬP VERBAL (ẨN HẾT ĐỀ THI THẬT)
      if (activeTab === 'rw') {
        return item.section === 'Reading and Writing' && item.isExam !== true;
      }

      return true;
    });
  }, [activeTab, searchTerm]);

  // Xử lý click: Gọi linh hoạt mọi hàm callback được App truyền vào
  const handleLaunchItem = (item) => {
    if (typeof props.onSelectCategory === 'function') {
      props.onSelectCategory(item);
    } else if (typeof props.onStartRealExam === 'function' && item.isExam) {
      props.onStartRealExam(item);
    } else if (typeof props.onStartPractice === 'function') {
      props.onStartPractice(item);
    } else if (typeof props.onSelectExam === 'function') {
      props.onSelectExam(item);
    }
  };

  const handleLaunchAdaptive = (section) => {
    const session = createAdaptiveExamSession(section);
    handleLaunchItem(session);
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-6 md:p-10 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* BANNER THI THỬ THÍCH ỨNG 2 MODULES */}
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
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Ngân hàng Đề thi & Luyện tập ({filteredCategories.length})
              </h2>
              <p className="text-xs text-slate-500">
                {activeTab === 'exam' && 'Chỉ hiển thị các đề thi thử thật Full 2 Modules bắt buộc.'}
                {activeTab === 'practice' && 'Chỉ hiển thị bài luyện tập chuyên đề tự do và module lẻ.'}
                {activeTab === 'math' && 'Chỉ hiển thị câu hỏi và dạng bài luyện tập môn Math (không có đề thi thật).'}
                {activeTab === 'rw' && 'Chỉ hiển thị câu hỏi và dạng bài luyện tập môn Reading & Writing (không có đề thi thật).'}
                {activeTab === 'all' && 'Toàn bộ danh sách đề thi và câu hỏi luyện tập.'}
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
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              />
            </div>
          </div>

          {/* CÁC NÚT TAB */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exam')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'exam'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Đề thi thật
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'practice'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Luyện tập
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('math')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'math'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Math
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rw')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'rw'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              R&W
            </button>
          </div>
        </div>

        {/* LƯỚI DANH SÁCH BÀI THI / BÀI LUYỆN TẬP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((item) => {
            const isExam = item.isExam === true;
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
                      isExam
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isExam ? 'THI THẬT DIGITAL SAT' : 'LUYỆN TẬP TỰ DO'}
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
                    onClick={() => handleLaunchItem(item)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                      isExam
                        ? 'bg-[#b91c1c] hover:bg-red-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isExam ? 'Vào thi thật (2 Modules)' : 'Bắt đầu luyện tập ngay'}</span>
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
            handleLaunchItem(cfg);
          }}
        />

      </div>
    </div>
  );
}