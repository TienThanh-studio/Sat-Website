// src/pages/VocabularyPage.jsx
import React, { useState } from 'react';
import mockVocab from '../data/mockVocab.json';
import { Volume2, Sparkles, BookOpen } from 'lucide-react';

export default function VocabularyPage() {
  const [vocabList] = useState(mockVocab);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-800" />
            <span>Kho từ vựng & Flashcards học thuật</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Các từ vựng cốt lõi thường xuyên xuất hiện trong đề thi Reading & Writing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vocabList.map(item => (
          <div key={item.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-brand-800">{item.word}</span>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {item.type}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono mb-2">{item.phonetic}</div>
            <p className="text-xs font-semibold text-slate-800 mb-3">{item.meaning}</p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic border border-slate-100">
              "{item.example}"
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}