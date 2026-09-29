import React, { useState, useMemo } from 'react';
import { 
  Layers, Search, Filter, Play, Sparkles, Clock, 
  HelpCircle, CheckCircle2, Bookmark, Flame, Zap
} from 'lucide-react';
import { DEFAULT_CATEGORIES, createAdaptiveExamSession } from '../services/questionService';

export default function QuestionBankPage({ onStartExam, onStartSession }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL', 'EXAM', 'PRACTICE', 'MATH', 'RW'
  const [searchTerm, setSearchTerm] = useState('');

  // Hỗ trợ cả 2 prop điều hướng phòng thi
  const startSession = onStartExam || onStartSession;

  const filteredCategories = useMemo(() => {
    return DEFAULT_CATEGORIES.filter(cat => {
      const matchSearch = cat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cat.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cat.description.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (selectedFilter === 'ALL') return true;
      if (selectedFilter === 'EXAM') return cat.isRealExam;
      if (selectedFilter === 'PRACTICE') return !cat.isRealExam;
      if (selectedFilter === 'MATH') return cat.section === 'Math' || cat.domain === 'Math';
      if (selectedFilter === 'RW') return cat.section !== 'Math' && cat.domain !== 'Math';

      return true;
    });
  }, [searchTerm, selectedFilter]);

  // Bắt đầu bài thi ngẫu nhiên Adaptive Test
  const handleStartAdaptive = (section = 'Reading & Writing') => {
    const session = createAdaptiveExamSession(section);
    if (typeof startSession === 'function') {
      startSession(session);
    }
  };

  // Bắt đầu làm bài từ thẻ đề cụ thể
  const handleStartItem = (cat) => {
    if (typeof startSession === 'function') {
      startSession({
        id: cat.id,
        title: cat.title,
        domain: cat.domain,
        section: cat.section,
        isRealExam: cat.isRealExam,
        duration: cat.duration,
        questions: cat.questions || []
      });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 font-sans select-none pb-12">
      {/* 1. BANNER BÀI THI THÍCH ỨNG ADAPTIVE CHUẨN */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Digital SAT Multistage Adaptive Engine</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Thi thử thích ứng ngẫu nhiên
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Hệ thống tự động nhặt ngẫu nhiên các câu hỏi từ kho đề theo tỉ lệ chuẩn phân hóa 30% Dễ - 40% Vừa - 30% Khó. Bấm giờ chuẩn College Board (Reading & Writing 32 phút, Math 35 phút).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={() => handleStartAdaptive('Reading & Writing')}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Thi R&W (32 phút)</span>
          </button>
          <button
            type="button"
            onClick={() => handleStartAdaptive('Math')}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Thi Math (35 phút)</span>
          </button>
        </div>
      </div>

      {/* 2. THANH TÌM KIẾM & BỘ LỌC DANH MỤC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">
            Ngân hàng Đề thi & Luyện tập ({DEFAULT_CATEGORIES.length})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Ô TÌM KIẾM */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm đề hoặc chủ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-52"
            />
          </div>

          {/* BỘ LỌC CHẾ ĐỘ */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSelectedFilter('EXAM')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedFilter === 'EXAM' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Đề thi thật
            </button>
            <button
              onClick={() => setSelectedFilter('PRACTICE')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedFilter === 'PRACTICE' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              Luyện tập
            </button>
            <button
              onClick={() => setSelectedFilter('MATH')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedFilter === 'MATH' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              Math
            </button>
            <button
              onClick={() => setSelectedFilter('RW')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedFilter === 'RW' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-500 hover:text-sky-600'
              }`}
            >
              R&W
            </button>
          </div>
        </div>
      </div>

      {/* 3. LƯỚI DANH SÁCH CÁC BỘ ĐỀ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.map(cat => {
          const isExam = cat.isRealExam;
          const questionCount = (cat.questions || []).length;

          return (
            <div 
              key={cat.id} 
              className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md p-6 flex flex-col justify-between space-y-4 transition group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    isExam 
                      ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {isExam ? 'Thi thử giới hạn giờ' : 'Luyện tập tự do'}
                  </span>

                  <span className="text-[11px] font-semibold text-slate-400">
                    {cat.domain}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                    {cat.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold font-mono">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    {questionCount} câu hỏi
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {isExam ? `${cat.duration || 32} phút` : 'Đếm tăng tự do'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartItem(cat)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    isExam
                      ? 'bg-slate-900 hover:bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExam ? 'Bắt đầu làm bài thi' : 'Vào luyện tập ngay'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}