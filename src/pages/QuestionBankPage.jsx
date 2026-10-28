// src/pages/QuestionBankPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Play,
  Search,
  Sparkles,
  CheckCircle2,
  CircleDot,
  Layers,
  Clock,
  RotateCcw,
  Filter,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_CATEGORIES,
  createAdaptiveExamSession,
} from '../services/questionService';
import { storageService } from '../services/storageService';

export default function QuestionBankPage({
  onStartPractice,
  onStartExam,
  onSelectCategory,
}) {
  const [selectedSectionTab, setSelectedSectionTab] = useState('full_exam');
  const [completionFilter, setCompletionFilter] = useState('unanswered');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedIds, setCompletedIds] = useState(() =>
    storageService.getCompletedSet()
  );

  useEffect(() => {
    const syncCompleted = () => {
      setCompletedIds(storageService.getCompletedSet());
    };
    syncCompleted();
    window.addEventListener('focus', syncCompleted);
    return () => window.removeEventListener('focus', syncCompleted);
  }, []);

  const enrichedCategories = useMemo(() => {
    return DEFAULT_CATEGORIES.filter((cat) => {
      if (cat.id === 'cb_test_11_rw1') return false;
      return true;
    }).map((cat) => {
      const allQs = Array.isArray(cat.questions) ? cat.questions : [];
      const answeredQs = allQs.filter((q) => completedIds.has(String(q.id)));
      const unansweredQs = allQs.filter((q) => !completedIds.has(String(q.id)));

      let activeQuestions = allQs;
      if (completionFilter === 'unanswered') {
        activeQuestions = unansweredQs;
      } else if (completionFilter === 'answered') {
        activeQuestions = answeredQs;
      }

      const progressPct =
        allQs.length > 0
          ? Math.round((answeredQs.length / allQs.length) * 100)
          : 0;

      return {
        ...cat,
        allCount: allQs.length,
        answeredCount: answeredQs.length,
        unansweredCount: unansweredQs.length,
        activeQuestions,
        progressPct,
      };
    });
  }, [completedIds, completionFilter]);

  const tabCounts = useMemo(() => {
    return {
      full_exam: enrichedCategories.filter((c) => Boolean(c.isExam)).length,
      rw: enrichedCategories.filter(
        (c) =>
          !c.isExam &&
          (String(c.section).toLowerCase().includes('reading') ||
            String(c.section).toLowerCase().includes('verbal'))
      ).length,
      math: enrichedCategories.filter(
        (c) => !c.isExam && String(c.section).toLowerCase().includes('math')
      ).length,
    };
  }, [enrichedCategories]);

  const displayedCategories = useMemo(() => {
    return enrichedCategories.filter((cat) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText =
          (cat.title || '').toLowerCase().includes(q) ||
          (cat.description || '').toLowerCase().includes(q) ||
          (cat.domain || '').toLowerCase().includes(q) ||
          (cat.skill || '').toLowerCase().includes(q) ||
          (cat.badge || '').toLowerCase().includes(q);
        if (!matchText) return false;
      }

      if (selectedSectionTab === 'full_exam') {
        return Boolean(cat.isExam);
      }
      if (selectedSectionTab === 'rw') {
        return (
          !cat.isExam &&
          (String(cat.section).toLowerCase().includes('reading') ||
            String(cat.section).toLowerCase().includes('verbal'))
        );
      }
      if (selectedSectionTab === 'math') {
        return (
          !cat.isExam && String(cat.section).toLowerCase().includes('math')
        );
      }

      return true;
    });
  }, [enrichedCategories, selectedSectionTab, searchQuery]);

  const currentTabStats = useMemo(() => {
    let total = 0;
    let done = 0;
    const seen = new Set();

    displayedCategories.forEach((cat) => {
      (cat.questions || []).forEach((q) => {
        if (!q?.id || seen.has(q.id)) return;
        seen.add(q.id);
        total++;
        if (completedIds.has(String(q.id))) {
          done++;
        }
      });
    });

    return {
      total,
      done,
      unanswered: Math.max(0, total - done),
    };
  }, [displayedCategories, completedIds]);

  // Mở chính xác bộ câu hỏi được chọn (Lưu đồng bộ vào sessionStorage để tránh mất dữ liệu qua App.jsx)
  const handleLaunchCategory = (cat) => {
    let targetQuestions = cat.activeQuestions;

    if (targetQuestions.length === 0) {
      if (completionFilter === 'unanswered') {
        if (
          window.confirm(
            `Tuyệt vời! Bạn đã hoàn thành toàn bộ ${cat.allCount} câu trong bộ "${cat.title}". Bạn có muốn mở lại toàn bộ ${cat.allCount} câu để ôn tập không?`
          )
        ) {
          targetQuestions = cat.questions;
        } else {
          return;
        }
      } else if (completionFilter === 'answered') {
        alert(
          `Bạn chưa làm câu nào trong bộ "${cat.title}". Hãy chuyển sang bộ lọc "Chưa làm" hoặc "Tất cả" nhé!`
        );
        return;
      }
    }

    const payload = {
      ...cat,
      categoryId: cat.id,
      testId: cat.id,
      questions: targetQuestions,
      totalQuestions: targetQuestions.length,
      filterMode: completionFilter,
    };

    try {
      sessionStorage.setItem(
        'sat_active_exam_payload',
        JSON.stringify(payload)
      );
    } catch {
      // ignore storage quota
    }

    if (typeof onStartExam === 'function') {
      onStartExam(payload);
    } else if (typeof onStartPractice === 'function') {
      onStartPractice(payload);
    } else if (typeof onSelectCategory === 'function') {
      onSelectCategory(payload);
    }
  };

  const handleQuickAdaptiveExam = (sectionName) => {
    const session = createAdaptiveExamSession({ section: sectionName });
    if (completionFilter === 'unanswered') {
      const filteredPool = (session.questions || []).filter(
        (q) => !completedIds.has(String(q.id))
      );
      if (filteredPool.length >= 10) {
        session.questions = filteredPool;
      }
    }

    try {
      sessionStorage.setItem(
        'sat_active_exam_payload',
        JSON.stringify(session)
      );
    } catch {
      // ignore
    }

    if (typeof onStartExam === 'function') {
      onStartExam(session);
    } else if (typeof onStartPractice === 'function') {
      onStartPractice(session);
    }
  };

  const handleResetCategoryProgress = (e, cat) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Bạn có muốn đặt lại trạng thái "Chưa làm" cho toàn bộ ${cat.answeredCount} câu đã làm trong bộ "${cat.title}" không?`
      )
    ) {
      return;
    }
    const ids = (cat.questions || []).map((q) => q.id);
    storageService.resetCompletedQuestions(ids);
    setCompletedIds(storageService.getCompletedSet());
  };

  const handleResetAllProgress = () => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn đặt lại trạng thái "Chưa làm" cho toàn bộ ngân hàng câu hỏi không?'
      )
    ) {
      return;
    }
    storageService.resetCompletedQuestions();
    setCompletedIds(new Set());
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-7 select-none font-sans text-slate-100">
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0c142c] via-[#131d42] to-[#0c142c] border border-indigo-500/30 p-6 lg:p-8 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BLUEBOOK ADAPTIVE SIMULATOR • DIGITAL SAT</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Trung Tâm Ngân Hàng Câu Hỏi & Đề Thi Thực Chiến
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tích hợp toàn bộ đề thi thật College Board đủ 2 Modules (Test 4,
              5, 6, 7, 8) cùng ngân hàng câu hỏi phân loại theo kỹ năng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleQuickAdaptiveExam('Reading & Writing')}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Thi R&W (32 phút)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAdaptiveExam('Math')}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/30 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Thi Math (35 phút)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#0b1021]/95 border border-indigo-500/25 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Bộ lọc câu hỏi:</span>
          </div>

          <div className="inline-flex bg-slate-950 p-1.5 rounded-xl border border-white/10 gap-1.5">
            <button
              type="button"
              onClick={() => setCompletionFilter('unanswered')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                completionFilter === 'unanswered'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span>Chưa làm</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  completionFilter === 'unanswered'
                    ? 'bg-slate-950/40 text-cyan-100'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {currentTabStats.unanswered}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCompletionFilter('answered')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                completionFilter === 'answered'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã làm</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  completionFilter === 'answered'
                    ? 'bg-slate-950/30 text-white'
                    : 'bg-slate-800 text-emerald-300'
                }`}
              >
                {currentTabStats.done}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCompletionFilter('all')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                completionFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tất cả</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  completionFilter === 'all'
                    ? 'bg-slate-950/40 text-indigo-100'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {currentTabStats.total}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm đề hoặc chủ đề..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-400 text-white"
            />
          </div>

          {completedIds.size > 0 && (
            <button
              type="button"
              onClick={handleResetAllProgress}
              className="px-3 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              title="Đặt lại toàn bộ câu hỏi về trạng thái Chưa làm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset đã làm</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
          {[
            {
              id: 'full_exam',
              label: `Đề thi thật (Full 2 Modules) (${tabCounts.full_exam})`,
            },
            {
              id: 'rw',
              label: `Luyện tập Reading & Writing (${tabCounts.rw})`,
            },
            {
              id: 'math',
              label: `Luyện tập Math (${tabCounts.math})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedSectionTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer border ${
                selectedSectionTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/25'
                  : 'bg-slate-900/90 text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedCategories.map((cat) => {
          const isAllDone = cat.allCount > 0 && cat.unansweredCount === 0;

          return (
            <div
              key={cat.id}
              className="group relative bg-[#0c1224]/95 hover:bg-[#101830] rounded-3xl border border-indigo-500/20 hover:border-cyan-400/50 p-6 flex flex-col justify-between transition-all duration-200 shadow-lg"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-400/30">
                    {cat.badge || 'SAT BANK'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {cat.section}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition leading-snug">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Đã làm:{' '}
                      <strong className="text-emerald-400">
                        {cat.answeredCount}
                      </strong>
                      /{cat.allCount} câu
                    </span>
                    <span className="text-cyan-300 font-mono">
                      Còn {cat.unansweredCount} câu mới
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden p-0.5">
                    <div
                      style={{ width: `${cat.progressPct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tổng {cat.allCount} câu</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {cat.isExam ? 'Full 2 Modules' : 'Đếm tăng tự do'}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLaunchCategory(cat)}
                    className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                      completionFilter === 'unanswered' && isAllDone
                        ? 'bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-200 border border-emerald-400/40'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {completionFilter === 'unanswered' ? (
                      isAllDone ? (
                        <span>Đã hoàn thành 100% (Ôn lại)</span>
                      ) : (
                        <span>Làm {cat.unansweredCount} câu chưa làm</span>
                      )
                    ) : completionFilter === 'answered' ? (
                      <span>Ôn lại ({cat.answeredCount} câu đã làm)</span>
                    ) : (
                      <span>Luyện tập ngay ({cat.allCount} câu)</span>
                    )}
                  </button>

                  {cat.answeredCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => handleResetCategoryProgress(e, cat)}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-400/40 transition cursor-pointer"
                      title="Reset tiến độ đã làm của riêng bộ đề này"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}