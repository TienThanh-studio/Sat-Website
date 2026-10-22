// src/pages/VocabularyPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Volume2,
  CheckCircle2,
  Brain,
  Layers,
  Play,
  Search,
  Award,
  Flame,
  XCircle,
  Filter,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import rawVocabData from '../data/mockVocab.json';
import { storageService } from '../services/storageService';

const SET_SIZE = 25; // Mỗi Set 25 từ vựng

/**
 * Chuẩn hóa dữ liệu từ vựng từ mockVocab.json
 */
function normalizeVocabList(raw) {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.words)
    ? raw.words
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  return arr.map((item, idx) => ({
    id: item.id || `vocab_${idx + 1}`,
    index: idx + 1,
    word: item.word || item.term || `Word ${idx + 1}`,
    phonetic: item.phonetic || item.pronunciation || '',
    partOfSpeech: item.partOfSpeech || item.pos || item.type || 'v./adj.',
    meaning:
      item.meaning ||
      item.definition_vi ||
      item.translation ||
      item.definition ||
      '',
    definitionEn: item.definitionEn || item.definition_en || item.explanation || '',
    example:
      item.example ||
      item.context ||
      item.sentence ||
      'In academic contexts, this word frequently appears in Digital SAT passages.',
    synonyms: Array.isArray(item.synonyms)
      ? item.synonyms
      : typeof item.synonyms === 'string'
      ? item.synonyms
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    level: item.level || item.difficulty || 'C1',
  }));
}

/**
 * Thuật toán Spaced Repetition SM-2 (tương tự Anki)
 * quality: 1 (Again - Quên), 2 (Hard - Khó), 3 (Good - Nhớ), 4 (Easy - Thuộc lòng)
 */
function computeNextSrsState(prevRecord, quality) {
  const now = Date.now();
  const prevReps = prevRecord?.reps || 0;
  const prevInterval = prevRecord?.intervalDays || 0;
  let ease = prevRecord?.ease || 2.5;

  let reps = prevReps;
  let intervalDays = 0;
  let nextReviewAt = now;
  let status = 'learning'; // 'new' | 'learning' | 'review' | 'mastered'

  if (quality === 1) {
    reps = 0;
    intervalDays = 0;
    ease = Math.max(1.3, ease - 0.2);
    nextReviewAt = now + 10 * 60 * 1000;
    status = 'learning';
  } else if (quality === 2) {
    reps = prevReps + 1;
    intervalDays =
      prevInterval === 0 ? 1 : Math.max(1, Math.round(prevInterval * 1.2));
    ease = Math.max(1.3, ease - 0.15);
    nextReviewAt = now + intervalDays * 86400 * 1000;
    status = 'learning';
  } else if (quality === 3) {
    reps = prevReps + 1;
    if (reps === 1) intervalDays = 1;
    else if (reps === 2) intervalDays = 3;
    else intervalDays = Math.round(prevInterval * ease);

    nextReviewAt = now + intervalDays * 86400 * 1000;
    status = intervalDays >= 7 ? 'mastered' : 'review';
  } else if (quality === 4) {
    reps = prevReps + 1;
    if (reps === 1) intervalDays = 4;
    else if (reps === 2) intervalDays = 7;
    else intervalDays = Math.round(prevInterval * ease * 1.3);

    ease = Math.min(3.0, ease + 0.15);
    nextReviewAt = now + intervalDays * 86400 * 1000;
    status = 'mastered';
  }

  return {
    reps,
    intervalDays,
    ease,
    lastReviewedAt: now,
    nextReviewAt,
    status,
  };
}

export default function VocabularyPage() {
  const allWords = useMemo(() => normalizeVocabList(rawVocabData), []);

  const [srsData, setSrsData] = useState(
    () => storageService.getVocabProgress() || {}
  );

  const [viewMode, setViewMode] = useState('sets'); // 'sets' | 'flashcard' | 'quiz' | 'list'
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [isDueReviewMode, setIsDueReviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // State cho Flashcard & Chế độ Toàn màn hình (Fullscreen Zen Mode)
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFullscreenCard, setIsFullscreenCard] = useState(false);

  // State cho Quiz Kiểm tra Spaced Repetition (Đóng băng bộ đề khi bắt đầu Quiz để không nhảy đáp án)
  const [quizDeck, setQuizDeck] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [quizFinished, setQuizFinished] = useState(false);

  // Chia toàn bộ từ vựng thành các Set (25 từ / Set)
  const vocabSets = useMemo(() => {
    const sets = [];
    const now = Date.now();

    for (let i = 0; i < allWords.length; i += SET_SIZE) {
      const slice = allWords.slice(i, i + SET_SIZE);
      const setNumber = Math.floor(i / SET_SIZE) + 1;

      let masteredCount = 0;
      let learningCount = 0;
      let dueCount = 0;

      slice.forEach((w) => {
        const rec = srsData[w.id];
        if (rec) {
          if (rec.status === 'mastered') masteredCount++;
          else learningCount++;
          if (rec.nextReviewAt && rec.nextReviewAt <= now) {
            dueCount++;
          }
        }
      });

      const newCount = slice.length - masteredCount - learningCount;
      const progressPct =
        slice.length > 0
          ? Math.round(
              ((masteredCount + learningCount * 0.5) / slice.length) * 100
            )
          : 0;

      sets.push({
        id: `set_${setNumber}`,
        setNumber,
        title: `Set ${setNumber}`,
        rangeLabel: `Từ ${i + 1} – ${Math.min(i + SET_SIZE, allWords.length)}`,
        words: slice,
        total: slice.length,
        masteredCount,
        learningCount,
        newCount,
        dueCount,
        progressPct,
      });
    }
    return sets;
  }, [allWords, srsData]);

  // Danh sách các từ ĐẾN HẠN ÔN TẬP (Spaced Repetition Due Queue)
  const dueWordsGlobal = useMemo(() => {
    const now = Date.now();
    return allWords.filter((w) => {
      const rec = srsData[w.id];
      return rec && rec.nextReviewAt && rec.nextReviewAt <= now;
    });
  }, [allWords, srsData]);

  // Thống kê tổng quan toàn bộ kho từ
  const globalStats = useMemo(() => {
    let mastered = 0;
    let learning = 0;
    allWords.forEach((w) => {
      const st = srsData[w.id]?.status;
      if (st === 'mastered') mastered++;
      else if (st === 'learning' || st === 'review') learning++;
    });
    return {
      total: allWords.length,
      mastered,
      learning,
      unseen: Math.max(0, allWords.length - mastered - learning),
      dueNow: dueWordsGlobal.length,
    };
  }, [allWords, srsData, dueWordsGlobal]);

  // Danh sách từ đang được học trong phiên Flashcard
  const studyDeck = useMemo(() => {
    if (isDueReviewMode) {
      return dueWordsGlobal.length > 0
        ? dueWordsGlobal
        : vocabSets[activeSetIndex]?.words || [];
    }
    const baseWords = vocabSets[activeSetIndex]?.words || [];
    if (statusFilter === 'all') return baseWords;

    const now = Date.now();
    return baseWords.filter((w) => {
      const rec = srsData[w.id];
      if (statusFilter === 'new') return !rec;
      if (statusFilter === 'learning') return rec && rec.status !== 'mastered';
      if (statusFilter === 'mastered') return rec && rec.status === 'mastered';
      if (statusFilter === 'due') return rec && rec.nextReviewAt <= now;
      return true;
    });
  }, [
    isDueReviewMode,
    dueWordsGlobal,
    vocabSets,
    activeSetIndex,
    statusFilter,
    srsData,
  ]);

  const currentCard = studyDeck[cardIdx] || studyDeck[0];

  // Cố định danh sách câu hỏi Quiz và chỉ phụ thuộc vào ID của từ mục tiêu để KHÔNG BAO GIỜ nhảy đáp án A,B,C,D khi bấm chọn
  const activeQuizPool = quizDeck.length > 0 ? quizDeck : studyDeck;
  const currentQuizTargetId = activeQuizPool[quizIdx]?.id;

  const currentQuizQuestion = useMemo(() => {
    const target = allWords.find((w) => w.id === currentQuizTargetId);
    if (!target) return null;

    const distractors = allWords
      .filter((w) => w.id !== target.id && w.meaning)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const choices = [target, ...distractors].sort(() => 0.5 - Math.random());
    return {
      target,
      choices,
    };
  }, [currentQuizTargetId, allWords]);

  // Phát âm từ vựng chuẩn US English
  const speakWord = (text, e) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  };

  // Lưu đánh giá Spaced Repetition khi học Flashcard (Có chờ úp thẻ 3D rồi mới sang từ mới)
  const handleRateCard = (quality) => {
    if (!currentCard) return;
    const prevRec = srsData[currentCard.id];
    const nextRec = computeNextSrsState(prevRec, quality);

    const updated = {
      ...srsData,
      [currentCard.id]: nextRec,
    };
    setSrsData(updated);
    storageService.saveVocabProgress(updated);

    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => {
        setCardIdx((i) => (i < studyDeck.length - 1 ? i + 1 : 0));
      }, 220);
    } else {
      setCardIdx((i) => (i < studyDeck.length - 1 ? i + 1 : 0));
    }
  };

  const handlePrevCard = (e) => {
    if (e) e.stopPropagation();
    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => {
        setCardIdx(
          (i) => (i - 1 + studyDeck.length) % Math.max(1, studyDeck.length)
        );
      }, 150);
    } else {
      setCardIdx(
        (i) => (i - 1 + studyDeck.length) % Math.max(1, studyDeck.length)
      );
    }
  };

  const handleNextCard = (e) => {
    if (e) e.stopPropagation();
    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => {
        setCardIdx((i) => (i + 1) % Math.max(1, studyDeck.length));
      }, 150);
    } else {
      setCardIdx((i) => (i + 1) % Math.max(1, studyDeck.length));
    }
  };

  // Phím tắt bàn phím khi học Flashcard (Space: lật thẻ, 1-2-3-4: chấm điểm, F: Toàn màn hình, Esc: thoát toàn màn hình)
  useEffect(() => {
    if (viewMode !== 'flashcard') return;
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === '1') {
        handleRateCard(1);
      } else if (e.key === '2') {
        handleRateCard(2);
      } else if (e.key === '3') {
        handleRateCard(3);
      } else if (e.key === '4') {
        handleRateCard(4);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFullscreenCard((prev) => !prev);
      } else if (e.key === 'Escape' && isFullscreenCard) {
        setIsFullscreenCard(false);
      } else if (e.key === 'ArrowRight') {
        handleNextCard();
      } else if (e.key === 'ArrowLeft') {
        handlePrevCard();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  // Xử lý chọn đáp án trong chế độ Quiz Kiểm tra định kỳ
  const handleSelectQuizOption = (choice) => {
    if (quizSelected || !currentQuizQuestion) return;
    setQuizSelected(choice.id);

    const target = currentQuizQuestion.target;
    const isCorrect = choice.id === target.id;

    const prevRec = srsData[target.id];
    const nextRec = computeNextSrsState(prevRec, isCorrect ? 3 : 1);
    const updated = {
      ...srsData,
      [target.id]: nextRec,
    };
    setSrsData(updated);
    storageService.saveVocabProgress(updated);

    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNextQuizQuestion = () => {
    setQuizSelected(null);
    if (quizIdx < activeQuizPool.length - 1) {
      setQuizIdx((i) => i + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const startSetStudy = (setIdx, mode = 'flashcard') => {
    const targetWords = vocabSets[setIdx]?.words || [];
    setIsDueReviewMode(false);
    setActiveSetIndex(setIdx);
    setStatusFilter('all');
    setCardIdx(0);
    setIsFlipped(false);
    setQuizDeck([...targetWords]);
    setQuizIdx(0);
    setQuizSelected(null);
    setQuizScore({ correct: 0, total: 0 });
    setQuizFinished(false);
    setViewMode(mode);
  };

  const startDueReviewSession = (mode = 'quiz') => {
    if (dueWordsGlobal.length === 0) {
      alert(
        'Tuyệt vời! Hiện tại bạn không có từ vựng nào đến hạn phải ôn tập.'
      );
      return;
    }
    const snapshotDue = [...dueWordsGlobal];
    setIsDueReviewMode(true);
    setCardIdx(0);
    setIsFlipped(false);
    setQuizDeck(snapshotDue);
    setQuizIdx(0);
    setQuizSelected(null);
    setQuizScore({ correct: 0, total: 0 });
    setQuizFinished(false);
    setViewMode(mode);
  };

  const formatNextReviewLabel = (wordId) => {
    const rec = srsData[wordId];
    if (!rec) return 'Chưa học';
    const diffMs = (rec.nextReviewAt || 0) - Date.now();
    if (diffMs <= 0) return '🔥 Đến hạn ôn ngay';
    const hours = Math.ceil(diffMs / (1000 * 3600));
    if (hours < 24) return `Ôn sau ${hours} giờ`;
    const days = Math.ceil(hours / 24);
    return `Ôn sau ${days} ngày`;
  };

  /**
   * Component con hiển thị Thẻ 3D + 4 nút đánh giá SRS (Dùng chung cho cả màn hình thường và Toàn màn hình)
   */
  const renderFlashcardWorkspace = (isFull = false) => {
    if (!currentCard) return null;
    const progressPct =
      studyDeck.length > 0
        ? Math.round(((cardIdx + 1) / studyDeck.length) * 100)
        : 0;

    return (
      <div
        className={
          isFull
            ? 'fixed inset-0 z-50 bg-[#050811] text-slate-100 flex flex-col justify-between p-5 sm:p-8 lg:p-12 select-none overflow-y-auto'
            : 'max-w-3xl mx-auto space-y-6'
        }
      >
        {/* Thanh điều khiển trên cùng của Flashcard */}
        <div className="w-full max-w-4xl mx-auto space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 px-4 py-3 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300">Lọc thẻ:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'new', label: 'Chưa học' },
                { id: 'learning', label: 'Đang học' },
                { id: 'due', label: 'Cần ôn lại' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(f.id);
                    setCardIdx(0);
                    setIsFlipped(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    statusFilter === f.id
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-cyan-300">
                Thẻ {cardIdx + 1} / {studyDeck.length} •{' '}
                {formatNextReviewLabel(currentCard.id)}
              </span>

              <button
                type="button"
                onClick={() => setIsFullscreenCard(!isFullscreenCard)}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/40 text-cyan-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition"
                title="Phím tắt: F hoặc Esc"
              >
                {isFull ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Thu nhỏ (Esc)</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Toàn màn hình (F)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Thanh tiến độ mảnh khi ở chế độ Toàn màn hình */}
          {isFull && (
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-300"
              />
            </div>
          )}
        </div>

        {/* KHỐI THẺ FLASHCARD LẬT 3D MƯỢT MÀ (600ms) KÈM NÚT ĐIỀU HƯỚNG 2 BÊN */}
        <div className="w-full max-w-4xl mx-auto flex items-center gap-3 sm:gap-5 my-auto py-2">
          <button
            type="button"
            onClick={handlePrevCard}
            className="hidden sm:flex w-11 h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 items-center justify-center text-slate-300 hover:text-white cursor-pointer transition shrink-0 shadow-lg"
            title="Thẻ trước (Phím ←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ perspective: '1400px' }}
            className={`flex-1 cursor-pointer select-none ${
              isFull ? 'h-[430px] sm:h-[480px]' : 'h-[380px] sm:h-[400px]'
            }`}
          >
            <div
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
              className="relative w-full h-full rounded-3xl shadow-2xl"
            >
              {/* MẶT TRƯỚC (FRONT FACE - 0 ĐỘ) */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#131d38] to-[#0f172a] border-2 border-indigo-500/40 hover:border-cyan-400/70 p-8 sm:p-12 flex flex-col justify-between shadow-[0_0_50px_rgba(30,58,138,0.25)]"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
                    {isDueReviewMode
                      ? '🔥 Ôn tập Spaced Repetition'
                      : `Set ${activeSetIndex + 1}`}{' '}
                    • {currentCard.partOfSpeech}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => speakWord(currentCard.word, e)}
                    className="p-3 rounded-full bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 transition cursor-pointer"
                    title="Nghe phát âm chuẩn Mỹ"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="my-auto text-center space-y-4">
                  <h2
                    className={`font-black text-white tracking-tight ${
                      isFull
                        ? 'text-5xl sm:text-6xl lg:text-7xl'
                        : 'text-4xl sm:text-5xl'
                    }`}
                  >
                    {currentCard.word}
                  </h2>
                  {currentCard.phonetic && (
                    <p
                      className={`font-mono text-cyan-300 ${
                        isFull ? 'text-lg sm:text-xl' : 'text-base'
                      }`}
                    >
                      {currentCard.phonetic}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 pt-4">
                    (Bấm vào thẻ hoặc nhấn phím{' '}
                    <kbd className="px-2 py-0.5 bg-slate-800 border border-white/10 rounded text-slate-200">
                      Space
                    </kbd>{' '}
                    để lật thẻ 3D)
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/10">
                  <span>Mức độ: {currentCard.level}</span>
                  <span className="text-cyan-400 font-semibold">
                    Mặt trước • Chạm để lật ↻
                  </span>
                </div>
              </div>

              {/* MẶT SAU (BACK FACE - XOAY 180 ĐỘ) */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
                className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-[#0d1f2d] via-[#111c35] to-[#0b1324] border-2 border-cyan-400/70 p-7 sm:p-10 flex flex-col justify-between overflow-y-auto shadow-[0_0_50px_rgba(34,211,238,0.15)]"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
                    {currentCard.word} ({currentCard.partOfSpeech})
                  </span>

                  <button
                    type="button"
                    onClick={(e) => speakWord(currentCard.word, e)}
                    className="p-2.5 rounded-full bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 transition cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="my-auto space-y-4 py-2">
                  <div>
                    <div className="text-[11px] font-bold uppercase text-cyan-400 tracking-wider">
                      Nghĩa học thuật cốt lõi:
                    </div>
                    <div
                      className={`font-extrabold text-white mt-1 ${
                        isFull
                          ? 'text-3xl sm:text-4xl'
                          : 'text-2xl sm:text-3xl'
                      }`}
                    >
                      {currentCard.meaning}
                    </div>
                  </div>

                  {currentCard.definitionEn && (
                    <p
                      className={`text-slate-300 italic ${
                        isFull ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                      }`}
                    >
                      {currentCard.definitionEn}
                    </p>
                  )}

                  <div className="p-4 rounded-2xl bg-slate-950/85 border border-white/10 space-y-1.5">
                    <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                      Ngữ cảnh bài đọc Digital SAT:
                    </div>
                    <p
                      className={`text-slate-200 font-serif leading-relaxed ${
                        isFull ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                      }`}
                    >
                      &ldquo;{currentCard.example}&rdquo;
                    </p>
                  </div>

                  {currentCard.synonyms?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">
                        Đồng nghĩa SAT:
                      </span>
                      {currentCard.synonyms.map((syn, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/10">
                  <span>Mức độ: {currentCard.level}</span>
                  <span className="text-emerald-300 font-semibold">
                    Mặt sau • Chạm để úp lại ↺
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextCard}
            className="hidden sm:flex w-11 h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 items-center justify-center text-slate-300 hover:text-white cursor-pointer transition shrink-0 shadow-lg"
            title="Thẻ tiếp theo (Phím →)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 4 NÚT ĐÁNH GIÁ SPACED REPETITION CHUẨN ANKI */}
        <div className="w-full max-w-4xl mx-auto space-y-2">
          <div className="text-center text-xs text-slate-400 font-semibold">
            Đánh giá mức độ nhớ (Phím tắt{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">1</kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">2</kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">3</kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">4</kbd>
            ):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => handleRateCard(1)}
              className="p-3.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-200 flex flex-col items-center gap-1 cursor-pointer transition"
            >
              <span className="text-xs font-black uppercase">
                1. Quên (Again)
              </span>
              <span className="text-[11px] font-mono text-rose-300">
                Lặp lại sau 10 phút
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRateCard(2)}
              className="p-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 flex flex-col items-center gap-1 cursor-pointer transition"
            >
              <span className="text-xs font-black uppercase">
                2. Khó (Hard)
              </span>
              <span className="text-[11px] font-mono text-amber-300">
                Kiểm tra sau 1 ngày
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRateCard(3)}
              className="p-3.5 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 flex flex-col items-center gap-1 cursor-pointer transition"
            >
              <span className="text-xs font-black uppercase">
                3. Nhớ (Good)
              </span>
              <span className="text-[11px] font-mono text-cyan-300">
                Kiểm tra sau 3–5 ngày
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRateCard(4)}
              className="p-3.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 flex flex-col items-center gap-1 cursor-pointer transition"
            >
              <span className="text-xs font-black uppercase">
                4. Thuộc lòng (Easy)
              </span>
              <span className="text-[11px] font-mono text-emerald-300">
                Kiểm tra sau 7–14+ ngày
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-7 select-none font-sans text-slate-100">
      {/* =================================================================== */}
      {/* 1. BANNER TỔNG QUAN SPACED REPETITION (SRS COMMAND CENTER)           */}
      {/* =================================================================== */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0d152e] via-[#162044] to-[#0d152e] border border-indigo-500/30 p-6 lg:p-8 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
              <Brain className="w-3.5 h-3.5" />
              <span>
                SPACED REPETITION (SM-2) • {vocabSets.length} SETS (25 TỪ/SET)
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Kho Từ Vựng Học Thuật Digital SAT C1–C2
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Được chia nhỏ thành <strong>{vocabSets.length} Set</strong> (mỗi Set
              25 từ) kết hợp thuật toán lặp lại ngắt quãng{' '}
              <strong>Spaced Repetition</strong> tự động tính thời điểm rơi của
              trí nhớ để nhắc bạn kiểm tra lại trước khi quên.
            </p>
          </div>

          <div className="bg-slate-950/85 border border-amber-400/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 shrink-0 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Flame className="w-6 h-6 fill-amber-400/30" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Cần ôn tập hôm nay
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {globalStats.dueNow}{' '}
                  <span className="text-xs font-sans font-semibold text-slate-400">
                    từ đến hạn
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startDueReviewSession('quiz')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Kiểm tra ngay ({globalStats.dueNow})</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-slate-900/70 rounded-2xl p-3.5 border border-white/5">
            <div className="text-[11px] text-slate-400 font-bold">
              Tổng kho từ SAT
            </div>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {globalStats.total} từ ({vocabSets.length} Set)
            </div>
          </div>
          <div className="bg-slate-900/70 rounded-2xl p-3.5 border border-emerald-500/20">
            <div className="text-[11px] text-emerald-400 font-bold">
              Đã thuộc dài hạn (Mastered)
            </div>
            <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">
              {globalStats.mastered} từ
            </div>
          </div>
          <div className="bg-slate-900/70 rounded-2xl p-3.5 border border-cyan-500/20">
            <div className="text-[11px] text-cyan-400 font-bold">
              Đang ghi nhớ (Learning)
            </div>
            <div className="text-xl font-black text-cyan-300 font-mono mt-0.5">
              {globalStats.learning} từ
            </div>
          </div>
          <div className="bg-slate-900/70 rounded-2xl p-3.5 border border-white/5">
            <div className="text-[11px] text-slate-400 font-bold">
              Chưa chạm tới (New)
            </div>
            <div className="text-xl font-black text-slate-300 font-mono mt-0.5">
              {globalStats.unseen} từ
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. THANH CHUYỂN ĐỔI CHẾ ĐỘ (CHỌN SET | FLASHCARD | QUIZ | TRA CỨU)   */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0b1021]/95 border border-indigo-500/25 rounded-2xl p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsDueReviewMode(false);
              setViewMode('sets');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              viewMode === 'sets'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Danh sách {vocabSets.length} Set</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('flashcard')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              viewMode === 'flashcard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              Học Flashcard (
              {isDueReviewMode
                ? 'Ôn từ đến hạn'
                : `Set ${activeSetIndex + 1}`}
              )
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isDueReviewMode) {
                setQuizDeck([...(vocabSets[activeSetIndex]?.words || [])]);
              }
              setQuizIdx(0);
              setQuizSelected(null);
              setQuizScore({ correct: 0, total: 0 });
              setQuizFinished(false);
              setViewMode('quiz');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              viewMode === 'quiz'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>
              Kiểm tra SRS Quiz (
              {isDueReviewMode ? 'Từ đến hạn' : `Set ${activeSetIndex + 1}`})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bảng từ & Chu kỳ nhớ</span>
          </button>
        </div>

        {viewMode !== 'sets' && !isDueReviewMode && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Đang chọn:</span>
            <select
              value={activeSetIndex}
              onChange={(e) => startSetStudy(Number(e.target.value), viewMode)}
              className="bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs font-extrabold text-cyan-300 focus:outline-none cursor-pointer"
            >
              {vocabSets.map((s, idx) => (
                <option key={s.id} value={idx}>
                  {s.title} ({s.rangeLabel})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 3A. CHẾ ĐỘ 1: LƯỚI DANH SÁCH CÁC SET (25 TỪ / SET)                  */}
      {/* =================================================================== */}
      {viewMode === 'sets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {vocabSets.map((setItem, sIdx) => (
            <div
              key={setItem.id}
              className="bg-[#0c1224]/95 hover:bg-[#101932] border border-indigo-500/20 hover:border-cyan-400/50 rounded-3xl p-5 flex flex-col justify-between transition-all shadow-lg"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono text-xs font-black">
                    {setItem.title}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {setItem.rangeLabel}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {setItem.words.slice(0, 5).map((w) => (
                    <span
                      key={w.id}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-[11px] font-semibold text-slate-200"
                    >
                      {w.word}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 text-[11px] text-slate-400 font-semibold">
                    +{Math.max(0, setItem.total - 5)} từ
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                  <div className="bg-slate-900/90 rounded-xl p-2 border border-white/5">
                    <div className="text-[10px] text-emerald-400 font-bold">
                      Thuộc
                    </div>
                    <div className="text-sm font-black text-white font-mono">
                      {setItem.masteredCount}
                    </div>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2 border border-white/5">
                    <div className="text-[10px] text-cyan-400 font-bold">
                      Đang học
                    </div>
                    <div className="text-sm font-black text-white font-mono">
                      {setItem.learningCount}
                    </div>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2 border border-white/5">
                    <div className="text-[10px] text-amber-400 font-bold">
                      Đến hạn
                    </div>
                    <div className="text-sm font-black text-amber-300 font-mono">
                      {setItem.dueCount}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Tiến độ ghi nhớ</span>
                    <span className="text-cyan-300 font-mono">
                      {setItem.progressPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${setItem.progressPct}%` }}
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => startSetStudy(sIdx, 'flashcard')}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Học Thẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => startSetStudy(sIdx, 'quiz')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Test SRS</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =================================================================== */}
      {/* 3B. CHẾ ĐỘ 2: HỌC FLASHCARD 3D FLIP (HỖ TRỢ TOÀN MÀN HÌNH)          */}
      {/* =================================================================== */}
      {viewMode === 'flashcard' && renderFlashcardWorkspace(isFullscreenCard)}

      {/* =================================================================== */}
      {/* 3C. CHẾ ĐỘ 3: KIỂM TRA PHẢN XẠ SPACED REPETITION QUIZ               */}
      {/* =================================================================== */}
      {viewMode === 'quiz' && (
        <div className="max-w-2xl mx-auto">
          {quizFinished ? (
            <div className="bg-[#0c1224] border border-indigo-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
              <Award className="w-14 h-14 text-amber-400 mx-auto" />
              <h2 className="text-2xl font-black text-white">
                Hoàn thành phiên kiểm tra Spaced Repetition!
              </h2>
              <p className="text-sm text-slate-300">
                Bạn trả lời đúng{' '}
                <strong className="text-emerald-400 font-mono text-base">
                  {quizScore.correct} / {quizScore.total}
                </strong>{' '}
                từ vựng. Những từ bạn làm đúng đã được giãn chu kỳ ôn tập xa
                hơn, những từ làm sai đã được đặt lịch nhắc ôn lại sớm!
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => startSetStudy(activeSetIndex, 'quiz')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
                >
                  Làm lại Quiz Set này
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('sets')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold cursor-pointer"
                >
                  Chọn Set tiếp theo
                </button>
              </div>
            </div>
          ) : currentQuizQuestion ? (
            <div className="bg-[#0c1224] border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-white/10 pb-3">
                <span>
                  {isDueReviewMode
                    ? '🔥 Kiểm tra từ đến hạn'
                    : `Kiểm tra Set ${activeSetIndex + 1}`}{' '}
                  • Câu {quizIdx + 1}/{activeQuizPool.length}
                </span>
                <span className="text-emerald-400 font-mono">
                  Đúng: {quizScore.correct}/{quizScore.total}
                </span>
              </div>

              <div className="space-y-2 text-center py-3">
                <span className="text-xs font-bold uppercase text-cyan-400">
                  Chọn nghĩa chính xác nhất của từ:
                </span>
                <div className="flex items-center justify-center gap-3">
                  <h3 className="text-3xl sm:text-4xl font-black text-white">
                    {currentQuizQuestion.target.word}
                  </h3>
                  <button
                    type="button"
                    onClick={() => speakWord(currentQuizQuestion.target.word)}
                    className="p-2 rounded-full bg-slate-800 text-cyan-300 hover:bg-slate-700 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-serif italic max-w-lg mx-auto pt-1">
                  &ldquo;{currentQuizQuestion.target.example}&rdquo;
                </p>
              </div>

              <div className="space-y-3">
                {currentQuizQuestion.choices.map((opt, idx) => {
                  const isCorrectOpt =
                    opt.id === currentQuizQuestion.target.id;
                  const isChosen = quizSelected === opt.id;

                  let btnStyle =
                    'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-cyan-400/60';
                  if (quizSelected) {
                    if (isCorrectOpt) {
                      btnStyle =
                        'bg-emerald-950/60 border-2 border-emerald-400 text-white';
                    } else if (isChosen && !isCorrectOpt) {
                      btnStyle =
                        'bg-rose-950/60 border-2 border-rose-500 text-rose-200';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectQuizOption(opt)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 font-mono text-xs font-bold flex items-center justify-center">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm font-bold">{opt.meaning}</span>
                      </div>
                      {quizSelected && isCorrectOpt && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {quizSelected && isChosen && !isCorrectOpt && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {quizSelected && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextQuizQuestion}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
                  >
                    {quizIdx < activeQuizPool.length - 1
                      ? 'Câu tiếp theo →'
                      : 'Xem kết quả'}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* =================================================================== */}
      {/* 3D. CHẾ ĐỘ 4: BẢNG TRA CỨU TỪ VỰNG & LỊCH ÔN TẬP SRS                */}
      {/* =================================================================== */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ vựng hoặc nghĩa tiếng Việt..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="bg-[#0c1224] border border-indigo-500/20 rounded-3xl overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-slate-900/90 border-b border-white/10 text-[11px] font-extrabold text-slate-400 uppercase">
              <div className="col-span-3">Từ vựng</div>
              <div className="col-span-4">Nghĩa học thuật</div>
              <div className="col-span-3">Lịch Spaced Repetition</div>
              <div className="col-span-2 text-right">Đánh dấu nhanh</div>
            </div>

            <div className="divide-y divide-white/5 max-h-[540px] overflow-y-auto">
              {(searchQuery.trim()
                ? allWords.filter(
                    (w) =>
                      w.word
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      w.meaning
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                : studyDeck
              ).map((w) => {
                const rec = srsData[w.id];
                return (
                  <div
                    key={w.id}
                    className="grid grid-cols-12 gap-3 px-6 py-3.5 items-center hover:bg-white/5 text-xs"
                  >
                    <div className="col-span-3 font-extrabold text-white flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speakWord(w.word)}
                        className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <span>{w.word}</span>
                    </div>
                    <div className="col-span-4 text-slate-300">{w.meaning}</div>
                    <div className="col-span-3 font-mono text-[11px]">
                      <span
                        className={`px-2.5 py-1 rounded-full ${
                          rec?.status === 'mastered'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : rec
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {formatNextReviewLabel(w.id)}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...srsData,
                            [w.id]: computeNextSrsState(rec, 1),
                          };
                          setSrsData(updated);
                          storageService.saveVocabProgress(updated);
                        }}
                        className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold cursor-pointer"
                      >
                        Quên
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...srsData,
                            [w.id]: computeNextSrsState(rec, 4),
                          };
                          setSrsData(updated);
                          storageService.saveVocabProgress(updated);
                        }}
                        className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold cursor-pointer"
                      >
                        Đã thuộc
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}