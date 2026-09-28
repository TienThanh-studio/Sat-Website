import React, { useState, useMemo } from 'react';
import { 
  Volume2, RotateCw, ChevronLeft, ChevronRight, 
  Search, BookMarked, CheckCircle2 
} from 'lucide-react';
import rawVocabList from '../data/mockVocab.json';

export default function VocabularyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('ALL'); // 'ALL', 'High', 'Medium'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredWords, setMasteredWords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sat_mastered_vocab') || '[]');
    } catch {
      return [];
    }
  });

  // Lấy dữ liệu an toàn
  const vocabArray = useMemo(() => {
    if (Array.isArray(rawVocabList)) return rawVocabList;
    if (rawVocabList?.words && Array.isArray(rawVocabList.words)) return rawVocabList.words;
    return [];
  }, []);

  // Lọc từ theo tìm kiếm & tần suất
  const filteredWords = useMemo(() => {
    return vocabArray.filter(item => {
      const w = item.word || '';
      const vi = item.definition_vi || item.meaning || '';
      const en = item.definition_en || '';
      const matchSearch = w.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          en.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRank = selectedRank === 'ALL' || item.frequency_rank === selectedRank;
      return matchSearch && matchRank;
    });
  }, [vocabArray, searchTerm, selectedRank]);

  const currentWord = filteredWords[currentIndex] || filteredWords[0] || null;

  // Phát âm tiếng Anh
  const handlePronounce = (e, text) => {
    e.stopPropagation();
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (filteredWords.length > 0) {
      setCurrentIndex(prev => (prev + 1) % filteredWords.length);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (filteredWords.length > 0) {
      setCurrentIndex(prev => (prev - 1 + filteredWords.length) % filteredWords.length);
    }
  };

  const handleToggleMastered = (id) => {
    let updated;
    if (masteredWords.includes(id)) {
      updated = masteredWords.filter(item => item !== id);
    } else {
      updated = [...masteredWords, id];
    }
    setMasteredWords(updated);
    localStorage.setItem('sat_mastered_vocab', JSON.stringify(updated));
  };

  const synonymsList = useMemo(() => {
    if (!currentWord?.synonyms) return [];
    if (Array.isArray(currentWord.synonyms)) return currentWord.synonyms;
    return String(currentWord.synonyms).split(',').map(s => s.trim()).filter(Boolean);
  }, [currentWord]);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 font-sans select-none">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-indigo-600" />
          <h2 className="font-extrabold text-slate-800 text-sm tracking-wide">Flashcard</h2>
          <span className="text-xs text-slate-400 font-medium">• SAT WIC Elite ({vocabArray.length} Words)</span>
        </div>

        {/* BỘ LỌC VÀ TÌM KIẾM */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm từ vựng..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentIndex(0); }}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-44"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => { setSelectedRank('ALL'); setCurrentIndex(0); }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedRank === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => { setSelectedRank('High'); setCurrentIndex(0); }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedRank === 'High' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              Cao
            </button>
          </div>
        </div>
      </div>

      {/* THÔNG TIN TIẾN ĐỘ */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
        <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-mono text-[11px]">
          Phiên học: Thẻ {filteredWords.length > 0 ? currentIndex + 1 : 0} / {filteredWords.length}
        </span>
        <span className="text-slate-500">
          Đã thuộc: <strong className="text-emerald-600 font-mono">{masteredWords.length}</strong> / {vocabArray.length}
        </span>
      </div>

      {/* KHUNG THẺ CHUYỂN ĐỘNG XOAY 3D (FLIP CARD CONTAINER) */}
      {currentWord ? (
        <div className="relative w-full max-w-2xl mx-auto my-4" style={{ perspective: '1200px' }}>
          
          {/* THẺ XOAY TRỤC Y VỚI THỜI GIAN 650ms VÀ CUBIC-BEZIER MƯỢT MÀ */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[380px] relative cursor-pointer"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.16s cubic-bezier(0.4, 0.2, 0.2, 1)',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* ================= MẶT TRƯỚC (FRONT) ================= */}
            <div 
              className="absolute inset-0 w-full h-full bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-xl p-8 flex flex-col justify-between items-center text-center select-none"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              {/* Header mặt trước */}
              <div className="w-full flex items-center justify-between text-xs text-slate-400">
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                  currentWord.frequency_rank === 'High' 
                    ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {currentWord.frequency_rank ? `Tần suất: ${currentWord.frequency_rank}` : 'Digital SAT Vocabulary'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleMastered(currentWord.id || currentWord.word);
                  }}
                  className={`p-1.5 rounded-xl border transition cursor-pointer ${
                    masteredWords.includes(currentWord.id || currentWord.word)
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                  }`}
                  title="Đánh dấu đã thuộc"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>

              {/* Giữa mặt trước */}
              <div className="my-auto py-4 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-serif">
                    {currentWord.word}
                  </h3>
                  <button
                    type="button"
                    onClick={(e) => handlePronounce(e, currentWord.word)}
                    className="p-2 hover:bg-slate-100 rounded-full text-indigo-600 transition cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="font-mono text-sm text-slate-400 font-semibold">
                  {currentWord.phonetic || currentWord.ipa || ''}
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium pt-3">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Nhấn để lật xem nghĩa & ví dụ</span>
                </div>
              </div>

              {/* Footer mặt trước */}
              <div className="text-[11px] text-slate-400">
                Mặt trước (Word)
              </div>
            </div>

            {/* ================= MẶT SAU (BACK) ================= */}
            <div 
              className="absolute inset-0 w-full h-full bg-white rounded-3xl border border-indigo-200/80 shadow-md hover:shadow-xl p-8 flex flex-col justify-between items-center text-center select-none overflow-y-auto"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              {/* Header mặt sau */}
              <div className="w-full flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-indigo-600 uppercase text-[10px] tracking-wider">
                  Ý nghĩa ngữ cảnh
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                  {currentWord.word}
                </span>
              </div>

              {/* Giữa mặt sau (Định nghĩa Tiếng Việt & Tiếng Anh) */}
              <div className="my-auto py-2 space-y-4 max-w-lg">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                    Định nghĩa Tiếng Việt
                  </span>
                  <p className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
                    {currentWord.definition_vi || currentWord.meaning || 'Chưa có định nghĩa'}
                  </p>
                </div>

                {currentWord.definition_en && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      English Meaning
                    </span>
                    <p className="text-xs text-slate-600 font-serif leading-relaxed">
                      {currentWord.definition_en}
                    </p>
                  </div>
                )}

                {synonymsList.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Từ đồng nghĩa
                    </span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {synonymsList.map((syn, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentWord.example && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 italic">
                    "{currentWord.example}"
                  </div>
                )}
              </div>

              {/* Footer mặt sau */}
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <RotateCw className="w-3 h-3" />
                <span>Nhấn lại để lật về mặt trước</span>
              </div>
            </div>

          </div>

          {/* NÚT MŨI TÊN ĐIỀU HƯỚNG TRỰC TIẾP Ở HAI BÊN */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-[-16px] md:left-[-24px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-105 transition active:scale-95 cursor-pointer z-10"
            title="Từ trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-[-16px] md:right-[-24px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-105 transition active:scale-95 cursor-pointer z-10"
            title="Từ kế tiếp"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400 text-xs">
          Không tìm thấy từ vựng nào khớp với bộ lọc.
        </div>
      )}

      {/* NÚT ĐIỀU HƯỚNG DƯỚI CÙNG */}
      <div className="flex justify-end gap-3 max-w-2xl mx-auto pt-2">
        <button
          type="button"
          onClick={handlePrev}
          className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
        >
          Trước
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
        >
          Tiếp
        </button>
      </div>
    </div>
  );
}