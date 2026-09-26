import React from 'react';
import { BookOpen, CheckCircle, ChevronRight, Grid } from 'lucide-react';

export default function CategoryCard({ topic, onSelect, onOpenMatrix }) {
  if (!topic) return null;

  // Lấy an toàn danh sách phases hoặc tags (hỗ trợ cả availablePhases và phases)
  const phases = topic.availablePhases || topic.phases || (topic.totalQuestions > 0 ? ['01'] : []);
  const total = topic.totalQuestions || 0;
  const solved = topic.solvedQuestions || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {topic.category || 'Reading & Writing'}
            </span>
            <h3 className="font-bold text-slate-800 text-sm mt-1.5 group-hover:text-indigo-600 transition">
              {topic.label || topic.title || topic.name}
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-400 shrink-0">
            {total} câu hỏi
          </span>
        </div>

        {/* Danh sách Phase tags - Sử dụng optional chaining an toàn */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {Array.isArray(phases) && phases.length > 0 ? (
            phases.map((phase, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100"
              >
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                {typeof phase === 'string' && phase.startsWith('Phase') ? phase : `Phase ${phase}`}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Đang cập nhật phase</span>
          )}
        </div>
      </div>

      {/* Footer các nút hành động */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenMatrix}
          title="Xem ma trận câu hỏi"
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onSelect}
          disabled={total === 0}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
        >
          <span>Luyện tập</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}