// src/components/exam/ai-tutor/OptionBreakdownCard.jsx
import React from 'react';
import { BookOpen, CheckCircle2, XCircle, Award } from 'lucide-react';
import MathRenderer from '../../common/MathRenderer';

export default function OptionBreakdownCard({
  enrichedOptions = [],
  correctLabel = '',
  explanationText = '',
}) {
  if (!enrichedOptions || enrichedOptions.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] sm:p-6 space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-tight text-slate-900">
            Giải nghĩa 4 phương án A, B, C, D & Đối chiếu ngữ cảnh
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 font-mono">
            Option-by-option vocabulary & logical breakdown
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {enrichedOptions.map((opt) => {
          const isCorrect = opt.isCorrectOpt;
          const isUser = opt.isUserOpt;

          return (
            <div
              key={opt.label}
              className={`rounded-2xl p-4 ring-1 transition-all ${
                isCorrect
                  ? 'bg-emerald-50/90 ring-2 ring-emerald-500 text-slate-900 shadow-sm'
                  : isUser
                  ? 'bg-rose-50/80 ring-2 ring-rose-400 text-slate-900'
                  : 'bg-slate-50/70 ring-slate-200/80 text-slate-800'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black shadow-xs ${
                    isCorrect
                      ? 'bg-emerald-600 text-white'
                      : isUser
                      ? 'bg-rose-600 text-white'
                      : 'bg-white text-slate-800 ring-1 ring-slate-300'
                  }`}
                >
                  {opt.label}
                </span>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 font-serif">
                      <MathRenderer text={opt.text} />
                    </span>

                    {opt.lex?.pos && (
                      <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-700">
                        {opt.lex.pos}
                      </span>
                    )}

                    {isCorrect && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Đáp án đúng
                      </span>
                    )}

                    {isUser && !isCorrect && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        <XCircle className="h-3 w-3" /> Bạn đã chọn
                      </span>
                    )}

                    {!isCorrect && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        Phương án nhiễu
                      </span>
                    )}
                  </div>

                  {opt.lex ? (
                    <div className="space-y-1 text-xs leading-relaxed pt-0.5">
                      <p className="font-semibold text-slate-800">
                        🇻🇳 Nghĩa chuẩn SAT:{' '}
                        <span className="text-indigo-700 font-bold">{opt.lex.vi}</span>
                      </p>
                      {opt.lex.en && (
                        <p className="italic text-slate-600">🇬🇧 EN: {opt.lex.en}</p>
                      )}
                      {Array.isArray(opt.lex.syn) && opt.lex.syn.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Đồng nghĩa:
                          </span>
                          {opt.lex.syn.map((s, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">
                      {isCorrect
                        ? 'Phương án chuẩn xác, khớp logic và dữ kiện đề bài yêu cầu.'
                        : 'Phương án không khớp dấu hiệu ngữ cảnh hoặc vi phạm quy tắc logic.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {explanationText && (
        <div className="mt-4 rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-200 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Lập luận chi tiết (Tại sao chọn {correctLabel || 'đáp án đúng'}):</span>
          </div>
          <div className="text-xs sm:text-sm leading-relaxed text-slate-800 select-text font-serif pt-1">
            <MathRenderer text={explanationText} />
          </div>
        </div>
      )}
    </section>
  );
}
