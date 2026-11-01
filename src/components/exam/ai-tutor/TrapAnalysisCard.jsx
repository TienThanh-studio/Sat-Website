// src/components/exam/ai-tutor/TrapAnalysisCard.jsx
import React from 'react';
import { AlertTriangle, CheckCircle2, Zap, ShieldAlert } from 'lucide-react';
import MathRenderer from '../../common/MathRenderer';

export default function TrapAnalysisCard({
  status = 'wrong',
  trapTag = '',
  trapParagraphs = [],
  strategy = null,
}) {
  const isCorrect = status === 'correct';

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] sm:p-6 space-y-4">
      {/* 1. Giải mã bẫy tâm lý */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${
            isCorrect
              ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
              : 'bg-rose-50 text-rose-600 ring-rose-100'
          }`}
        >
          {isCorrect ? (
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-tight text-slate-900">
            {isCorrect ? 'Nhận diện & Né bẫy thành công' : 'Giải mã bẫy tâm lý người ra đề'}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 font-mono">
            {isCorrect ? 'Flawless execution' : 'Why you picked it: the distractor trap'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {trapTag && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
              isCorrect
                ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                : 'bg-rose-50 text-rose-700 ring-rose-200'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {trapTag}
          </span>
        )}

        <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-700 font-serif">
          {trapParagraphs.map((paragraph, index) => (
            <div key={index} className="break-words">
              <MathRenderer text={paragraph} />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Chiến thuật tư duy 30 giây */}
      {strategy && (
        <div className="mt-4 pt-4 border-t border-slate-100 rounded-2xl bg-amber-50/60 p-4 ring-1 ring-amber-200/70 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-black">
              <Zap className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Chiến thuật tư duy 30 giây (Speed Strategy)
            </span>
          </div>

          {strategy.headline && (
            <p className="text-xs sm:text-sm font-bold text-slate-900">
              {strategy.headline}
            </p>
          )}

          {Array.isArray(strategy.tips) && strategy.tips.length > 0 && (
            <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
              {strategy.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <div className="flex-1">
                    <MathRenderer text={tip} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
