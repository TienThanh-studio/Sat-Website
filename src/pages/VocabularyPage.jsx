import React, { useState, useMemo } from 'react';
import { 
  Volume2, RotateCw, ChevronLeft, ChevronRight, 
  Search, Shuffle, BookMarked, Sparkles, Check, ArrowRight
} from 'lucide-react';
import rawVocabList from '../data/mockVocab.json';

export default function VocabularyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('ALL'); // 'ALL', 'High', 'Medium', 'Low'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredWords, setMasteredWords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sat_mastered_vocab') || '[]');
    } catch {
      return [];
    }
  });

  // Lọc từ theo tìm kiếm và tần suất
  const filteredWords = useMemo(() => {
    return (rawVocabList || []).filter(item => {
      const matchSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.definition_vi && item.definition_vi.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (item.definition_en && item.definition_en.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchRank = selectedRank === 'ALL' || item.frequency_rank === selectedRank;
      return matchSearch && matchRank;
    });
  }, [searchTerm, selectedRank]);

  const currentWord = filteredWords[currentIndex] || filteredWords[0] || null;

  // Phát âm chuẩn US bằng Web Speech API
  const handlePronounce = (e, text) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % filteredWords.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + filteredWords.length) % filteredWords.length);
  };

  // Đánh dấu Thuộc hoặc Không chắc
  const handleMarkConfidence = (isKnown) => {
    if (!currentWord) return;
    let updated;
    if (isKnown) {
      updated = Array.from(new Set([...masteredWords, currentWord.id]));
    } else {
      updated = masteredWords.filter(id => id !== currentWord.id);
    }
    setMasteredWords(updated);
    localStorage.setItem('sat_mastered_vocab', JSON.stringify(updated));
    handleNext();
  };

  // Tách từ đồng nghĩa thành mảng tag
  const synonymsList = useMemo(() => {
    if (!currentWord?.synonyms) return [];
    return currentWord.synonyms.split(',').map(s => s.trim()).filter(Boolean);
  }, [currentWord]);

  // Tạo ví dụ minh họa ngữ cảnh SAT thực tế nếu chưa có sẵn
  const exampleSentence = useMemo(() => {
    if (!currentWord) return '';
    if (currentWord.example) return currentWord.example;
    return `The researcher's analysis was designed to ${currentWord.word} previous findings, which is why the committee accepted the hypothesis.`;
  }, [currentWord]);

  const progressPercent = filteredWords.length > 0 
    ? Math.round(((currentIndex + 1) / filteredWords.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50/70 p-6 md:p-10 font-sans select-none">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* TOP BAR / HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 text-sm tracking-wide flex items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-indigo-600" />
              Flashcard
            </span>
            <span className="text-xs text-slate-400 font-medium">• SAT WIC Elite (500 Words)</span>
          </div>

          {/* THANH LỌC TẦN SUẤT & TÌM KIẾM */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm từ vựng..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentIndex(0); }}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-44 shadow-2xs"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => { setSelectedRank('ALL'); setCurrentIndex(0); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedRank === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => { setSelectedRank('High'); setCurrentIndex(0); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedRank === 'High' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500 hover:text-rose-600'
                }`}
              >
                Cao
              </button>
            </div>
          </div>
        </div>

        {/* THÔNG TIN THẺ HIỆN TẠI */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-2">
          <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-mono text-[11px]">
            Phiên học: Thẻ {currentIndex + 1} / {filteredWords.length}
          </span>
          <span className="text-slate-500">
            Đã thuộc: <strong className="text-emerald-600">{masteredWords.length}</strong> / {filteredWords.length}
          </span>
        </div>

        {/* KHUNG THẺ 3D FLIP CONTAINER */}
        {currentWord && (
          <div className="relative w-full h-[430px] perspective-[1200px]">
            
            {/* THẺ XOAY TRỤC Y */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative w-full h-full transition-transform duration-500 transform-3d cursor-pointer ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              
              {/* ================= MẶT TRƯỚC (FRONT) ================= */}
              <div 
                className="absolute inset-0 w-full h-full bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col justify-center items-center p-8 backface-hidden"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-serif">
                    {currentWord.word}
                  </h2>
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 transition">
                    <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>Nhấn để xem nghĩa</span>
                  </div>
                </div>
              </div>

              {/* ================= MẶT SAU (BACK) ================= */}
              <div 
                className="absolute inset-0 w-full h-full bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col justify-between p-7 md:p-9 rotate-y-180 backface-hidden overflow-y-auto"
              >
                <div className="space-y-4">
                  
                  {/* Phiên âm + Loa phát âm */}
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                    <span>{currentWord.phonetic}</span>
                    <button
                      type="button"
                      onClick={(e) => handlePronounce(e, currentWord.word)}
                      className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-400 transition"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Định nghĩa Tiếng Việt & Tiếng Anh */}
                  <div className="space-y-1.5">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
                      {currentWord.definition_vi}
                    </h3>
                    <p className="text-xs text-slate-500 font-serif leading-relaxed">
                      {currentWord.definition_en}
                    </p>
                  </div>

                  {/* Cụm từ đồng nghĩa */}
                  {synonymsList.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        ĐỒNG NGHĨA
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {synonymsList.map((syn, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ví dụ trong ngữ cảnh SAT */}
                  <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-2xl p-4 space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      VÍ DỤ TRONG NGỮ CẢNH
                    </span>
                    <p className="text-xs text-slate-700 font-serif leading-relaxed">
                      {exampleSentence.split(new RegExp(`(${currentWord.word})`, 'gi')).map((part, i) => 
                        part.toLowerCase() === currentWord.word.toLowerCase() ? (
                          <strong key={i} className="font-bold text-indigo-700 bg-indigo-100/70 px-1 py-0.5 rounded-xs">
                            {part}
                          </strong>
                        ) : part
                      )}
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[10px] text-slate-300 italic">Nhấn vào thẻ để lật lại mặt trước</span>
                </div>
              </div>

            </div>

            {/* HAI NÚT MŨI TÊN ĐIỀU HƯỚNG TRỰC TIẾP Ở HAI BÊN THẺ */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-[-20px] md:left-[-24px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-105 transition active:scale-95 cursor-pointer z-10"
              title="Từ trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-[-20px] md:right-[-24px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-105 transition active:scale-95 cursor-pointer z-10"
              title="Từ kế tiếp"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* HAI NÚT ĐÁNH GIÁ TRÍ NHỚ (KHÔNG CHẮC / THUỘC) */}
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto pt-2">
          <button
            type="button"
            onClick={() => handleMarkConfidence(false)}
            className="py-3 px-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl flex flex-col items-center justify-center shadow-xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            <span className="font-bold text-slate-800 text-sm">Không chắc</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Ôn lại sau 1 ngày</span>
          </button>

          <button
            type="button"
            onClick={() => handleMarkConfidence(true)}
            className="py-3 px-4 bg-white border border-emerald-200 hover:border-emerald-300 rounded-2xl flex flex-col items-center justify-center shadow-xs transition hover:bg-emerald-50/40 active:scale-95 cursor-pointer"
          >
            <span className="font-bold text-emerald-600 text-sm">Thuộc</span>
            <span className="text-[11px] text-emerald-600/70 mt-0.5">Ôn lại sau 4 ngày</span>
          </button>
        </div>

        {/* FOOTER BAR: THANH TIẾN ĐỘ & NÚT ĐIỀU HƯỚNG */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-200">
          <div className="w-48 space-y-1">
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Tiến độ: {progressPercent}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Trước
            </button>
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Tiếp
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}