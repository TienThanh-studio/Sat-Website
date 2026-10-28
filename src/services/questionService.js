// src/services/questionService.js

// 1. Nhập các bộ câu hỏi Reading & Writing theo kỹ năng
import grammarBank from '../data/questions/grammar.json';
import transitionBank from '../data/questions/transition.json';
import wordsInContextBank from '../data/questions/wordInContext.json';
import realVerbalBank from '../data/questions/real_verbal_bank.json';
import inferenceBank from '../data/questions/inference.json';
import rhetoricalSynthesisBank from '../data/questions/tests/rhetorical_synthesis.json';
import mainIdeaBank from '../data/questions/tests/main_idea.json';
import actualWicQuestionsBank from '../data/questions/actual_wic.json';

// 2. Nhập các bộ câu hỏi Math theo kỹ năng
import algebraBank from '../data/questions/algebra.json';
import dataAnalysisBank from '../data/questions/data_analysis_bank.json';
import geometryTrigBank from '../data/questions/geometry_trig_bank.json';
import realMathBank from '../data/questions/real_math_bank.json';

// 3. Nhập các đề thi thử Real Test & Prediction
import novemberSatPrediction from '../data/questions/tests/november_sat_prediction.json';
import mathNovemberPrediction from '../data/questions/tests/math_november_prediction.json';
import verbalNovemberPrediction from '../data/questions/tests/verbal_november_prediction.json';
import satFullRealTest01 from '../data/questions/tests/sat_full_real_test_01.json';
import satRealVerbalFull from '../data/questions/tests/sat_real_verbal_full.json';
import verbalHardTest1 from '../data/questions/tests/verbal_hard_test1.json';
import verbalHardTest2 from '../data/questions/tests/verbal_hard_test2.json';

// 4. Nhập toàn bộ các đề College Board Bluebook Practice Tests (4, 5, 6, 7, 8, 11)
import satTest4Rw1 from '../data/questions/tests/sat_test_4_rw1.json';
import satTest4Rw2 from '../data/questions/tests/sat_test_4_rw2.json';
import satTest4Math1 from '../data/questions/tests/sat_test_4_math1.json';
import satTest4Math2 from '../data/questions/tests/sat_test_4_math2.json';

import satTest5Rw1 from '../data/questions/tests/sat_test_5_rw1.json';
import satTest5Rw2 from '../data/questions/tests/sat_test_5_rw2.json';
import satTest5Math1 from '../data/questions/tests/sat_test_5_math1.json';
import satTest5Math2 from '../data/questions/tests/sat_test_5_math2.json';

import satTest6Rw1 from '../data/questions/tests/sat_test_6_rw1.json';
import satTest6Rw2 from '../data/questions/tests/sat_test_6_rw2.json';
import satTest6Math1 from '../data/questions/tests/sat_test_6_math1.json';
import satTest6Math2 from '../data/questions/tests/sat_test_6_math2.json';

import satTest7Rw1 from '../data/questions/tests/sat_test_7_rw1.json';
import satTest7Rw2 from '../data/questions/tests/sat_test_7_rw2.json';
import satTest7Math1 from '../data/questions/tests/sat_test_7_math1.json';
import satTest7Math2 from '../data/questions/tests/sat_test_7_math2.json';

import satTest8Rw1 from '../data/questions/tests/sat_test_8_rw1.json';
import satTest8Rw2 from '../data/questions/tests/sat_test_8_rw2.json';
import satTest8Math1 from '../data/questions/tests/sat_test_8_math1.json';
import satTest8Math2 from '../data/questions/tests/sat_test_8_math2.json';

import satTest11Rw1 from '../data/questions/tests/sat_test_11_rw1.json';

function extractArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.questions)) return raw.questions;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.items)) return raw.items;

  if (Array.isArray(raw.modules)) {
    return raw.modules.flatMap((m) => extractArray(m));
  }
  if (Array.isArray(raw.sections)) {
    return raw.sections.flatMap((s) => extractArray(s));
  }

  if (typeof raw === 'object') {
    const collected = [];
    Object.values(raw).forEach((val) => {
      if (Array.isArray(val)) {
        val.forEach((item) => {
          if (
            item &&
            (item.question ||
              item.stem ||
              item.passage ||
              item.prompt ||
              item.options)
          ) {
            collected.push(item);
          } else if (item && typeof item === 'object') {
            collected.push(...extractArray(item));
          }
        });
      } else if (val && typeof val === 'object') {
        collected.push(...extractArray(val));
      }
    });
    if (collected.length > 0) return collected;
  }

  return [];
}

/**
 * Tự động gạch chân từ vựng được hỏi trong đoạn văn đối với dạng bài:
 * - As used in the text, what does the word "X" most nearly mean?
 * - As used in the text, what do the words "X" and "Y" both most nearly mean?
 * - Based on the text, when the narrator describes herself as "X", what does she most likely mean?
 */
function autoUnderlineTargetWordsInPassage(passageText, questionText) {
  if (!passageText || !questionText) return passageText;
  // Nếu đoạn văn đã có sẵn thẻ <u> thì giữ nguyên
  if (/<u\b/i.test(passageText)) return passageText;

  const qLower = questionText.toLowerCase();
  const isWordMeaningQuestion =
    qLower.includes('most nearly mean') ||
    qLower.includes('most likely mean');

  if (!isWordMeaningQuestion) return passageText;

  // Trích xuất tất cả các từ nằm trong dấu ngoặc kép "..." hoặc “...” của câu hỏi
  const targetWords = [];
  const quoteRegex = /["“”']([^"“”']+)["“”']/g;
  let match;
  while ((match = quoteRegex.exec(questionText)) !== null) {
    const word = match[1].trim();
    if (word && word.length >= 2 && word.length <= 35) {
      targetWords.push(word);
    }
  }

  if (targetWords.length === 0) return passageText;

  let updatedPassage = passageText;
  targetWords.forEach((target) => {
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Tìm từ nguyên vẹn (không phân biệt hoa/thường) và gạch chân lần xuất hiện trong đoạn văn
    const wordRegex = new RegExp(`\\b(${escaped})\\b`, 'i');
    if (wordRegex.test(updatedPassage)) {
      updatedPassage = updatedPassage.replace(
        wordRegex,
        '<u class="underline decoration-2 underline-offset-4 font-semibold">$1</u>'
      );
    }
  });

  return updatedPassage;
}

function cleanUnicodeString(str) {
  if (typeof str !== 'string') return '';
  return str.normalize('NFC').replace(/\[cite:\s*[\d,\s]+\]/gi, '');
}

export function normalizeQuestionItem(
  q,
  defaultDomain = 'Reading & Writing',
  defaultSkill = 'General',
  idx = 0,
  defaultSection = 'Reading & Writing',
  idPrefix = ''
) {
  if (!q) return null;

  const baseId =
    q.id ||
    `q_${String(defaultSkill)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')}_${idx + 1}`;
  const id = idPrefix ? `${idPrefix}_${baseId}` : String(baseId);

  const rawPrompt = cleanUnicodeString(
    q.passage || q.prompt || q.stimulus || q.context || q.text || ''
  );
  const question = cleanUnicodeString(
    q.question ||
      q.stem ||
      'Which choice completes the text with the most logical and precise word or phrase?'
  );

  // Tự động gạch chân từ cần tìm nghĩa trong đoạn văn
  const prompt = autoUnderlineTargetWordsInPassage(rawPrompt, question);

  let options = q.options || q.choices;
  if (Array.isArray(options)) {
    const optsObj = {};
    options.forEach((opt, oIdx) => {
      const letter = String.fromCharCode(65 + oIdx);
      const val =
        typeof opt === 'object'
          ? opt.text || opt.value || opt.content || ''
          : String(opt);
      optsObj[letter] = cleanUnicodeString(val);
    });
    options = optsObj;
  } else if (options && typeof options === 'object') {
    const cleanedOpts = {};
    Object.entries(options).forEach(([k, v]) => {
      cleanedOpts[k] = cleanUnicodeString(String(v ?? ''));
    });
    options = cleanedOpts;
  } else {
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
    testDate: q.testDate || null,
    passage: prompt,
    prompt: prompt,
    question,
    options,
    correctAnswer,
    answer: correctAnswer,
    explanation: cleanUnicodeString(
      q.explanation ||
        'Đáp án chính xác được xác thực theo chuẩn cấu trúc bài thi Digital SAT.'
    ),
  };
}

function buildQuestionList(rawList, domain, skill, section, prefix) {
  return extractArray(rawList).map((q, idx) =>
    normalizeQuestionItem(q, domain, skill, idx, section, prefix)
  );
}

/**
 * Helper khởi tạo Đề Thi Thực Chiến Toàn Phần 4 Modules (2h14m + Nghỉ giữa giờ 10 phút) chuẩn College Board
 */
function buildFull4ModuleCBExam(testNum, rw1Raw, rw2Raw, m1Raw, m2Raw) {
  const rw1 = buildQuestionList(
    rw1Raw,
    'Reading & Writing',
    `CB Test ${testNum} RW M1`,
    'Reading & Writing',
    `cb${testNum}_rw1`
  );
  const rw2 = buildQuestionList(
    rw2Raw,
    'Reading & Writing',
    `CB Test ${testNum} RW M2`,
    'Reading & Writing',
    `cb${testNum}_rw2`
  );
  const m1 = buildQuestionList(
    m1Raw,
    'Math',
    `CB Test ${testNum} Math M1`,
    'Math',
    `cb${testNum}_m1`
  );
  const m2 = buildQuestionList(
    m2Raw,
    'Math',
    `CB Test ${testNum} Math M2`,
    'Math',
    `cb${testNum}_m2`
  );

  return {
    id: `cb_test_${testNum}_full_4modules`,
    name: `Bluebook Practice Test ${testNum} (Full 4 Modules - 2h14m)`,
    title: `🔥 CB Practice Test ${testNum}: Full-Length Exam (4 Modules)`,
    description: `Thi thực chiến trọn vẹn 4 Modules chuẩn College Board: RW M1 (32p) → RW M2 (32p) → Nghỉ giải lao 10p → Math M1 (35p) → Math M2 (35p). Chấm điểm thang 1600.`,
    section: 'Full Real Test (4 Modules)',
    domain: 'College Board Bluebook',
    skill: `CB Full Test ${testNum}`,
    badge: `FULL 1600 • TEST ${testNum}`,
    isExam: true,
    isCB: true,
    isFull4ModuleExam: true,
    modules: [
      {
        id: 'rw_m1',
        title: 'Section 1, Module 1: Reading and Writing',
        shortTitle: 'RW Module 1',
        section: 'Reading & Writing',
        durationSeconds: 32 * 60,
        questions: rw1,
      },
      {
        id: 'rw_m2',
        title: 'Section 1, Module 2: Reading and Writing',
        shortTitle: 'RW Module 2',
        section: 'Reading & Writing',
        durationSeconds: 32 * 60,
        questions: rw2,
        breakAfterSeconds: 10 * 60, // Nghỉ giải lao 10 phút sau khi hoàn thành Section 1
      },
      {
        id: 'math_m1',
        title: 'Section 2, Module 1: Math',
        shortTitle: 'Math Module 1',
        section: 'Math',
        durationSeconds: 35 * 60,
        questions: m1,
      },
      {
        id: 'math_m2',
        title: 'Section 2, Module 2: Math',
        shortTitle: 'Math Module 2',
        section: 'Math',
        durationSeconds: 35 * 60,
        questions: m2,
      },
    ],
    questions: [...rw1, ...rw2, ...m1, ...m2],
  };
}

export const DEFAULT_CATEGORIES = [
  // =========================================================================
  // 0. THI THỰC CHIẾN TOÀN PHẦN 4 MODULES (2 GIỜ 14 PHÚT + NGHỈ 10 PHÚT)
  // =========================================================================
  buildFull4ModuleCBExam(4, satTest4Rw1, satTest4Rw2, satTest4Math1, satTest4Math2),
  buildFull4ModuleCBExam(5, satTest5Rw1, satTest5Rw2, satTest5Math1, satTest5Math2),
  buildFull4ModuleCBExam(6, satTest6Rw1, satTest6Rw2, satTest6Math1, satTest6Math2),
  buildFull4ModuleCBExam(7, satTest7Rw1, satTest7Rw2, satTest7Math1, satTest7Math2),
  buildFull4ModuleCBExam(8, satTest8Rw1, satTest8Rw2, satTest8Math1, satTest8Math2),

  // =========================================================================
  // 1. CHUYÊN ĐỀ LUYỆN TẬP READING & WRITING (THEO DẠNG BÀI)
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
    badge: '140 CÂU MỚI',
    color: 'from-sky-500 to-indigo-600',
    questions: buildQuestionList(
      rhetoricalSynthesisBank,
      'Expression of Ideas',
      'Rhetorical Synthesis',
      'Reading & Writing',
      'rs'
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
    badge: '151 CÂU MỚI',
    color: 'from-amber-500 to-rose-600',
    questions: buildQuestionList(
      mainIdeaBank,
      'Information and Ideas',
      'Central Ideas and Details',
      'Reading & Writing',
      'mi'
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
    badge: 'CORE GRAMMAR',
    color: 'from-blue-500 to-indigo-600',
    questions: buildQuestionList(
      grammarBank,
      'Standard English Conventions',
      'Boundaries & Structure',
      'Reading & Writing',
      'gram'
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
    badge: 'TRANSITIONS',
    color: 'from-emerald-500 to-teal-600',
    questions: buildQuestionList(
      transitionBank,
      'Expression of Ideas',
      'Transitions',
      'Reading & Writing',
      'trans'
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
    badge: 'VOCAB 800',
    color: 'from-purple-500 to-pink-600',
    questions: buildQuestionList(
      wordsInContextBank,
      'Craft and Structure',
      'Words in Context',
      'Reading & Writing',
      'wic'
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
    badge: 'INFERENCE',
    color: 'from-violet-500 to-purple-700',
    questions: buildQuestionList(
      inferenceBank,
      'Information and Ideas',
      'Inferences',
      'Reading & Writing',
      'inf'
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
    badge: '700+ VERBAL',
    color: 'from-rose-600 to-red-700',
    questions: buildQuestionList(
      realVerbalBank,
      'Reading & Writing Mastery',
      'Full Verbal Hard',
      'Reading & Writing',
      'rvb'
    ),
  },
  {
    id: 'actual_wic_questions_bank',
    name: 'Actual WIC Questions (183 câu)',
    title: 'Actual WIC Questions (Dự đoán từ đề thi thật 2023–2025)',
    description: 'Trọn bộ 183 câu hỏi Words in Context từ đề thi thật (có gắn nhãn đợt thi, phân loại độ khó Easy/Medium/Hard và giải thích chi tiết).',
    section: 'Reading & Writing',
    domain: 'Craft and Structure',
    skill: 'Words in Context',
    badge: 'ACTUAL WIC (183 CÂU)',
    color: 'from-amber-500 to-orange-600',
    questions: buildQuestionList(
      actualWicQuestionsBank,
      'Craft and Structure',
      'Words in Context',
      'Reading & Writing',
      'wic_act'
    ),
  },

  // =========================================================================
  // 2. CHUYÊN ĐỀ LUYỆN TẬP MATH (THEO DẠNG BÀI)
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
    badge: 'ALGEBRA 800',
    color: 'from-cyan-500 to-blue-600',
    questions: buildQuestionList(
      algebraBank,
      'Algebra',
      'Linear & Nonlinear Equations',
      'Math',
      'alg'
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
    badge: 'DATA & STATS',
    color: 'from-teal-500 to-emerald-600',
    questions: buildQuestionList(
      dataAnalysisBank,
      'Problem-Solving and Data Analysis',
      'Statistics & Models',
      'Math',
      'data'
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
    badge: 'GEOMETRY',
    color: 'from-amber-500 to-orange-600',
    questions: buildQuestionList(
      geometryTrigBank,
      'Geometry and Trigonometry',
      'Circles & Trigonometry',
      'Math',
      'geo'
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
    badge: '800 MATH',
    color: 'from-fuchsia-600 to-rose-600',
    questions: buildQuestionList(
      realMathBank,
      'Advanced Math',
      'Hard Module 2 Math',
      'Math',
      'rmb'
    ),
  },

  // =========================================================================
  // 3. CÁC BỘ ĐỀ COLLEGE BOARD THEO TỪNG SECTION (R&W HOẶC MATH)
  // =========================================================================
  {
    id: 'cb_test_4_rw_full',
    name: 'CB Practice Test 4 - Reading & Writing (Full 2 Modules)',
    title: 'CB Practice Test 4: Reading & Writing (M1 + M2)',
    description:
      'Trọn bộ Module 1 & Module 2 phần Reading & Writing của đề College Board Bluebook Practice Test 4.',
    section: 'Reading & Writing',
    domain: 'College Board Bluebook',
    skill: 'CB Test 4 RW',
    badge: 'CB TEST 4 • R&W',
    isExam: true,
    isCB: true,
    questions: [
      ...buildQuestionList(
        satTest4Rw1,
        'Reading & Writing',
        'CB Test 4 RW M1',
        'Reading & Writing',
        'cb4_rw1'
      ),
      ...buildQuestionList(
        satTest4Rw2,
        'Reading & Writing',
        'CB Test 4 RW M2',
        'Reading & Writing',
        'cb4_rw2'
      ),
    ],
  },
  {
    id: 'cb_test_4_math_full',
    name: 'CB Practice Test 4 - Math (Full 2 Modules)',
    title: 'CB Practice Test 4: Mathematics (M1 + M2)',
    description:
      'Trọn bộ Module 1 & Module 2 phần Toán của đề College Board Bluebook Practice Test 4.',
    section: 'Math',
    domain: 'College Board Bluebook',
    skill: 'CB Test 4 Math',
    badge: 'CB TEST 4 • MATH',
    isExam: true,
    isCB: true,
    questions: [
      ...buildQuestionList(
        satTest4Math1,
        'Math',
        'CB Test 4 Math M1',
        'Math',
        'cb4_m1'
      ),
      ...buildQuestionList(
        satTest4Math2,
        'Math',
        'CB Test 4 Math M2',
        'Math',
        'cb4_m2'
      ),
    ],
  },
  {
    id: 'cb_test_5_rw_full',
    name: 'CB Practice Test 5 - Reading & Writing (Full 2 Modules)',
    title: 'CB Practice Test 5: Reading & Writing (M1 + M2)',
    description:
      'Trọn bộ Module 1 & Module 2 phần Reading & Writing của đề College Board Bluebook Practice Test 5.',
    section: 'Reading & Writing',
    domain: 'College Board Bluebook',
    skill: 'CB Test 5 RW',
    badge: 'CB TEST 5 • R&W',
    isExam: true,
    isCB: true,
    questions: [
      ...buildQuestionList(
        satTest5Rw1,
        'Reading & Writing',
        'CB Test 5 RW M1',
        'Reading & Writing',
        'cb5_rw1'
      ),
      ...buildQuestionList(
        satTest5Rw2,
        'Reading & Writing',
        'CB Test 5 RW M2',
        'Reading & Writing',
        'cb5_rw2'
      ),
    ],
  },
  {
    id: 'cb_test_5_math_full',
    name: 'CB Practice Test 5 - Math (Full 2 Modules)',
    title: 'CB Practice Test 5: Mathematics (M1 + M2)',
    description:
      'Trọn bộ Module 1 & Module 2 phần Toán của đề College Board Bluebook Practice Test 5.',
    section: 'Math',
    domain: 'College Board Bluebook',
    skill: 'CB Test 5 Math',
    badge: 'CB TEST 5 • MATH',
    isExam: true,
    isCB: true,
    questions: [
      ...buildQuestionList(
        satTest5Math1,
        'Math',
        'CB Test 5 Math M1',
        'Math',
        'cb5_m1'
      ),
      ...buildQuestionList(
        satTest5Math2,
        'Math',
        'CB Test 5 Math M2',
        'Math',
        'cb5_m2'
      ),
    ],
  },
  {
    id: 'cb_test_6_rw_full',
    name: 'CB Practice Test 6 - Reading & Writing (Full 2 Modules)',
    title: 'CB Practice Test 6: Reading & Writing (M1 + M2)',
    description:
      'Trọn bộ Module 1 & Module 2 phần Reading & Writing của đề College Board Bluebook Practice Test 6.',
    section: 'Reading & Writing',
    domain: 'College Board Bluebook',
    skill: 'CB Test 6 RW',
    badge: 'CB TEST 6 • R&W',
    isExam: true,
    isCB: true,
    questions: [
      ...buildQuestionList(
        satTest6Rw1,
        'Reading & Writing',
        'CB Test 6 RW M1',
        'Reading & Writing',
        'cb6_rw1'
      ),
      ...buildQuestionList(
        satTest6Rw2,
        'Reading & Writing',
        'CB Test 6 RW M2',
        'Reading & Writing',
        'cb6_rw2'
      ),
    ],
  },
  {
    id: 'cb_test_6_math_full',
    name: 'CB Practice Test 6 - Math (Full 2 Modules)',
    title: 'CB Practice Test 6: Mathematics (M1 + M2)',
    description:
      'Trọn bộ Module 1 & Module 2 phần Toán của đề College Board Bluebook Practice Test 6.',
    section: 'Math',
    domain: 'College Board Bluebook',
    skill: 'CB Test 6 Math',
    badge: 'CB TEST 6 • MATH',
    isExam: true,
    isCB: true,
    questions: [
      ...buildQuestionList(
        satTest6Math1,
        'Math',
        'CB Test 6 Math M1',
        'Math',
        'cb6_m1'
      ),
      ...buildQuestionList(
        satTest6Math2,
        'Math',
        'CB Test 6 Math M2',
        'Math',
        'cb6_m2'
      ),
    ],
  },
  {
    id: 'cb_test_7_rw_full',
    name: 'CB Practice Test 7 - Reading & Writing (Full 2 Modules)',
    title: 'CB Practice Test 7: Reading & Writing (M1 + M2)',
    description:
      'Trọn bộ Module 1 & Module 2 phần Reading & Writing của đề College Board Bluebook Practice Test 7.',
    section: 'Reading & Writing',
    domain: 'College Board Bluebook',
    skill: 'CB Test 7 RW',
    badge: 'CB TEST 7 • R&W',
    isExam: true,
    isCB: true,
    questions: [
      ...buildQuestionList(
        satTest7Rw1,
        'Reading & Writing',
        'CB Test 7 RW M1',
        'Reading & Writing',
        'cb7_rw1'
      ),
      ...buildQuestionList(
        satTest7Rw2,
        'Reading & Writing',
        'CB Test 7 RW M2',
        'Reading & Writing',
        'cb7_rw2'
      ),
    ],
  },
  {
    id: 'cb_test_7_math_full',
    name: 'CB Practice Test 7 - Math (Full 2 Modules)',
    title: 'CB Practice Test 7: Mathematics (M1 + M2)',
    description:
      'Trọn bộ Module 1 & Module 2 phần Toán của đề College Board Bluebook Practice Test 7.',
    section: 'Math',
    domain: 'College Board Bluebook',
    skill: 'CB Test 7 Math',
    badge: 'CB TEST 7 • MATH',
    isExam: true,
    isCB: true,
    questions: [
      ...buildQuestionList(
        satTest7Math1,
        'Math',
        'CB Test 7 Math M1',
        'Math',
        'cb7_m1'
      ),
      ...buildQuestionList(
        satTest7Math2,
        'Math',
        'CB Test 7 Math M2',
        'Math',
        'cb7_m2'
      ),
    ],
  },
  {
    id: 'cb_test_8_rw_full',
    name: 'CB Practice Test 8 - Reading & Writing (Full 2 Modules)',
    title: 'CB Practice Test 8: Reading & Writing (M1 + M2)',
    description:
      'Trọn bộ Module 1 & Module 2 phần Reading & Writing của đề College Board Bluebook Practice Test 8.',
    section: 'Reading & Writing',
    domain: 'College Board Bluebook',
    skill: 'CB Test 8 RW',
    badge: 'CB TEST 8 • R&W',
    isExam: true,
    isCB: true,
    questions: [
      ...buildQuestionList(
        satTest8Rw1,
        'Reading & Writing',
        'CB Test 8 RW M1',
        'Reading & Writing',
        'cb8_rw1'
      ),
      ...buildQuestionList(
        satTest8Rw2,
        'Reading & Writing',
        'CB Test 8 RW M2',
        'Reading & Writing',
        'cb8_rw2'
      ),
    ],
  },
  {
    id: 'cb_test_8_math_full',
    name: 'CB Practice Test 8 - Math (Full 2 Modules)',
    title: 'CB Practice Test 8: Mathematics (M1 + M2)',
    description:
      'Trọn bộ Module 1 & Module 2 phần Toán của đề College Board Bluebook Practice Test 8.',
    section: 'Math',
    domain: 'College Board Bluebook',
    skill: 'CB Test 8 Math',
    badge: 'CB TEST 8 • MATH',
    isExam: true,
    isCB: true,
    questions: [
      ...buildQuestionList(
        satTest8Math1,
        'Math',
        'CB Test 8 Math M1',
        'Math',
        'cb8_m1'
      ),
      ...buildQuestionList(
        satTest8Math2,
        'Math',
        'CB Test 8 Math M2',
        'Math',
        'cb8_m2'
      ),
    ],
  },

  // =========================================================================
  // 4. ĐỀ THI THẬT & DỰ ĐOÁN (PREDICTION & REAL TESTS)
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
    badge: 'OFFICIAL MOCK',
    isExam: true,
    questions: buildQuestionList(
      novemberSatPrediction,
      'Full Adaptive SAT',
      'Official Simulation',
      'Reading & Writing',
      'nov_pred'
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
    badge: 'MATH EXAM',
    isExam: true,
    questions: buildQuestionList(
      mathNovemberPrediction,
      'Math Practice Exam',
      'Prediction Math',
      'Math',
      'math_pred'
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
    badge: 'VERBAL EXAM',
    isExam: true,
    questions: buildQuestionList(
      verbalNovemberPrediction,
      'Reading & Writing Exam',
      'Prediction Verbal',
      'Reading & Writing',
      'verb_pred'
    ),
  },
  {
    id: 'sat_full_real_test_01',
    name: 'SAT Full Real Test 01',
    title: 'SAT Full Real Test 01',
    description:
      'Đề thi thực chiến tổng hợp đầy đủ các kỹ năng Reading & Writing và Math.',
    section: 'Full Real Test',
    domain: 'Full Adaptive SAT',
    skill: 'Full Real Exam',
    badge: 'REAL TEST 01',
    isExam: true,
    questions: buildQuestionList(
      satFullRealTest01,
      'Full Adaptive SAT',
      'Real Test 01',
      'Reading & Writing',
      'real_01'
    ),
  },
  {
    id: 'sat_real_verbal_full',
    name: 'SAT Real Verbal Full Test',
    title: 'SAT Real Verbal Full Test',
    description:
      'Đề thi chuyên sâu kỹ năng Đọc & Viết (Reading & Writing) thực chiến.',
    section: 'Reading & Writing',
    domain: 'Reading & Writing Exam',
    skill: 'Real Verbal Full',
    badge: 'REAL VERBAL',
    isExam: true,
    questions: buildQuestionList(
      satRealVerbalFull,
      'Reading & Writing Exam',
      'Real Verbal Full',
      'Reading & Writing',
      'real_v_full'
    ),
  },
  {
    id: 'verbal_hard_test1',
    name: 'Verbal Hard Module Test 1',
    title: 'Verbal Hard Module Test 1',
    description:
      'Bộ đề luyện nâng cao chuyên trị các câu hỏi mức độ Hard của Reading & Writing (Đề số 1).',
    section: 'Reading & Writing',
    domain: 'Reading & Writing Mastery',
    skill: 'Verbal Hard Test 1',
    badge: 'HARD VERBAL 1',
    isExam: true,
    questions: buildQuestionList(
      verbalHardTest1,
      'Reading & Writing Mastery',
      'Verbal Hard Test 1',
      'Reading & Writing',
      'vh1'
    ),
  },
  {
    id: 'verbal_hard_test2',
    name: 'Verbal Hard Module Test 2',
    title: 'Verbal Hard Module Test 2',
    description:
      'Bộ đề luyện nâng cao chuyên trị các câu hỏi mức độ Hard của Reading & Writing (Đề số 2).',
    section: 'Reading & Writing',
    domain: 'Reading & Writing Mastery',
    skill: 'Verbal Hard Test 2',
    badge: 'HARD VERBAL 2',
    isExam: true,
    questions: buildQuestionList(
      verbalHardTest2,
      'Reading & Writing Mastery',
      'Verbal Hard Test 2',
      'Reading & Writing',
      'vh2'
    ),
  },
].map((cat) => ({
  ...cat,
  count: cat.questions.length,
  totalQuestions: cat.questions.length,
}));

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
    if (!cat.isFull4ModuleExam && Array.isArray(cat.questions)) {
      all.push(...cat.questions);
    }
  });
  return all;
}

export function getQuestionsBySection(section) {
  if (!section || section === 'all') return getAllQuestions();
  const sLower = String(section).toLowerCase();
  const matchedCats = DEFAULT_CATEGORIES.filter((c) => {
    if (c.isFull4ModuleExam) return false;
    const catSec = String(c.section || '').toLowerCase();
    if (sLower.includes('math')) return catSec.includes('math');
    if (
      sLower.includes('read') ||
      sLower.includes('verbal') ||
      sLower.includes('rw')
    ) {
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
    pool = pool.filter((q) =>
      String(q.skill || '').toLowerCase().includes(skLower)
    );
  }

  if (filters.difficulty && filters.difficulty !== 'all') {
    const diffLower = String(filters.difficulty).toLowerCase();
    pool = pool.filter(
      (q) => String(q.difficulty || '').toLowerCase() === diffLower
    );
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
    module2Hard:
      module2HardQuestions.length > 0
        ? module2HardQuestions
        : module1Questions,
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