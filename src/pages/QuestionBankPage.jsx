import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Search, Zap, CheckCircle2, 
  ArrowRight, Sparkles, Filter, Layers
} from 'lucide-react';
import questionService from '../services/questionService';
import { adaptiveEngine } from '../services/adaptiveEngine';

export default function QuestionBankPage({ onStartExam, onStartSession }) {
  // Hàm tương thích cho cả 2 kiểu prop gọi vào phòng thi
  const startExamHandler = onStartExam || onStartSession || (() => {});

  const [activeSection, setActiveSection] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Lấy toàn bộ danh mục từ questionService
  const categories = useMemo(() => {
    return questionService.getCategories() || [];
  }, []);

  // Lọc theo Section và ô tìm kiếm
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchSection = 
        activeSection === 'ALL' || 
        cat.section === activeSection ||
        (activeSection === 'Full Test' && cat.section === 'Full Test');

      const matchSearch = 
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchSection && matchSearch;
    });
  }, [categories, activeSection, searchQuery]);

  // Bắt đầu làm bài theo Category được chọn
  const handleStartCategory = (cat) => {
    if (!cat.questions || cat.questions.length === 0) {
      alert('Danh mục này hiện chưa có câu hỏi nào!');
      return;
    }

    startExamHandler({
      id: cat.id,
      title: cat.title,
      section: cat.section,
      duration: cat.section === 'Full Test' ? 32 * 60 : cat.questions.length * 90, // Full Test: 32 phút, Luyện tập: 90s/câu
      questions: cat.questions
    });
  };

  // Khởi động bài thi thích ứng Adaptive Math
  const handleStartAdaptive = () => {
    const session = adaptiveEngine.createAdaptiveSession('Math');
    if (session) {
      startExamHandler(session);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* BANNER HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kho luyện thi Digital SAT Chuẩn hóa</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Ngân hàng đề thi & Chuyên đề</h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Hơn 500+ câu hỏi phân hóa cao theo từng Domain chuẩn College Board, kèm các bộ đề tuyển chọn nâng cao 27 câu sát đề thi thật.
          </p>
        </div>

        <div className="z-10 shrink-0">
          <button
            type="button"
            onClick={handleStartAdaptive}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Thi thử Adaptive Math (2 Chặng)</span>
          </button>
        </div>
      </div>

      {/* THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC TAB */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Bộ lọc Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveSection('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSection === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả danh mục
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('Full Test')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'Full Test'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <span>⭐ Đề thi nâng cao (27 câu)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('Reading & Writing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSection === 'Reading & Writing'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Reading & Writing
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('Math')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSection === 'Math'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Math
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm dạng bài, chuyên đề..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
      </div>

      {/* DANH SÁCH THẺ CHUYÊN ĐỀ & BỘ ĐỀ */}
      {filteredCategories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600">Không tìm thấy chủ đề nào phù hợp</p>
          <p className="text-xs text-slate-400 mt-1">Thử chọn tab khác hoặc đổi từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => {
            const isFullTest = cat.section === 'Full Test';
            const count = cat.questionCount ?? (cat.questions?.length || 0);

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition hover:shadow-md ${
                  isFullTest ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        isFullTest
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : cat.section === 'Math'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {cat.domain}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {count} câu
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{cat.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {isFullTest ? 'Thời lượng: 32 phút' : 'Tự luyện theo nhịp độ'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleStartCategory(cat)}
                    disabled={count === 0}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                      count === 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isFullTest
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                        : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-xs'
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
      )}
    </div>
  );
}