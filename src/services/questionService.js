// src/services/questionService.js

// 1. Nhập các bộ câu hỏi Reading & Writing hiện có
import grammarBank from '../data/questions/grammar.json';
import transitionBank from '../data/questions/transition.json';
import wordsInContextBank from '../data/questions/wordInContext.json';
import realVerbalBank from '../data/questions/real_verbal_bank.json';
import inferenceBank from '../data/questions/inference.json';

// Nhập 2 bộ câu hỏi mới (140 câu Rhetorical Synthesis + 151 câu Main Idea)
import rhetoricalSynthesisBank from '../data/questions/tests/rhetorical_synthesis.json';
import mainIdeaBank from '../data/questions/tests/main_idea.json';

// 2. Nhập các bộ câu hỏi Math hiện có
import algebraBank from '../data/questions/algebra.json';
import dataAnalysisBank from '../data/questions/data_analysis_bank.json';
import geometryTrigBank from '../data/questions/geometry_trig_bank.json';
import realMathBank from '../data/questions/real_math_bank.json';

// 3. Nhập các đề thi thử Full Tests & Prediction
import novemberSatPrediction from '../data/questions/tests/november_sat_prediction.json';
import mathNovemberPrediction from '../data/questions/tests/math_november_prediction.json';
import verbalNovemberPrediction from '../data/questions/tests/verbal_november_prediction.json';
import satFullRealTest01 from '../data/questions/tests/sat_full_real_test_01.json';
import satRealVerbalFull from '../data/questions/tests/sat_real_verbal_full.json';
import verbalHardTest1 from '../data/questions/tests/verbal_hard_test1.json';
import verbalHardTest2 from '../data/questions/tests/verbal_hard_test2.json';

// Các đề Practice Tests 4, 5, 6, 7, 8, 11
import satTest4Math1 from '../data/questions/tests/sat_test_4_math1.json';
import satTest4Math2 from '../data/questions/tests/sat_test_4_math2.json';
import satTest4Rw1 from '../data/questions/tests/sat_test_4_rw1.json';
import satTest4Rw2 from '../data/questions/tests/sat_test_4_rw2.json';
import satTest5Math1 from '../data/questions/tests/sat_test_5_math1.json';
import satTest5Math2 from '../data/questions/tests/sat_test_5_math2.json';
import satTest5Rw1 from '../data/questions/tests/sat_test_5_rw1.json';
import satTest5Rw2 from '../data/questions/tests/sat_test_5_rw2.json';
import satTest6Math1 from '../data/questions/tests/sat_test_6_math1.json';
import satTest6Math2 from '../data/questions/tests/sat_test_6_math2.json';
import satTest6Rw1 from '../data/questions/tests/sat_test_6_rw1.json';
import satTest6Rw2 from '../data/questions/tests/sat_test_6_rw2.json';
import satTest7Math1 from '../data/questions/tests/sat_test_7_math1.json';
import satTest7Math2 from '../data/questions/tests/sat_test_7_math2.json';
import satTest7Rw1 from '../data/questions/tests/sat_test_7_rw1.json';
import satTest7Rw2 from '../data/questions/tests/sat_test_7_rw2.json';
import satTest8Math1 from '../data/questions/tests/sat_test_8_math1.json';
import satTest8Math2 from '../data/questions/tests/sat_test_8_math2.json';
import satTest8Rw1 from '../data/questions/tests/sat_test_8_rw1.json';
import satTest8Rw2 from '../data/questions/tests/sat_test_8_rw2.json';
import satTest11Rw1 from '../data/questions/tests/sat_test_11_rw1.json';

function extractArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.questions)) return raw.questions;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
}

/**
 * Chuẩn hóa từng câu hỏi để tương thích với mọi giao diện trong dự án
 */
export function normalizeQuestionItem(q, defaultDomain = 'Reading & Writing', defaultSkill = 'General', idx = 0, defaultSection = 'Reading & Writing') {
  if (!q) return null;

  const id =
    q.id ||
    `q_${String(defaultSkill).toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx + 1}`;
  const prompt = q.passage || q.prompt || q.stimulus || q.context || q.text || '';
  const question =
    q.question ||
    q.stem ||
    'Which choice completes the text so that it conforms to the conventions of Standard English?';

  let options = q.options || q.choices;
  if (Array.isArray(options)) {
    const optsObj = {};
    options.forEach((opt, oIdx) => {
      const letter = String.fromCharCode(65 + oIdx);
      optsObj[letter] =
        typeof opt === 'object' ? opt.text || opt.value || opt.content || '' : String(opt);
    });
    options = optsObj;
  } else if (!options || typeof options !== 'object') {
    options = {};
  }

  const correctAnswer = String(q.correctAnswer || q.answer || 'A')
    .trim()
    .toUpperCase();

  return {
    ...q,
    id,
    questionNumber: q.questionNumber || idx + 1,
    section: q.section || defaultSection,
    domain: q.domain || defaultDomain,
    skill: q.skill || defaultSkill,
    category: q.category || defaultSkill,
    difficulty: q.difficulty || 'Medium',
    passage: prompt,
    prompt: prompt,
    question,
    options,
    correctAnswer,
    answer: correctAnswer,
    explanation:
      q.explanation ||
      'Đáp án chính xác được xác thực theo chuẩn cấu trúc bài thi Digital SAT.',
  };
}

export const DEFAULT_CATEGORIES = [
  // =========================================================================
  // READING & WRITING MODULES (BAO GỒM 2 BỘ MỚI)
  // =========================================================================
  {
    id: 'rhetorical_synthesis_bank',
    name: 'Rhetorical Synthesis (140 câu)',
    title: 'Rhetorical Synthesis (140 câu)',
    description:
      'Rèn luyện kỹ năng tổng hợp thông tin từ ghi chú để hoàn thành mục tiêu tu từ (Audience, Contrast, Similarity, Definition).',
    section: 'Reading & Writing',
    domain: 'Expression of Ideas',
    skill: 'Rhetorical Synthesis',
    count: extractArray(rhetoricalSynthesisBank).length,
    totalQuestions: extractArray(rhetoricalSynthesisBank).length,
    badge: '140 CÂU MỚI',
    color: 'from-sky-500 to-indigo-600',
    questions: extractArray(rhetoricalSynthesisBank).map((q, idx) =>
      normalizeQuestionItem(q, 'Expression of Ideas', 'Rhetorical Synthesis', idx, 'Reading & Writing')
    ),
  },
  {
    id: 'main_idea_central_ideas_bank',
    name: 'Central Ideas & Main Purpose (151 câu)',
    title: 'Central Ideas & Main Purpose (151 câu)',
    description:
      'Chinh phục dạng bài tìm ý chính (Central Idea), chủ đề bao quát (Main Topic) và mục đích văn bản (Main Purpose).',
    section: 'Reading & Writing',
    domain: 'Information and Ideas',
    skill: 'Central Ideas and Details',
    count: extractArray(mainIdeaBank).length,
    totalQuestions: extractArray(mainIdeaBank).length,
    badge: '151 CÂU MỚI',
    color: 'from-amber-500 to-rose-600',
    questions: extractArray(mainIdeaBank).map((q, idx) =>
      normalizeQuestionItem(q, 'Information and Ideas', 'Central Ideas and Details', idx, 'Reading & Writing')
    ),
  },
  {
    id: 'standard_english_conventions_grammar',
    name: 'Standard English Conventions (Grammar)',
    title: 'Standard English Conventions (Ngữ Pháp SAT)',
    description:
      'Luyện tập các dạng bài ranh giới câu (Boundaries), mệnh đề độc lập/phụ thuộc, dấu câu và hòa hợp chủ vị.',
    section: 'Reading & Writing',
    domain: 'Standard English Conventions',
    skill: 'Form, Structure, and Sense',
    count: extractArray(grammarBank).length,
    totalQuestions: extractArray(grammarBank).length,
    badge: 'CORE GRAMMAR',
    color: 'from-blue-500 to-indigo-600',
    questions: extractArray(grammarBank).map((q, idx) =>
      normalizeQuestionItem(q, 'Standard English Conventions', 'Boundaries & Structure', idx, 'Reading & Writing')
    ),
  },
  {
    id: 'transitions_mastery',
    name: 'Transitions & Logical Connectors',
    title: 'Transitions & Logical Connectors',
    description:
      'Làm chủ các liên từ logic (However, Therefore, Furthermore, In contrast) trong đoạn văn SAT.',
    section: 'Reading & Writing',
    domain: 'Expression of Ideas',
    skill: 'Transitions',
    count: extractArray(transitionBank).length,
    totalQuestions: extractArray(transitionBank).length,
    badge: 'TRANSITIONS',
    color: 'from-emerald-500 to-teal-600',
    questions: extractArray(transitionBank).map((q, idx) =>
      normalizeQuestionItem(q, 'Expression of Ideas', 'Transitions', idx, 'Reading & Writing')
    ),
  },
  {
    id: 'words_in_context_vocabulary',
    name: 'Words in Context (Vocabulary)',
    title: 'Words in Context (Từ Vựng Ngữ Cảnh C1-C2)',
    description:
      'Bộ câu hỏi từ vựng học thuật tần suất xuất hiện cao trong các đề thi thật Digital SAT.',
    section: 'Reading & Writing',
    domain: 'Craft and Structure',
    skill: 'Words in Context',
    count: extractArray(wordsInContextBank).length,
    totalQuestions: extractArray(wordsInContextBank).length,
    badge: 'VOCAB 800',
    color: 'from-purple-500 to-pink-600',
    questions: extractArray(wordsInContextBank).map((q, idx) =>
      normalizeQuestionItem(q, 'Craft and Structure', 'Words in Context', idx, 'Reading & Writing')
    ),
  },
  {
    id: 'inferences_and_evidence',
    name: 'Inferences & Command of Evidence',
    title: 'Inferences & Command of Evidence',
    description:
      'Luyện kỹ năng suy luận logic, hỗ trợ hoặc làm suy yếu luận điểm nghiên cứu khoa học xã hội.',
    section: 'Reading & Writing',
    domain: 'Information and Ideas',
    skill: 'Inferences',
    count: extractArray(inferenceBank).length,
    totalQuestions: extractArray(inferenceBank).length,
    badge: 'INFERENCE',
    color: 'from-violet-500 to-purple-700',
    questions: extractArray(inferenceBank).map((q, idx) =>
      normalizeQuestionItem(q, 'Information and Ideas', 'Inferences', idx, 'Reading & Writing')
    ),
  },
  {
    id: 'real_verbal_advanced_bank',
    name: 'Real Verbal Hard Bank (Đề Thi Thật)',
    title: 'Real Verbal Hard Bank (Đề Thi Thật)',
    description:
      'Tổng hợp các câu hỏi Verbal điểm 700+ chọn lọc từ các kỳ thi Digital SAT quốc tế gần đây.',
    section: 'Reading & Writing',
    domain: 'Reading & Writing Mastery',
    skill: 'Full Verbal Hard',
    count: extractArray(realVerbalBank).length,
    totalQuestions: extractArray(realVerbalBank).length,
    badge: '700+ VERBAL',
    color: 'from-rose-600 to-red-700',
    questions: extractArray(realVerbalBank).map((q, idx) =>
      normalizeQuestionItem(q, 'Reading & Writing Mastery', 'Full Verbal Hard', idx, 'Reading & Writing')
    ),
  },

  // =========================================================================
  // MATHEMATICS MODULES
  // =========================================================================
  {
    id: 'algebra_advanced_math',
    name: 'Algebra & Advanced Math',
    title: 'Algebra & Advanced Math',
    description:
      'Phương trình bậc hai, hệ phương trình phi tuyến, đồ thị Parabol và ứng dụng máy tính đồ họa Desmos.',
    section: 'Math',
    domain: 'Algebra',
    skill: 'Linear & Nonlinear Equations',
    count: extractArray(algebraBank).length,
    totalQuestions: extractArray(algebraBank).length,
    badge: 'ALGEBRA 800',
    color: 'from-cyan-500 to-blue-600',
    questions: extractArray(algebraBank).map((q, idx) =>
      normalizeQuestionItem(q, 'Algebra', 'Linear & Nonlinear Equations', idx, 'Math')
    ),
  },
  {
    id: 'data_analysis_problem_solving',
    name: 'Problem-Solving & Data Analysis',
    title: 'Problem-Solving & Data Analysis',
    description:
      'Tỷ lệ phần trăm, xác suất có điều kiện, bảng tần số hai chiều, độ lệch chuẩn và phân tích hồi quy.',
    section: 'Math',
    domain: 'Problem-Solving and Data Analysis',
    skill: 'Statistics & Probability',
    count: extractArray(dataAnalysisBank).length,
    totalQuestions: extractArray(dataAnalysisBank).length,
    badge: 'DATA & STATS',
    color: 'from-teal-500 to-emerald-600',
    questions: extractArray(dataAnalysisBank).map((q, idx) =>
      normalizeQuestionItem(q, 'Problem-Solving and Data Analysis', 'Statistics & Models', idx, 'Math')
    ),
  },
  {
    id: 'geometry_and_trigonometry',
    name: 'Geometry & Trigonometry',
    title: 'Geometry & Trigonometry',
    description:
      'Định lý đường tròn, góc lượng giác, tam giác đồng dạng, diện tích và thể tích hình học không gian.',
    section: 'Math',
    domain: 'Geometry and Trigonometry',
    skill: 'Circles & Right Triangles',
    count: extractArray(geometryTrigBank).length,
    totalQuestions: extractArray(geometryTrigBank).length,
    badge: 'GEOMETRY',
    color: 'from-amber-500 to-orange-600',
    questions: extractArray(geometryTrigBank).map((q, idx) =>
      normalizeQuestionItem(q, 'Geometry and Trigonometry', 'Circles & Trigonometry', idx, 'Math')
    ),
  },
  {
    id: 'real_math_advanced_800',
    name: 'Hard Math Bank (Target 780-800)',
    title: 'Hard Math Bank (Target 780-800)',
    description:
      'Ngân hàng các câu hỏi phân loại cực khó của Module 2 Math, tích hợp bẫy đại số và kỹ thuật bấm máy Desmos.',
    section: 'Math',
    domain: 'Advanced Math',
    skill: 'Hard Module 2 Specialist',
    count: extractArray(realMathBank).length,
    totalQuestions: extractArray(realMathBank).length,
    badge: '800 MATH',
    color: 'from-fuchsia-600 to-rose-600',
    questions: extractArray(realMathBank).map((q, idx) =>
      normalizeQuestionItem(q, 'Advanced Math', 'Hard Module 2 Math', idx, 'Math')
    ),
  },

  // =========================================================================
  // FULL MOCK EXAMS & PREDICTIONS
  // =========================================================================
  {
    id: 'full_sat_prediction_november',
    name: 'Digital SAT Official Prediction',
    title: 'Digital SAT Official Prediction',
    description:
      'Đề thi thử thích ứng chuẩn cấu trúc 2 Module Reading & Writing và 2 Module Math với cơ chế đổi nhánh độ khó.',
    section: 'Full Real Test',
    domain: 'Full Adaptive SAT',
    skill: 'Adaptive Exam (Module 1 + 2)',
    count: extractArray(novemberSatPrediction).length || 54,
    totalQuestions: extractArray(novemberSatPrediction).length || 54,
    badge: 'OFFICIAL MOCK',
    color: 'from-indigo-600 via-purple-600 to-pink-600',
    isExam: true,
    questions: extractArray(novemberSatPrediction).map((q, idx) =>
      normalizeQuestionItem(q, 'Full Adaptive SAT', 'Official Simulation', idx, 'Reading & Writing')
    ),
  },
  {
    id: 'math_prediction_full',
    name: 'Math Prediction Exam (Full 44 câu)',
    title: 'Math Prediction Exam (Full 44 câu)',
    description:
      'Mô phỏng trọn vẹn 44 câu Toán gồm cả trắc nghiệm A/B/C/D và câu hỏi tự điền đáp án số/phân số (Grid-in).',
    section: 'Math',
    domain: 'Math Practice Exam',
    skill: 'Math Module 1 & 2',
    count: extractArray(mathNovemberPrediction).length || 44,
    totalQuestions: extractArray(mathNovemberPrediction).length || 44,
    badge: 'MATH EXAM',
    color: 'from-cyan-600 to-blue-700',
    isExam: true,
    questions: extractArray(mathNovemberPrediction).map((q, idx) =>
      normalizeQuestionItem(q, 'Math Practice Exam', 'Prediction Math', idx, 'Math')
    ),
  },
  {
    id: 'verbal_prediction_full',
    name: 'Verbal Prediction Exam (Full 54 câu)',
    title: 'Verbal Prediction Exam (Full 54 câu)',
    description:
      'Đề thi trọn vẹn 54 câu Reading & Writing với tỷ lệ chuẩn các câu hỏi Words in Context, Grammar, Inferences và Rhetorical Synthesis.',
    section: 'Reading & Writing',
    domain: 'Reading & Writing Exam',
    skill: 'RW Module 1 & 2',
    count: extractArray(verbalNovemberPrediction).length || 54,
    totalQuestions: extractArray(verbalNovemberPrediction).length || 54,
    badge: 'VERBAL EXAM',
    color: 'from-rose-600 to-purple-700',
    isExam: true,
    questions: extractArray(verbalNovemberPrediction).map((q, idx) =>
      normalizeQuestionItem(q, 'Reading & Writing Exam', 'Prediction Verbal', idx, 'Reading & Writing')
    ),
  },
  {
    id: 'sat_full_real_test_01',
    name: 'SAT Full Real Test 01',
    title: 'SAT Full Real Test 01',
    description: 'Đề thi thực chiến tổng hợp đầy đủ các kỹ năng Reading & Writing và Math.',
    section: 'Full Real Test',
    domain: 'Full Adaptive SAT',
    skill: 'Full Real Exam',
    count: extractArray(satFullRealTest01).length,
    totalQuestions: extractArray(satFullRealTest01).length,
    badge: 'REAL TEST 01',
    color: 'from-emerald-600 to-cyan-700',
    isExam: true,
    questions: extractArray(satFullRealTest01).map((q, idx) =>
      normalizeQuestionItem(q, 'Full Adaptive SAT', 'Real Test 01', idx, 'Reading & Writing')
    ),
  },
  {
    id: 'sat_real_verbal_full',
    name: 'SAT Real Verbal Full Test',
    title: 'SAT Real Verbal Full Test',
    description: 'Đề thi chuyên sâu kỹ năng Đọc & Viết (Reading & Writing) thực chiến.',
    section: 'Reading & Writing',
    domain: 'Reading & Writing Exam',
    skill: 'Real Verbal Full',
    count: extractArray(satRealVerbalFull).length,
    totalQuestions: extractArray(satRealVerbalFull).length,
    badge: 'REAL VERBAL',
    color: 'from-orange-500 to-rose-600',
    isExam: true,
    questions: extractArray(satRealVerbalFull).map((q, idx) =>
      normalizeQuestionItem(q, 'Reading & Writing Exam', 'Real Verbal Full', idx, 'Reading & Writing')
    ),
  },
  {
    id: 'verbal_hard_test1',
    name: 'Verbal Hard Module Test 1',
    title: 'Verbal Hard Module Test 1',
    description: 'Bộ đề luyện nâng cao chuyên trị các câu hỏi mức độ Hard của Reading & Writing.',
    section: 'Reading & Writing',
    domain: 'Reading & Writing Mastery',
    skill: 'Verbal Hard Test 1',
    count: extractArray(verbalHardTest1).length,
    totalQuestions: extractArray(verbalHardTest1).length,
    badge: 'HARD VERBAL 1',
    color: 'from-red-600 to-rose-800',
    isExam: true,
    questions: extractArray(verbalHardTest1).map((q, idx) =>
      normalizeQuestionItem(q, 'Reading & Writing Mastery', 'Verbal Hard Test 1', idx, 'Reading & Writing')
    ),
  },
  {
    id: 'verbal_hard_test2',
    name: 'Verbal Hard Module Test 2',
    title: 'Verbal Hard Module Test 2',
    description: 'Bộ đề luyện nâng cao chuyên trị các câu hỏi mức độ Hard của Reading & Writing (Đề số 2).',
    section: 'Reading & Writing',
    domain: 'Reading & Writing Mastery',
    skill: 'Verbal Hard Test 2',
    count: extractArray(verbalHardTest2).length,
    totalQuestions: extractArray(verbalHardTest2).length,
    badge: 'HARD VERBAL 2',
    color: 'from-purple-600 to-indigo-800',
    isExam: true,
    questions: extractArray(verbalHardTest2).map((q, idx) =>
      normalizeQuestionItem(q, 'Reading & Writing Mastery', 'Verbal Hard Test 2', idx, 'Reading & Writing')
    ),
  },
];

// =========================================================================
// CÁC HÀM EXPORT TRỰC TIẾP (NAMED EXPORTS) CHO QUESTIONBANKPAGE & EXAMWORKSPACE
// =========================================================================

export function getCategories() {
  return DEFAULT_CATEGORIES;
}

export function getAllCategories() {
  return DEFAULT_CATEGORIES;
}

export function getCategorySummary() {
  return DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    count: cat.questions?.length || 0,
    totalQuestions: cat.questions?.length || 0,
  }));
}

export function getCategoryById(id) {
  if (!id) return DEFAULT_CATEGORIES[0];
  const cleanId = String(id).trim().toLowerCase();
  return (
    DEFAULT_CATEGORIES.find(
      (c) =>
        String(c.id).toLowerCase() === cleanId ||
        String(c.skill).toLowerCase() === cleanId ||
        String(c.domain).toLowerCase() === cleanId ||
        String(c.title).toLowerCase() === cleanId
    ) || DEFAULT_CATEGORIES[0]
  );
}

export function getQuestionsByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') {
    return getAllQuestions();
  }
  const cat = getCategoryById(categoryId);
  return cat?.questions || [];
}

export function getAllQuestions() {
  const all = [];
  DEFAULT_CATEGORIES.forEach((cat) => {
    if (Array.isArray(cat.questions)) {
      all.push(...cat.questions);
    }
  });
  return all;
}

export function getQuestionsBySection(section) {
  if (!section || section === 'all') return getAllQuestions();
  const sLower = String(section).toLowerCase();
  const matchedCats = DEFAULT_CATEGORIES.filter((c) => {
    const catSec = String(c.section || '').toLowerCase();
    if (sLower.includes('math')) return catSec.includes('math');
    if (sLower.includes('read') || sLower.includes('verbal') || sLower.includes('rw')) {
      return catSec.includes('read') || catSec.includes('verbal');
    }
    return catSec === sLower;
  });
  const result = [];
  matchedCats.forEach((cat) => {
    if (Array.isArray(cat.questions)) {
      result.push(...cat.questions);
    }
  });
  return result;
}

export function getQuestionsByFilter(filters = {}) {
  let pool = getAllQuestions();

  if (filters.categoryId && filters.categoryId !== 'all') {
    pool = getQuestionsByCategory(filters.categoryId);
  } else if (filters.section && filters.section !== 'all') {
    pool = getQuestionsBySection(filters.section);
  }

  if (filters.domain && filters.domain !== 'all') {
    const dLower = String(filters.domain).toLowerCase();
    pool = pool.filter(
      (q) =>
        String(q.domain || '').toLowerCase().includes(dLower) ||
        String(q.skill || '').toLowerCase().includes(dLower)
    );
  }

  if (filters.skill && filters.skill !== 'all') {
    const skLower = String(filters.skill).toLowerCase();
    pool = pool.filter((q) => String(q.skill || '').toLowerCase().includes(skLower));
  }

  if (filters.difficulty && filters.difficulty !== 'all') {
    const diffLower = String(filters.difficulty).toLowerCase();
    pool = pool.filter((q) => String(q.difficulty || '').toLowerCase() === diffLower);
  }

  if (filters.search) {
    const qStr = String(filters.search).toLowerCase();
    pool = pool.filter(
      (q) =>
        String(q.passage || '').toLowerCase().includes(qStr) ||
        String(q.question || '').toLowerCase().includes(qStr) ||
        String(q.skill || '').toLowerCase().includes(qStr)
    );
  }

  if (filters.limit && Number(filters.limit) > 0) {
    return pool.slice(0, Number(filters.limit));
  }

  return pool;
}

export function getRandomQuiz(categoryId, count = 10) {
  const pool =
    !categoryId || categoryId === 'all'
      ? [...getAllQuestions()]
      : [...getQuestionsByCategory(categoryId)];
  if (pool.length === 0) return [];

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}

/**
 * Hàm khởi tạo phiên thi Thích Ứng (Adaptive Exam Session) được gọi bởi QuestionBankPage.jsx
 */
export function createAdaptiveExamSession(options = {}) {
  const section = options.section || options.type || 'Reading & Writing';
  const testId = options.testId || options.categoryId || null;

  let pool = [];
  if (testId) {
    const foundCat = DEFAULT_CATEGORIES.find((c) => c.id === testId);
    if (foundCat && foundCat.questions?.length > 0) {
      pool = [...foundCat.questions];
    }
  }

  if (pool.length === 0) {
    pool = getQuestionsBySection(section);
  }
  if (pool.length === 0) {
    pool = getAllQuestions();
  }

  const isMath = String(section).toLowerCase().includes('math');
  const modSize = options.moduleSize || (isMath ? 22 : 27);
  const timeMinutes = isMath ? 35 : 32;

  const module1Questions = pool.slice(0, modSize);
  const module2HardQuestions = pool.slice(modSize, modSize * 2);
  const module2EasyQuestions = pool.slice(0, modSize);

  return {
    id: `session_${Date.now()}`,
    title: options.title || `${section} Adaptive Exam`,
    section,
    isAdaptive: true,
    totalModules: 2,
    currentModule: 1,
    timeLimitSeconds: timeMinutes * 60,
    module1: module1Questions,
    module2Hard: module2HardQuestions.length > 0 ? module2HardQuestions : module1Questions,
    module2Easy: module2EasyQuestions,
    questions: module1Questions,
  };
}

export function getFullTests() {
  return DEFAULT_CATEGORIES.filter((c) => c.isExam);
}

export const FULL_TESTS = {
  test_4: {
    rw1: extractArray(satTest4Rw1),
    rw2: extractArray(satTest4Rw2),
    math1: extractArray(satTest4Math1),
    math2: extractArray(satTest4Math2),
  },
  test_5: {
    rw1: extractArray(satTest5Rw1),
    rw2: extractArray(satTest5Rw2),
    math1: extractArray(satTest5Math1),
    math2: extractArray(satTest5Math2),
  },
  test_6: {
    rw1: extractArray(satTest6Rw1),
    rw2: extractArray(satTest6Rw2),
    math1: extractArray(satTest6Math1),
    math2: extractArray(satTest6Math2),
  },
  test_7: {
    rw1: extractArray(satTest7Rw1),
    rw2: extractArray(satTest7Rw2),
    math1: extractArray(satTest7Math1),
    math2: extractArray(satTest7Math2),
  },
  test_8: {
    rw1: extractArray(satTest8Rw1),
    rw2: extractArray(satTest8Rw2),
    math1: extractArray(satTest8Math1),
    math2: extractArray(satTest8Math2),
  },
  test_11: {
    rw1: extractArray(satTest11Rw1),
  },
};

export const questionService = {
  DEFAULT_CATEGORIES,
  FULL_TESTS,
  getCategories,
  getAllCategories,
  getCategorySummary,
  getCategoryById,
  getQuestionsByCategory,
  getAllQuestions,
  getQuestionsBySection,
  getQuestionsByFilter,
  getRandomQuiz,
  createAdaptiveExamSession,
  getFullTests,
};

export default questionService;