import React, { useState, useEffect } from 'react';
import initialVocab from '../data/mockVocab.json';
import { storageService } from '../services/storageService';
import { Volume2, RotateCcw, Check, Sparkles, Filter, ChevronLeft, ChevronRight, Layers, List } from 'lucide-react';

export default function VocabularyPage() {
  const [vocabList] = useState(initialVocab || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState('flashcard'); // 'flashcard' hoặc 'list'
  const [filterLevel, setFilterLevel] = useState('All');
  const [masteredWords, setMasteredWords] = useState(() => {
    return storageService.get('sat_vocab_mastered', {});
  });

  // Lọc từ theo Level
  const filteredWords = vocabList.filter(item => {
    if (filterLevel === 'All') return true;
    if (filterLevel === 'Mastered') return masteredWords[item.word];
    if (filterLevel === 'Learning') return !masteredWords[item.word];
    return item.level === filterLevel;
  });

  const currentWord = filteredWords[currentIndex] || filteredWords[0];

  // Phát âm tiếng Anh bằng SpeechSynthesis có sẵn của trình duyệt
  const speakWord = (word, e) => {
    if (e) e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleMastered = (word, e) => {
    if (e) e.stopPropagation();
    const updated = { ...masteredWords, [word]: !masteredWords[word] };
    setMasteredWords(updated);
    storageService.set('sat_vocab_mastered', updated);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(i => (i + 1) % filteredWords.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(i => (i - 1 + filteredWords.length) % filteredWords.length);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SAT High-Frequency Vocabulary</h1>
          </div>
          <p className="text-xs text-slate-500">Luyện tập thẻ nhớ từ vựng SAT tần suất cao với âm thanh và ngữ cảnh thực tế.</p>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('flashcard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'flashcard' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flashcard</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'list' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
          </div>

          <select
            value={filterLevel}
            onChange={(e) => {
              setFilterLevel(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-brand-800"
          >
            <option value="All">Tất cả ({vocabList.length})</option>
            <option value="Learning">Đang học ({vocabList.length - Object.values(masteredWords).filter(Boolean).length})</option>
            <option value="Mastered">Đã thuộc ({Object.values(masteredWords).filter(Boolean).length})</option>
            <option value="Hard">Cấp độ Hard</option>
            <option value="Medium">Cấp độ Medium</option>
          </select>
        </div>
      </div>

      {filteredWords.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 font-medium">
          Không có từ vựng nào trong mục đã chọn.
        </div>
      ) : viewMode === 'flashcard' ? (
        /* CHẾ ĐỘ 1: FLASHCARD LẬT 3D */
        <div className="max-w-xl mx-auto flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-slate-500 mb-3 font-semibold px-2">
            <span>Thẻ {currentIndex + 1} / {filteredWords.length}</span>
            <span className="text-[11px] text-slate-400">Bấm vào thẻ để lật mặt sau</span>
          </div>

          {/* Khối Card tương tác lật 3D */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-80 cursor-pointer perspective"
            style={{ perspective: '1000px' }}
          >
            <div
              className={`w-full h-full relative duration-500 rounded-3xl border border-slate-200 shadow-xl transition-transform ${
                isFlipped ? '[transform:rotateY(180deg)]' : ''
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* MẶT TRƯỚC (FRONT) */}
              <div
                className="absolute inset-0 bg-white rounded-3xl p-8 flex flex-col justify-between [backface-visibility:hidden]"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black rounded-lg uppercase tracking-wider">
                    {currentWord.partOfSpeech || 'Word'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => toggleMastered(currentWord.word, e)}
                    className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border transition ${
                      masteredWords[currentWord.word]
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{masteredWords[currentWord.word] ? 'Đã thuộc' : 'Chưa thuộc'}</span>
                  </button>
                </div>

                <div className="text-center my-auto">
                  <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{currentWord.word}</h2>
                  <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-mono">
                    <span>{currentWord.phonetic || '/.../'}</span>
                    <button
                      type="button"
                      onClick={(e) => speakWord(currentWord.word, e)}
                      className="p-1 hover:bg-slate-100 rounded-full text-brand-800 transition"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center text-slate-400 text-xs flex items-center justify-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Nhấn để xem nghĩa và ví dụ</span>
                </div>
              </div>

              {/* MẶT SAU (BACK) */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-brand-900 to-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                    <span className="text-lg font-black tracking-wide text-amber-400">{currentWord.word}</span>
                    <span className="text-xs text-slate-400 font-mono italic">{currentWord.partOfSpeech}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 leading-snug">{currentWord.meaning}</h3>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs leading-relaxed text-slate-300 italic">
                    "{currentWord.example || 'Example sentence is being updated.'}"
                  </div>
                </div>

                {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                  <div className="text-xs text-slate-400 pt-3 border-t border-white/10">
                    <span className="text-white/60 font-semibold mr-2">Đồng nghĩa:</span>
                    <span className="text-amber-200">{currentWord.synonyms.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Thanh điều hướng Trước/Sau */}
          <div className="flex items-center gap-4 mt-6">
            <button
              type="button"
              onClick={handlePrev}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 shadow-sm transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={(e) => toggleMastered(currentWord.word, e)}
              className={`px-6 py-3 rounded-2xl text-xs font-bold border flex items-center gap-2 shadow-sm transition ${
                masteredWords[currentWord.word]
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{masteredWords[currentWord.word] ? 'Đã thành thạo từ này' : 'Đánh dấu đã thuộc'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="p-3 bg-brand-800 hover:bg-brand-900 text-white rounded-2xl shadow-sm transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* CHẾ ĐỘ 2: DANH SÁCH BẢNG GRID TỔNG HỢP */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWords.map((item, idx) => {
            const isMastered = !!masteredWords[item.word];
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-slate-900">{item.word}</span>
                      <button
                        type="button"
                        onClick={() => speakWord(item.word)}
                        className="text-brand-800 hover:text-brand-900"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {item.partOfSpeech || 'Word'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mb-2">{item.meaning}</p>
                  <p className="text-xs text-slate-500 italic bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                    "{item.example}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">{item.phonetic}</span>
                  <button
                    type="button"
                    onClick={(e) => toggleMastered(item.word, e)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                      isMastered
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'text-slate-400 border-slate-200 hover:text-slate-700'
                    }`}
                  >
                    {isMastered ? '✓ Đã thuộc' : '+ Đánh dấu'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}