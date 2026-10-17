// src/pages/VocabularyPage.jsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Search,
  RotateCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shuffle,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import mockVocab from '../data/mockVocab.json';
import { storageService } from '../services/storageService';

const SAT_MASTER_DICTIONARY = {
  presuppose: { pos: 'v', phonetic: '/ˌpriː.səˈpəʊz/', meaning: 'Giả định trước, hàm ý cần có trước (như điều kiện tiên quyết)', definitionEn: 'Tacitly assume at the beginning of a line of argument or course of action to be the case.', example: 'This scientific theory presupposes the existence of dark matter.' },
  incongruous: { pos: 'adj', phonetic: '/ɪnˈkɒŋ.ɡru.əs/', meaning: 'Không phù hợp, lạc lõng, kệch cỡm (so với xung quanh)', definitionEn: 'Not in harmony or keeping with the surroundings or other aspects of something.', example: 'The modern glass pyramid looked incongruous beside the medieval cathedral.' },
  subordinate: { pos: 'adj / v', phonetic: '/səˈbɔː.dɪ.nət/', meaning: 'Cấp dưới, phụ thuộc; xếp xuống hàng thứ yếu', definitionEn: 'Lower in rank or position; treat or regard as of lesser importance than something else.', example: 'In his historical novels, individual characters are often subordinate to grand social forces.' },
  abate: { pos: 'v', phonetic: '/əˈbeɪt/', meaning: 'Làm dịu đi, giảm bớt, suy yếu dần (cơn bão, cường độ)', definitionEn: 'Become less intense or widespread; make something less intense.', example: 'The explorers waited in the cave for the fierce snowstorm to abate.' },
  simplify: { pos: 'v', phonetic: '/ˈsɪm.plɪ.faɪ/', meaning: 'Đơn giản hóa, làm cho dễ hiểu hơn', definitionEn: 'Make (something) simpler or easier to do or understand.', example: 'The physicist used an analogy to simplify the complex principles of quantum entanglement.' },
  replicate: { pos: 'v', phonetic: '/ˈrep.lɪ.keɪt/', meaning: 'Tái tạo, sao chép y hệt, lặp lại (một thí nghiệm/kết quả)', definitionEn: 'Make an exact copy of; reproduce a scientific experiment to confirm results.', example: 'Independent laboratories were unable to replicate the controversial findings.' },
  eschew: { pos: 'v', phonetic: '/ɪsˈtʃuː/', meaning: 'Cố ý tránh xa, kiêng kỵ, từ bỏ (vì lý do đạo đức/nguyên tắc)', definitionEn: 'Deliberately avoid using; abstain from.', example: 'The minimalist architect eschewed ornate decorations in favor of clean geometric lines.' },
  anticipate: { pos: 'v', phonetic: '/ænˈtɪs.ɪ.peɪt/', meaning: 'Dự đoán trước, lường trước, kỳ vọng', definitionEn: 'Regard as probable; expect or predict and take action to prepare.', example: 'Ecologists anticipate that rising sea temperatures will alter migration routes.' },
  engender: { pos: 'v', phonetic: '/ɪnˈdʒen.dər/', meaning: 'Sinh ra, gây ra, làm nảy sinh (cảm xúc, tình huống)', definitionEn: 'Cause or give rise to (a feeling, situation, or condition).', example: 'The ambiguous policy engendered widespread confusion among researchers.' },
  vindicate: { pos: 'v', phonetic: '/ˈvɪn.dɪ.keɪt/', meaning: 'Minh oan, chứng minh là đúng đắn/hợp lý', definitionEn: 'Clear (someone) of blame or suspicion; show or prove to be right, reasonable, or justified.', example: 'Subsequent archaeological discoveries vindicated her bold hypothesis.' },
  repudiate: { pos: 'v', phonetic: '/rɪˈpjuː.di.eɪt/', meaning: 'Bác bỏ, từ chối công nhận, phủ nhận', definitionEn: 'Refuse to accept or be associated with; deny the truth or validity of.', example: 'The scientist repudiated the flawed claims made in the earlier study.' },
  corroborate: { pos: 'v', phonetic: '/kəˈrɒb.ə.reɪt/', meaning: 'Củng cố, xác nhận, làm bằng chứng bổ trợ', definitionEn: 'Confirm or give support to (a statement, theory, or finding).', example: 'Recent ice-core samples corroborate the climatologist’s model.' },
  equivocal: { pos: 'adj', phonetic: '/ɪˈkwɪv.ə.kəl/', meaning: 'Mập mờ, nước đôi, đa nghĩa, không rõ ràng', definitionEn: 'Open to more than one interpretation; ambiguous.', example: 'The survey produced equivocal data that could not resolve the debate.' },
  meticulous: { pos: 'adj', phonetic: '/məˈtɪk.jə.ləs/', meaning: 'Tỉ mỉ, kỹ lưỡng, cẩn trọng từng chi tiết nhỏ', definitionEn: 'Showing great attention to detail; very careful and precise.', example: 'Her meticulous restoration revealed hidden layers of paint on the canvas.' },
  subvert: { pos: 'v', phonetic: '/səbˈvɜːt/', meaning: 'Lật đổ, phá vỡ ngầm (quy chuẩn, hệ thống)', definitionEn: 'Undermine the power and authority of an established system or institution.', example: 'The playwright sought to subvert conventional theatrical tropes.' },
  substantiate: { pos: 'v', phonetic: '/səbˈstæn.ʃi.eɪt/', meaning: 'Chứng minh bằng dẫn chứng thực tế', definitionEn: 'Provide evidence to support or prove the truth of.', example: 'The journalist could not substantiate the rumor with credible sources.' },
  mitigate: { pos: 'v', phonetic: '/ˈmɪt.ɪ.ɡeɪt/', meaning: 'Làm giảm nhẹ, xoa dịu (mức độ nghiêm trọng)', definitionEn: 'Make less severe, serious, or painful.', example: 'Planting urban trees helps mitigate the heat-island effect.' },
  idiosyncratic: { pos: 'adj', phonetic: '/ˌɪd.i.ə.sɪŋˈkræt.ɪk/', meaning: 'Mang nét đặc thù cá nhân, độc đáo khác biệt', definitionEn: 'Peculiar or individual.', example: 'The composer’s idiosyncratic rhythms are immediately recognizable.' },
  preclude: { pos: 'v', phonetic: '/prɪˈkluːd/', meaning: 'Ngăn cản, loại trừ khả năng xảy ra', definitionEn: 'Prevent from happening; make impossible.', example: 'A lack of funding precluded the team from expanding the clinical trial.' },
  supplant: { pos: 'v', phonetic: '/səˈplɑːnt/', meaning: 'Thay thế, chiếm chỗ, soán ngôi', definitionEn: 'Supersede and replace.', example: 'Automobiles rapidly supplanted horse-drawn carriages in the early 20th century.' },
  discern: { pos: 'v', phonetic: '/dɪˈsɜːn/', meaning: 'Nhận thức rõ, phân biệt được, nhìn thấu', definitionEn: 'Perceive or recognize (something).', example: 'Astronomers discerned faint radio signals from the distant pulsar.' },
  evince: { pos: 'v', phonetic: '/ɪˈvɪns/', meaning: 'Bộc lộ rõ, biểu thị, chứng tỏ', definitionEn: 'Reveal the presence of (a quality or feeling); indicate.', example: 'The letters evince a deep commitment to social reform.' },
  contentious: { pos: 'adj', phonetic: '/kənˈten.ʃəs/', meaning: 'Gây nhiều tranh cãi, dễ dẫn đến bất đồng', definitionEn: 'Causing or likely to cause an argument; controversial.', example: 'Taxation policy remains a contentious issue in legislative debates.' },
  preempt: { pos: 'v', phonetic: '/priːˈempt/', meaning: 'Hành động đi trước để ngăn chặn, chiếm chỗ trước', definitionEn: 'Take action in order to prevent (an anticipated event) from happening.', example: 'The committee released a report to preempt unfounded criticism.' },
  ameliorate: { pos: 'v', phonetic: '/əˈmiː.li.ə.reɪt/', meaning: 'Cải thiện, làm cho tốt hơn (tình cảnh khó khăn)', definitionEn: 'Make (something bad or unsatisfactory) better.', example: 'Conservation efforts have helped ameliorate habitat loss.' },
  ubiquitous: { pos: 'adj', phonetic: '/juːˈbɪk.wɪ.təs/', meaning: 'Có mặt ở khắp mọi nơi, cực kỳ phổ biến', definitionEn: 'Present, appearing, or found everywhere.', example: 'Microplastics have become ubiquitous in marine ecosystems.' },
  ephemeral: { pos: 'adj', phonetic: '/ɪˈfem.ər.əl/', meaning: 'Ngắn ngủi, phù du, chóng tàn', definitionEn: 'Lasting for a very short time.', example: 'Internet trends are notoriously ephemeral.' },
  ostensible: { pos: 'adj', phonetic: '/ɒˈsten.sə.bəl/', meaning: 'Có vẻ bề ngoài là vậy (nhưng ẩn giấu động cơ khác)', definitionEn: 'Stated or appearing to be true, but not necessarily so.', example: 'Despite his ostensible neutrality, he favored the new proposal.' },
  pragmatic: { pos: 'adj', phonetic: '/præɡˈmæt.ɪk/', meaning: 'Thực tế, thực dụng, ưu tiên tính khả thi', definitionEn: 'Dealing with things sensibly and realistically.', example: 'City planners took a pragmatic approach to flood control.' },
  tenuous: { pos: 'adj', phonetic: '/ˈten.ju.əs/', meaning: 'Mỏng manh, yếu ớt, thiếu căn cứ vững chắc', definitionEn: 'Very weak or slight.', example: 'The link between the two phenomena proved tenuous.' },
  bolster: { pos: 'v', phonetic: '/ˈbəʊl.stər/', meaning: 'Củng cố, tiếp thêm sức mạnh, ủng hộ', definitionEn: 'Support or strengthen.', example: 'Strong export numbers bolstered the national economy.' },
  ambivalent: { pos: 'adj', phonetic: '/æmˈbɪv.ə.lənt/', meaning: 'Lưỡng lự, mâu thuẫn cảm xúc (vừa thích vừa e ngại)', definitionEn: 'Having mixed feelings or contradictory ideas.', example: 'Critics were ambivalent about the director’s experimental film.' },
  placate: { pos: 'v', phonetic: '/pləˈkeɪt/', meaning: 'Xoa dịu, làm nguôi cơn giận', definitionEn: 'Make (someone) less angry or hostile.', example: 'The company offered refunds to placate unhappy customers.' },
  esoteric: { pos: 'adj', phonetic: '/ˌes.əˈter.ɪk/', meaning: 'Bí hiểm, chuyên sâu (chỉ giới chuyên môn mới hiểu)', definitionEn: 'Likely to be understood by only a small number of people with specialized knowledge.', example: 'The treatise is filled with esoteric philosophical terminology.' },
  proliferate: { pos: 'v', phonetic: '/prəˈlɪf.ər.eɪt/', meaning: 'Sinh sôi, phát triển nhanh về số lượng', definitionEn: 'Increase rapidly in numbers; multiply.', example: 'Solar energy installations have proliferated over the past decade.' },
};

const VIETNAMESE_CHAR_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function normalizeVocabItem(item, idx, dynamicCache = {}) {
  if (typeof item === 'string') {
    const cleanW = item.trim();
    const dict = SAT_MASTER_DICTIONARY[cleanW.toLowerCase()] || dynamicCache[cleanW.toLowerCase()] || {};
    return {
      id: `vocab_${idx}`,
      word: cleanW,
      phonetic: dict.phonetic || '',
      partOfSpeech: dict.pos || 'v / adj',
      meaning: dict.meaning || '',
      definitionEn: dict.definitionEn || '',
      example: dict.example || `In SAT passages, "${cleanW}" conveys an important analytical nuance.`,
      synonyms: dict.synonyms || ['academic', 'formal'],
      level: 'SAT Core',
    };
  }

  const rawWord = String(
    item.word || item.term || item.vocab || item.vocabulary || item.name || item.en || `Word #${idx + 1}`
  ).trim();

  const lowerWord = rawWord.toLowerCase();
  const dictLookup = SAT_MASTER_DICTIONARY[lowerWord] || dynamicCache[lowerWord] || {};

  let detectedVietnamese = '';
  let detectedEnglishDef = '';
  if (item && typeof item === 'object') {
    for (const [k, v] of Object.entries(item)) {
      if (typeof v === 'string' && v.trim().length > 2 && k !== 'word' && k !== 'id' && k !== 'example') {
        if (VIETNAMESE_CHAR_REGEX.test(v) && !detectedVietnamese) {
          detectedVietnamese = v.trim();
        } else if (v.trim().split(' ').length >= 3 && !detectedEnglishDef) {
          detectedEnglishDef = v.trim();
        }
      }
    }
  }

  const rawMeaning =
    item.meaning ||
    item.vietnamese ||
    item.vi ||
    item.meaningVi ||
    item.definitionVi ||
    item.translation ||
    item.nghia ||
    detectedVietnamese ||
    dictLookup.meaning ||
    item.definition ||
    item.def ||
    detectedEnglishDef ||
    '';

  const rawDefEn =
    item.definitionEn ||
    item.englishDefinition ||
    item.definition ||
    item.def ||
    dictLookup.definitionEn ||
    detectedEnglishDef ||
    '';

  const rawPos =
    item.partOfSpeech ||
    item.pos ||
    item.type ||
    item.wordClass ||
    dictLookup.pos ||
    'sat';

  const rawPhonetic =
    item.phonetic ||
    item.pronunciation ||
    item.ipa ||
    dictLookup.phonetic ||
    '';

  const rawExample =
    item.example ||
    item.exampleSentence ||
    item.sentence ||
    item.context ||
    dictLookup.example ||
    `The author employs the word "${rawWord}" to establish a precise tone in the text.`;

  const rawSynonyms =
    Array.isArray(item.synonyms) && item.synonyms.length > 0
      ? item.synonyms
      : typeof item.synonyms === 'string' && item.synonyms.trim()
      ? item.synonyms.split(',').map((s) => s.trim())
      : dictLookup.synonyms || ['academic', 'context'];

  return {
    id: item.id ? `${item.id}_${idx}` : `vocab_${idx}`,
    word: rawWord,
    phonetic: rawPhonetic,
    partOfSpeech: rawPos,
    meaning: rawMeaning,
    definitionEn: rawDefEn,
    example: rawExample,
    synonyms: rawSynonyms,
    level: item.level || item.difficulty || 'SAT Core',
  };
}

export default function VocabularyPage() {
  const [dynamicDict, setDynamicDict] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sat_dynamic_vocab_cache') || '{}');
    } catch {
      return {};
    }
  });

  const vocabList = useMemo(() => {
    const raw = Array.isArray(mockVocab)
      ? mockVocab
      : mockVocab?.words || mockVocab?.data || mockVocab?.vocabulary || [];
    if (!Array.isArray(raw) || raw.length === 0) {
      return Object.entries(SAT_MASTER_DICTIONARY).map(([w, data], i) =>
        normalizeVocabItem({ word: w, ...data }, i, dynamicDict)
      );
    }
    return raw.map((item, idx) => normalizeVocabItem(item, idx, dynamicDict));
  }, [dynamicDict]);

  const [progressMap, setProgressMap] = useState(() => {
    return storageService.getVocabProgress ? storageService.getVocabProgress() : {};
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Chế độ Phóng to toàn màn hình cho Flashcard
  const [isFullscreen, setIsFullscreen] = useState(false);
  const flashcardZoneRef = useRef(null);

  const filteredWords = useMemo(() => {
    return vocabList.filter((item) => {
      const matchSearch =
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.meaning || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.definitionEn || '').toLowerCase().includes(searchQuery.toLowerCase());
      const st = progressMap[item.id]?.status || 'new';
      const matchFilter = filterStatus === 'all' || st === filterStatus;
      return matchSearch && matchFilter;
    });
  }, [vocabList, searchQuery, filterStatus, progressMap]);

  // Lùi về thẻ từ vựng trước
  const handlePrevCard = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, filteredWords.length)) % Math.max(1, filteredWords.length));
  }, [filteredWords.length]);

  // Tiến tới thẻ từ vựng tiếp theo
  const handleNextCard = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, filteredWords.length));
  }, [filteredWords.length]);

  // Bật / Tắt phóng to toàn màn hình
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next && flashcardZoneRef.current?.requestFullscreen) {
        flashcardZoneRef.current.requestFullscreen().catch(() => {});
      } else if (!next && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      return next;
    });
  }, []);

  // Phím tắt bàn phím: Trái (Lùi thẻ), Phải (Tiến thẻ), Space (Lật thẻ), F (Phóng to)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevCard, handleNextCard, toggleFullscreen, isFullscreen]);

  // Tự động tra cứu nghĩa tiếng Việt cho các từ còn thiếu
  useEffect(() => {
    const missingWords = filteredWords
      .slice(0, 48)
      .filter((w) => !w.meaning || w.meaning.includes('Nghĩa học thuật của'));

    if (missingWords.length === 0) return;
    let isCancelled = false;

    const fetchMissingDefinitions = async () => {
      const newEntries = {};
      for (const item of missingWords.slice(0, 8)) {
        if (isCancelled) break;
        const wKey = item.word.toLowerCase();
        try {
          const transRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&dt=bd&q=${encodeURIComponent(
              item.word
            )}`
          );
          const transData = await transRes.json();
          let viMeaning = transData?.[0]?.[0]?.[0] || '';
          let pos = item.partOfSpeech !== 'sat' ? item.partOfSpeech : 'v / adj';

          if (Array.isArray(transData?.[1]) && transData[1][0]) {
            pos = transData[1][0][0] || pos;
            const terms = transData[1][0][1];
            if (Array.isArray(terms) && terms.length > 0) {
              viMeaning = terms.slice(0, 3).join(', ');
            }
          }

          if (viMeaning) {
            newEntries[wKey] = {
              pos: pos.slice(0, 6),
              meaning: viMeaning.charAt(0).toUpperCase() + viMeaning.slice(1),
            };
          }
        } catch {
          // ignore
        }
      }

      if (!isCancelled && Object.keys(newEntries).length > 0) {
        setDynamicDict((prev) => {
          const merged = { ...prev, ...newEntries };
          try {
            localStorage.setItem('sat_dynamic_vocab_cache', JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        });
      }
    };

    fetchMissingDefinitions();
    return () => {
      isCancelled = true;
    };
  }, [filteredWords]);

  const activeWord = filteredWords[currentIndex] || filteredWords[0] || vocabList[0];

  const handleMarkStatus = (status) => {
    if (!activeWord) return;
    const updated = storageService.saveVocabWordStatus
      ? storageService.saveVocabWordStatus(activeWord.id, { status })
      : { ...progressMap, [activeWord.id]: { status } };
    setProgressMap(updated);
    setIsFlipped(false);
    setTimeout(() => {
      handleNextCard();
    }, 150);
  };

  const handleSpeak = (e, text) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    }
  };

  const masteredCount = Object.values(progressMap).filter((v) => v?.status === 'mastered').length;
  const learningCount = Object.values(progressMap).filter((v) => v?.status === 'learning').length;

  return (
    <div className="min-h-full bg-[#060913] text-slate-100 p-6 lg:p-8 space-y-8 select-none font-sans relative overflow-hidden">
      {/* HEADER KHO TỪ VỰNG */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3" /> SPACED REPETITION ENGINE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Kho Từ Vựng Học Thuật Digital SAT
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Phím tắt: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono">←</kbd> Thẻ trước • <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono">→</kbd> Thẻ tiếp • <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono">Space</kbd> Lật thẻ • <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono">F</kbd> Toàn màn hình
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Đã thuộc lòng</span>
            <span className="text-lg font-black font-mono text-emerald-400">{masteredCount}</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Đang ôn tập</span>
            <span className="text-lg font-black font-mono text-amber-400">{learningCount}</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Tổng kho từ</span>
            <span className="text-lg font-black font-mono text-cyan-400">{vocabList.length}</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KHU VỰC FLASHCARD 3D TRUNG TÂM (HỖ TRỢ PHÓNG TO TOÀN MÀN HÌNH) */}
      {/* ===================================================================== */}
      {activeWord && (
        <div
          ref={flashcardZoneRef}
          className={`${
            isFullscreen
              ? 'fixed inset-0 z-50 w-screen h-screen bg-[#040711] p-6 sm:p-12 flex flex-col justify-between overflow-y-auto'
              : 'max-w-3xl mx-auto space-y-5'
          } transition-all duration-200`}
        >
          {/* Thanh điều khiển phía trên Thẻ: Số thứ tự, Trộn ngẫu nhiên & Nút Phóng to */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10">
                THẺ SỐ: <strong className="text-cyan-300">{currentIndex + 1}</strong> / {filteredWords.length}
              </span>
              <button
                type="button"
                onClick={handlePrevCard}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition font-sans font-bold"
                title="Quay lại thẻ trước (Phím ←)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Thẻ trước</span>
              </button>
              <button
                type="button"
                onClick={handleNextCard}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition font-sans font-bold"
                title="Sang thẻ tiếp theo (Phím →)"
              >
                <span>Thẻ tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(Math.floor(Math.random() * Math.max(1, filteredWords.length)));
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-cyan-300 cursor-pointer transition font-sans font-bold"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trộn ngẫu nhiên</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-400/40 text-cyan-300 font-sans font-extrabold cursor-pointer transition shadow-md"
                title="Phóng to hoặc thu nhỏ toàn màn hình (Phím F)"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Thu nhỏ (Esc)</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Toàn màn hình</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* KHUNG CHỨA THẺ LẬT 3D KÈM 2 NÚT MŨI TÊN LÙI / TIẾN 2 BÊN */}
          <div className="flex items-center gap-3 sm:gap-5 w-full max-w-4xl mx-auto my-auto">
            {/* Nút Lùi Thẻ Trước bên trái */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={handlePrevCard}
              title="Quay lại thẻ từ vựng trước (Phím mũi tên Trái ←)"
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-slate-900/90 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-400/35 flex items-center justify-center shrink-0 shadow-lg cursor-pointer transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            {/* THẺ LẬT 3D CHÍNH */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ perspective: 1400 }}
              className={`${
                isFullscreen ? 'h-[58vh] min-h-[380px]' : 'h-72 sm:h-84'
              } flex-1 cursor-pointer`}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative w-full h-full"
              >
                {/* MẶT TRƯỚC */}
                <div
                  style={{ backfaceVisibility: 'hidden' }}
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/85 to-slate-950 border border-cyan-400/40 shadow-[0_25px_70px_rgba(0,0,0,0.8)] p-8 sm:p-10 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-mono font-bold uppercase">
                      {activeWord.partOfSpeech} • {activeWord.level}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleSpeak(e, activeWord.word)}
                      className="p-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/30 text-cyan-300 transition cursor-pointer"
                      title="Phát âm chuẩn US"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-center space-y-3 my-auto">
                    <h2
                      className={`${
                        isFullscreen ? 'text-5xl sm:text-7xl' : 'text-4xl sm:text-5xl'
                      } font-black text-white tracking-tight`}
                    >
                      {activeWord.word}
                    </h2>
                    {activeWord.phonetic && (
                      <p className={`${isFullscreen ? 'text-lg' : 'text-sm'} font-mono text-cyan-300/85`}>
                        {activeWord.phonetic}
                      </p>
                    )}
                  </div>

                  <div className="text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Nhấp vào thẻ (hoặc nhấn Space) để lật xem giải nghĩa & ví dụ SAT</span>
                  </div>
                </div>

                {/* MẶT SAU */}
                <div
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-emerald-400/45 shadow-[0_25px_70px_rgba(0,0,0,0.8)] p-8 sm:p-10 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <span className={`${isFullscreen ? 'text-2xl' : 'text-lg'} font-extrabold text-cyan-300`}>
                        {activeWord.word}{' '}
                        <span className="text-xs font-mono text-slate-400">({activeWord.partOfSpeech})</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleSpeak(e, activeWord.word)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-cyan-500/30 text-cyan-300 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3
                      className={`${
                        isFullscreen ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-xl'
                      } font-bold text-white leading-snug`}
                    >
                      {activeWord.meaning || 'Đang đồng bộ nghĩa từ điển...'}
                    </h3>
                    {activeWord.definitionEn && activeWord.definitionEn !== activeWord.meaning && (
                      <p className={`${isFullscreen ? 'text-sm sm:text-base' : 'text-xs'} text-slate-300 leading-relaxed`}>
                        {activeWord.definitionEn}
                      </p>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-amber-300 block">
                      Ví dụ trong ngữ cảnh SAT:
                    </span>
                    <p className={`${isFullscreen ? 'text-sm sm:text-base' : 'text-xs'} italic text-slate-200 leading-relaxed`}>
                      "{activeWord.example}"
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">Đồng nghĩa:</span>
                    {activeWord.synonyms.map((syn, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md bg-white/10 text-xs font-mono text-cyan-200"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Nút Tiến Thẻ Tiếp Theo bên phải */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={handleNextCard}
              title="Sang thẻ từ vựng tiếp theo (Phím mũi tên Phải →)"
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-slate-900/90 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-400/35 flex items-center justify-center shrink-0 shadow-lg cursor-pointer transition"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>

          {/* CỤM 3 NÚT ĐÁNH GIÁ MỨC ĐỘ NHỚ */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-4xl mx-auto">
            <button
              type="button"
              onClick={() => handleMarkStatus('learning')}
              className="py-3.5 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Chưa thuộc (Ôn lại)</span>
            </button>

            <button
              type="button"
              onClick={() => handleMarkStatus('learning')}
              className="py-3.5 px-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>Hơi nhớ (Nhắc lại sau)</span>
            </button>

            <button
              type="button"
              onClick={() => handleMarkStatus('mastered')}
              className="py-3.5 px-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đã thuộc lòng!</span>
            </button>
          </div>
        </div>
      )}

      {/* BỘ LỌC & DANH SÁCH TỪ VỰNG BÊN DƯỚI */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
              }}
              placeholder="Tìm nhanh từ vựng hoặc nghĩa..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 focus:border-cyan-400 text-xs text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'mastered', label: 'Đã thuộc' },
              { id: 'learning', label: 'Đang học' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilterStatus(tab.id);
                  setCurrentIndex(0);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  filterStatus === tab.id
                    ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/40'
                    : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredWords.slice(0, 48).map((item, idx) => {
            const st = progressMap[item.id]?.status;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsFlipped(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-4 rounded-2xl bg-slate-900/85 hover:bg-slate-900 border border-white/10 hover:border-cyan-400/40 transition cursor-pointer flex items-start justify-between gap-2 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition-colors">
                      {item.word}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-[10px] font-mono font-bold text-cyan-300 uppercase">
                      {item.partOfSpeech}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.meaning || 'Đang tải nghĩa tiếng Việt...'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleSpeak(e, item.word)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  {st === 'mastered' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold">
                      Mastered
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}