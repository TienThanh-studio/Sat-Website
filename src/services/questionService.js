import algebraQuestions from '../data/questions/algebra.json';
import grammarQuestions from '../data/questions/grammar.json';
import wordInContextQuestions from '../data/questions/wordInContext.json';
import transitionQuestions from '../data/questions/transition.json';
import inferenceQuestions from '../data/questions/inference.json';
import verbalHard1 from '../data/questions/tests/verbal_hard_test1.json';
import verbalHard2 from '../data/questions/tests/verbal_hard_test2.json';
import satTest11RW1 from '../data/questions/tests/sat_test_11_rw1.json';

const safeArray = (d) => {
  if (Array.isArray(d)) return d;
  if (d?.questions && Array.isArray(d.questions)) return d.questions;
  return [];
};

// Tổng hợp toàn bộ câu hỏi trong hệ thống
export const getAllQuestions = () => {
  return [
    ...safeArray(algebraQuestions),
    ...safeArray(grammarQuestions),
    ...safeArray(wordInContextQuestions),
    ...safeArray(transitionQuestions),
    ...safeArray(inferenceQuestions),
    ...safeArray(verbalHard1),
    ...safeArray(verbalHard2),
    ...safeArray(satTest11RW1),
  ];
};

const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * TẠO BÀI THI ADAPTIVE RANDOM CHUẨN
 * Verbal: 27 câu, 32 phút.
 * Math: 22 câu, 35 phút.
 */
export const createAdaptiveExamSession = (section = 'Reading & Writing') => {
  const isMath = section === 'Math';
  const all = getAllQuestions();
  
  const pool = all.filter(q => {
    if (isMath) {
      return q.section === 'Math' || q.domain?.toLowerCase().includes('math') || q.category === 'Algebra';
    }
    return q.section !== 'Math' && q.category !== 'Algebra';
  });

  const count = isMath ? 22 : 27;
  const duration = isMath ? 35 : 32;

  const easy = shuffle(pool.filter(q => q.difficulty === 'easy'));
  const medium = shuffle(pool.filter(q => q.difficulty === 'medium' || !q.difficulty));
  const hard = shuffle(pool.filter(q => q.difficulty === 'hard'));

  const easyCount = Math.round(count * 0.3);
  const hardCount = Math.round(count * 0.3);
  const mediumCount = count - easyCount - hardCount;

  let selected = [
    ...easy.slice(0, easyCount),
    ...medium.slice(0, mediumCount),
    ...hard.slice(0, hardCount)
  ];

  if (selected.length < count) {
    const remaining = shuffle(pool.filter(q => !selected.some(s => s.id === q.id)));
    selected = [...selected, ...remaining.slice(0, count - selected.length)];
  }

  const finalQuestions = shuffle(selected).map((q, idx) => ({
    ...q,
    questionNumber: idx + 1
  }));

  return {
    id: `adaptive-${isMath ? 'math' : 'rw'}-${Date.now()}`,
    title: `Digital SAT Adaptive Practice - ${section} (Module 1)`,
    section: isMath ? 'Math' : 'Reading & Writing',
    isAdaptive: true,
    isRealExam: true,
    duration: duration,
    questions: finalQuestions
  };
};

export const DEFAULT_CATEGORIES = [
  {
    id: 'official-sat-practice-11-rw1',
    title: 'Official SAT Practice Test #11 (Reading & Writing - Module 1)',
    domain: 'Official College Board',
    section: 'Full Test',
    isRealExam: true,
    duration: 32,
    totalQuestions: safeArray(satTest11RW1).length,
    description: 'Đề thi chính thức số 11 trích xuất từ tài liệu College Board 2026 kèm giải thích chi tiết từng câu.',
    questions: safeArray(satTest11RW1)
  },
  {
    id: 'verbal_hard_test1',
    title: 'Phase 2.40 - Verbal Test 01 (Hard)',
    domain: 'Reading & Writing',
    section: 'Full Test',
    isRealExam: true,
    duration: 32,
    totalQuestions: safeArray(verbalHard1).length,
    description: 'Đề thi nâng cao 27 câu Verbal phân hóa cao.',
    questions: safeArray(verbalHard1)
  },
  {
    id: 'verbal_hard_test2',
    title: 'Phase 2.40 - Verbal Test 02 (Hard)',
    domain: 'Reading & Writing',
    section: 'Full Test',
    isRealExam: true,
    duration: 32,
    totalQuestions: safeArray(verbalHard2).length,
    description: 'Đề thi thử Verbal số 02 độ khó Hard.',
    questions: safeArray(verbalHard2)
  },
  {
    id: 'words-in-context',
    title: 'Words in Context',
    domain: 'Craft and Structure',
    section: 'Reading and Writing',
    isRealExam: false,
    totalQuestions: safeArray(wordInContextQuestions).length,
    description: 'Rèn luyện kỹ năng từ vựng nâng cao trong ngữ cảnh.',
    questions: safeArray(wordInContextQuestions)
  },
  {
    id: 'algebra',
    title: 'Algebra Core Skills',
    domain: 'Math',
    section: 'Math',
    isRealExam: false,
    totalQuestions: safeArray(algebraQuestions).length,
    description: 'Luyện tập phương trình, hệ phương trình đại số.',
    questions: safeArray(algebraQuestions)
  },
  {
    id: 'grammar-conventions',
    title: 'Standard English Conventions',
    domain: 'Standard English Conventions',
    section: 'Reading and Writing',
    isRealExam: false,
    totalQuestions: safeArray(grammarQuestions).length,
    description: 'Chuyên đề ngữ pháp, dấu câu và cấu trúc câu SAT.',
    questions: safeArray(grammarQuestions)
  },
  {
    id: 'transition-skills',
    title: 'Transitions & Logical Flow',
    domain: 'Expression of Ideas',
    section: 'Reading and Writing',
    isRealExam: false,
    totalQuestions: safeArray(transitionQuestions).length,
    description: 'Chuyên đề từ nối, liên kết câu và đoạn văn.',
    questions: safeArray(transitionQuestions)
  },
  {
    id: 'inferences',
    title: 'Inferences & Critical Reasoning',
    domain: 'Information and Ideas',
    section: 'Reading and Writing',
    isRealExam: false,
    totalQuestions: safeArray(inferenceQuestions).length,
    description: 'Chuyên đề suy luận logic từ dữ kiện đoạn văn.',
    questions: safeArray(inferenceQuestions)
  }
];

// Export alias để tương thích mọi component cũ
export const categories = DEFAULT_CATEGORIES;

export const questionService = {
  getAllQuestions,
  createAdaptiveExamSession,
  DEFAULT_CATEGORIES,
  categories
};

export default questionService;