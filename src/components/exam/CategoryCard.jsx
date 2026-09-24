import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function CategoryCard({ title, totalCount, topics, onOpenMatrix, onSelectTopic }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full max-w-sm">
      {/* Card Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-red-50/50 to-white flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <p className="text-xs text-slate-400 font-medium">{totalCount} câu hỏi</p>
        </div>
        <button
          onClick={onOpenMatrix}
          className="px-3.5 py-1.5 text-xs font-bold text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-lg transition border border-brand-200/50"
        >
          Luyện tập
        </button>
      </div>

      {/* Subtitle */}
      <div className="px-5 py-2.5 bg-slate-50/60 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
        QBank của lớp Đọc Viết Phase 2
      </div>

      {/* Topics List */}
      <div className="divide-y divide-slate-100">
        {topics.map((t, idx) => (
          <div
            key={idx}
            onClick={() => onSelectTopic(t.name)}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition group"
          >
            <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-800">
              {t.name}
            </span>
            <div className="flex items-center gap-2">
              {t.correct !== undefined && t.correct > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  {t.correct < 10 ? `0${t.correct}` : t.correct}
                </span>
              )}
              <span className="text-xs font-medium text-slate-400">
                {t.total} câu hỏi
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}