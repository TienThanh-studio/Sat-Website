// src/components/exam/ai-tutor/StepByStepGuide.jsx
import React, { useState } from 'react';
import { ListOrdered, CheckCircle2, Copy, Check } from 'lucide-react';
import MathRenderer from '../../common/MathRenderer';

export default function StepByStepGuide({ steps = [], takeaway = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!takeaway) return;
    try {
      await navigator.clipboard.writeText(takeaway);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Quy trình giải từng bước */}
      {Array.isArray(steps) && steps.length > 0 && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] sm:p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <ListOrdered className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold leading-tight text-slate-900">
                Quy trình giải chuẩn College Board
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 font-mono">
                Step-by-step authoritative walkthrough
              </p>
            </div>
          </div>

          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold font-mono text-indigo-700 ring-1 ring-indigo-100">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 break-words font-serif pt-0.5">
                  <MathRenderer text={step} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 2. Bài học rút ra (Key Takeaway) */}
      {takeaway && (
        <section className="rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white p-5 shadow-sm sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">
                Bài học rút ra (Key Takeaway)
              </h4>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-300 text-xs font-bold text-emerald-900 transition cursor-pointer shadow-xs"
              title="Sao chép bài học vào clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>

          <div className="break-words text-sm font-semibold leading-relaxed text-slate-900 font-serif pt-1 select-text">
            <MathRenderer text={takeaway} />
          </div>
        </section>
      )}
    </div>
  );
}
