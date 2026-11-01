// src/components/exam/ai-tutor/ContextCluesCard.jsx
import React, { useMemo } from 'react';
import { Compass, Split, FileText, ArrowRightCircle } from 'lucide-react';

const CONTRAST_REGEX = /\b(however|although|though|while|yet|but|nevertheless|nonetheless|in contrast|on the other hand|instead|whereas|despite|in spite of|conversely)\b/gi;
const CONTINUATION_REGEX = /\b(furthermore|moreover|in addition|also|for example|for instance|specifically|therefore|thus|consequently|as a result|because|since|accordingly)\b/gi;
const PUNCTUATION_CLUES = [
  { mark: ':', name: 'Dấu hai chấm (:)', meaning: 'Báo hiệu lời giải thích, định nghĩa hoặc ví dụ làm rõ cho vế trước' },
  { mark: '—', name: 'Dấu gạch ngang dài (—)', meaning: 'Bổ sung thông tin chi tiết hoặc mở rộng sắc thái nghĩa' },
  { mark: ';', name: 'Dấu chấm phẩy (;)', meaning: 'Ngăn cách 2 mệnh đề độc lập tương đương về mặt ngữ nghĩa' },
];

export default function ContextCluesCard({ passage = '', question = '' }) {
  const combinedText = useMemo(() => {
    return `${passage || ''} ${question || ''}`.normalize('NFC');
  }, [passage, question]);

  const scannedClues = useMemo(() => {
    if (!combinedText.trim()) return null;

    // 1. Quét Contrast
    const contrastMatches = [];
    let match;
    const contrastPattern = new RegExp(CONTRAST_REGEX.source, 'gi');
    while ((match = contrastPattern.exec(combinedText)) !== null) {
      const word = match[0].toLowerCase();
      if (!contrastMatches.some((m) => m.word.toLowerCase() === word)) {
        contrastMatches.push({ word, index: match.index });
      }
    }

    // 2. Quét Continuation
    const continuationMatches = [];
    const contPattern = new RegExp(CONTINUATION_REGEX.source, 'gi');
    while ((match = contPattern.exec(combinedText)) !== null) {
      const word = match[0].toLowerCase();
      if (!continuationMatches.some((m) => m.word.toLowerCase() === word)) {
        continuationMatches.push({ word, index: match.index });
      }
    }

    // 3. Quét dấu câu logic
    const punctuationMatches = [];
    PUNCTUATION_CLUES.forEach((item) => {
      if (combinedText.includes(item.mark)) {
        punctuationMatches.push(item);
      }
    });

    const hasAny =
      contrastMatches.length > 0 ||
      continuationMatches.length > 0 ||
      punctuationMatches.length > 0;

    return {
      hasAny,
      contrastMatches,
      continuationMatches,
      punctuationMatches,
    };
  }, [combinedText]);

  if (!scannedClues || !scannedClues.hasAny) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] sm:p-6 space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
          <Compass className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-tight text-slate-900">
            Điểm neo logic trong đoạn văn (Context Clues Radar)
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 font-mono">
            Phát hiện từ khóa chuyển hướng & dấu hiệu cấu trúc
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Nhóm tương phản */}
        {scannedClues.contrastMatches.length > 0 && (
          <div className="rounded-2xl p-4 bg-rose-50/60 ring-1 ring-rose-200/70 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wide">
              <Split className="w-4 h-4" />
              <span>Từ khóa tương phản (Contrast)</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {scannedClues.contrastMatches.map((m, idx) => (
                <span
                  key={idx}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold font-mono text-rose-700 shadow-xs ring-1 ring-rose-200"
                >
                  "{m.word}"
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
              👉 Báo hiệu vế sau mang ý nghĩa <strong>ngược chiều hoặc mâu thuẫn</strong> với vế trước. Đáp án cần tìm phải mang sắc thái đối lập với tiền đề.
            </p>
          </div>
        )}

        {/* Nhóm liên kết / bổ sung / nguyên nhân */}
        {scannedClues.continuationMatches.length > 0 && (
          <div className="rounded-2xl p-4 bg-indigo-50/60 ring-1 ring-indigo-200/70 space-y-2">
            <div className="flex items-center gap-2 text-indigo-800 text-xs font-bold uppercase tracking-wide">
              <ArrowRightCircle className="w-4 h-4" />
              <span>Từ nối tiếp tục (Continuation / Cause)</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {scannedClues.continuationMatches.map((m, idx) => (
                <span
                  key={idx}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold font-mono text-indigo-700 shadow-xs ring-1 ring-indigo-200"
                >
                  "{m.word}"
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
              👉 Báo hiệu quan hệ <strong>đồng hướng, bổ sung hoặc kết quả tất yếu</strong>. Từ vựng hoặc suy luận cần củng cố mạch lập luận trước đó.
            </p>
          </div>
        )}

        {/* Nhóm dấu câu logic */}
        {scannedClues.punctuationMatches.length > 0 && (
          <div className="sm:col-span-2 rounded-2xl p-4 bg-amber-50/60 ring-1 ring-amber-200/70 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wide">
              <FileText className="w-4 h-4" />
              <span>Dấu hiệu cú pháp & dấu câu (Structural Marks)</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 pt-1">
              {scannedClues.punctuationMatches.map((item, idx) => (
                <div key={idx} className="rounded-xl bg-white p-2.5 ring-1 ring-amber-200/80 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="font-mono text-amber-600 text-sm font-black">{item.mark}</span>
                    <span>{item.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{item.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
