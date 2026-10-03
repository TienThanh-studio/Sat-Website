import algebraQuestions from '../data/questions/algebra.json';
import grammarQuestions from '../data/questions/grammar.json';
import transitionQuestions from '../data/questions/transition.json';
import wordInContextQuestions from '../data/questions/wordInContext.json';
import commandOfEvidenceQuestions from '../data/questions/commandOfEvidence.json';
import detailsQuestions from '../data/questions/details.json';
import inferenceQuestions from '../data/questions/inference.json';
import vocabularyQuestions from '../data/questions/vocabulary.json';

// Import 2 ngân hàng câu hỏi mới vừa được convert
import geometryBankData from '../data/questions/geometry_trig_bank.json';
import dataAnalysisBankData from '../data/questions/data_analysis_bank.json';

// Import các đề thi Full Test 2 Modules
import satTest4RW1 from '../data/questions/tests/sat_test_4_rw1.json';
import satTest4RW2 from '../data/questions/tests/sat_test_4_rw2.json';
import satTest4Math1 from '../data/questions/tests/sat_test_4_math1.json';
import satTest4Math2 from '../data/questions/tests/sat_test_4_math2.json';

import satTest5RW1 from '../data/questions/tests/sat_test_5_rw1.json';
import satTest5RW2 from '../data/questions/tests/sat_test_5_rw2.json';
import satTest5Math1 from '../data/questions/tests/sat_test_5_math1.json';
import satTest5Math2 from '../data/questions/tests/sat_test_5_math2.json';

import satTest6RW1 from '../data/questions/tests/sat_test_6_rw1.json';
import satTest6RW2 from '../data/questions/tests/sat_test_6_rw2.json';
import satTest6Math1 from '../data/questions/tests/sat_test_6_math1.json';
import satTest6Math2 from '../data/questions/tests/sat_test_6_math2.json';

import satTest7RW1 from '../data/questions/tests/sat_test_7_rw1.json';
import satTest7RW2 from '../data/questions/tests/sat_test_7_rw2.json';
import satTest7Math1 from '../data/questions/tests/sat_test_7_math1.json';
import satTest7Math2 from '../data/questions/tests/sat_test_7_math2.json';

import satTest8RW1 from '../data/questions/tests/sat_test_8_rw1.json';
import satTest8RW2 from '../data/questions/tests/sat_test_8_rw2.json';
import satTest8Math1 from '../data/questions/tests/sat_test_8_math1.json';
import satTest8Math2 from '../data/questions/tests/sat_test_8_math2.json';

import satTest11RW1 from '../data/questions/tests/sat_test_11_rw1.json';
import verbalHard1 from '../data/questions/tests/verbal_hard_test1.json';
import verbalHard2 from '../data/questions/tests/verbal_hard_test2.json';

const geomList = Array.isArray(geometryBankData) && geometryBankData.length > 0 ? geometryBankData : [];
const dataList = Array.isArray(dataAnalysisBankData) && dataAnalysisBankData.length > 0 ? dataAnalysisBankData : [];

// Danh sách dự phòng an toàn cho Cross-Text để không bao giờ bị 0 câu
const crossTextSafeList = [
  {
    id: "ct_001",
    questionNumber: 1,
    section: "Reading and Writing",
    domain: "Craft and Structure",
    difficulty: "medium",
    prompt: "**Text 1**\nMany evolutionary biologists hold that tool use in birds evolved strictly for foraging advantages in resource-poor habitats.\n\n**Text 2**\nRecent observations of juvenile corvids show playful manipulation of non-food items, suggesting tool behaviors also reinforce neural plasticity during social play.",
    question: "Based on the texts, how would the author of Text 2 most likely respond to the perspective in Text 1?",
    options: {
      "A": "By arguing that foraging is entirely unrelated to avian evolution.",
      "B": "By contending that tool behavior serves broader developmental functions beyond mere nutrition.",
      "C": "By asserting that corvids possess higher intelligence than other bird taxa.",
      "D": "By dismissing earlier studies as flawed."
    },
    correctAnswer: "B",
    explanation: "Text 2 emphasizes that tool use also fosters neural development and play, thus expanding beyond Text 1's purely foraging-based claim."
  }
];

export const DEFAULT_CATEGORIES = [
  // =========================================================================
  // TAB "ĐỀ THI THẬT": CHỈ CÓ CÁC BÀI THI FULL ĐỦ 2 MODULES
  // =========================================================================
  {
    id: 'exam-sat-test-7-rw',
    title: 'Official Test #7 - Reading & Writing (Full 2 Modules)',
    domain: 'Official College Board',
    section: 'Reading and Writing',
    description: 'Bài thi thử thật 2 chặng thích ứng gồm Module 1 (33 câu) và Module 2 (33 câu). Bắt buộc hoàn thành cả 2 chặng.',
    isExam: true,
    isFullTest: true,
    mode: 'exam',
    questions: Array.isArray(satTest7RW1) ? satTest7RW1 : [],
    module1: Array.isArray(satTest7RW1) ? satTest7RW1 : [],
    module2: Array.isArray(satTest7RW2) ? satTest7RW2 : []
  },
  {
    id: 'exam-sat-test-7-math',
    title: 'Official Test #7 - Math (Full 2 Modules)',
    domain: 'Official College Board',
    section: 'Math',
    description: 'Bài thi thử thật 2 chặng thích ứng gồm Module 1 (27 câu) và Module 2 (27 câu) chuẩn College Board.',
    isExam: true,
    isFullTest: true,
    mode: 'exam',
    questions: Array.isArray(satTest7Math1) ? satTest7Math1 : [],
    module1: Array.isArray(satTest7Math1) ? satTest7Math1 : [],
    module2: Array.isArray(satTest7Math2) ? satTest7Math2 : []
  },
  {
    id: 'exam-sat-test-8-rw',
    title: 'Official Test #8 - Reading & Writing (Full 2 Modules)',
    domain: 'Official College Board',
    section: 'Reading and Writing',
    description: 'Bài thi thử thật 2 chặng gồm Module 1 (33 câu) và Module 2 (33 câu).',
    isExam: true,
    isFullTest: true,
    mode: 'exam',
    questions: Array.isArray(satTest8RW1) ? satTest8RW1 : [],
    module1: Array.isArray(satTest8RW1) ? satTest8RW1 : [],
    module2: Array.isArray(satTest8RW2) ? satTest8RW2 : []
  },
  {
    id: 'exam-sat-test-8-math',
    title: 'Official Test #8 - Math (Full 2 Modules)',
    domain: 'Official College Board',
    section: 'Math',
    description: 'Bài thi thử thật 2 chặng gồm Module 1 (27 câu) và Module 2 (27 câu).',
    isExam: true,
    isFullTest: true,
    mode: 'exam',
    questions: Array.isArray(satTest8Math1) ? satTest8Math1 : [],
    module1: Array.isArray(satTest8Math1) ? satTest8Math1 : [],
    module2: Array.isArray(satTest8Math2) ? satTest8Math2 : []
  },
  {
    id: 'exam-sat-test-4-rw',
    title: 'Official Test #4 - Reading & Writing (Full 2 Modules)',
    domain: 'Official College Board',
    section: 'Reading and Writing',
    description: 'Bài thi thử thật 2 chặng gồm Module 1 (33 câu) và Module 2 (33 câu).',
    isExam: true,
    isFullTest: true,
    mode: 'exam',
    questions: Array.isArray(satTest4RW1) ? satTest4RW1 : [],
    module1: Array.isArray(satTest4RW1) ? satTest4RW1 : [],
    module2: Array.isArray(satTest4RW2) ? satTest4RW2 : []
  },
  {
    id: 'exam-sat-test-4-math',
    title: 'Official Test #4 - Math (Full 2 Modules)',
    domain: 'Official College Board',
    section: 'Math',
    description: 'Bài thi thử thật 2 chặng gồm Module 1 (27 câu) và Module 2 (27 câu).',
    isExam: true,
    isFullTest: true,
    mode: 'exam',
    questions: Array.isArray(satTest4Math1) ? satTest4Math1 : [],
    module1: Array.isArray(satTest4Math1) ? satTest4Math1 : [],
    module2: Array.isArray(satTest4Math2) ? satTest4Math2 : []
  },
  {
    id: 'exam-sat-test-5-rw',
    title: 'Official Test #5 - Reading & Writing (Full 2 Modules)',
    domain: 'Official College Board',
    section: 'Reading and Writing',
    description: 'Bài thi thử thật 2 chặng gồm Module 1 (33 câu) và Module 2 (33 câu).',
    isExam: true,
    isFullTest: true,
    mode: 'exam',
    questions: Array.isArray(satTest5RW1) ? satTest5RW1 : [],
    module1: Array.isArray(satTest5RW1) ? satTest5RW1 : [],
    module2: Array.isArray(satTest5RW2) ? satTest5RW2 : []
  },
  {
    id: 'exam-sat-test-5-math',
    title: 'Official Test #5 - Math (Full 2 Modules)',
    domain: 'Official College Board',
    section: 'Math',
    description: 'Bài thi thử thật 2 chặng gồm Module 1 (27 câu) và Module 2 (27 câu).',
    isExam: true,
    isFullTest: true,
    mode: 'exam',
    questions: Array.isArray(satTest5Math1) ? satTest5Math1 : [],
    module1: Array.isArray(satTest5Math1) ? satTest5Math1 : [],
    module2: Array.isArray(satTest5Math2) ? satTest5Math2 : []
  },
  {
    id: 'exam-sat-test-6-rw',
    title: 'Official Test #6 - Reading & Writing (Full 2 Modules)',
    domain: 'Official College Board',
    section: 'Reading and Writing',
    description: 'Bài thi thử thật 2 chặng gồm Module 1 (33 câu) và Module 2 (33 câu).',
    isExam: true,
    isFullTest: true,
    mode: 'exam',
    questions: Array.isArray(satTest6RW1) ? satTest6RW1 : [],
    module1: Array.isArray(satTest6RW1) ? satTest6RW1 : [],
    module2: Array.isArray(satTest6RW2) ? satTest6RW2 : []
  },
  {
    id: 'exam-sat-test-6-math',
    title: 'Official Test #6 - Math (Full 2 Modules)',
    domain: 'Official College Board',
    section: 'Math',
    description: 'Bài thi thử thật 2 chặng gồm Module 1 (27 câu) và Module 2 (27 câu).',
    isExam: true,
    isFullTest: true,
    mode: 'exam',
    questions: Array.isArray(satTest6Math1) ? satTest6Math1 : [],
    module1: Array.isArray(satTest6Math1) ? satTest6Math1 : [],
    module2: Array.isArray(satTest6Math2) ? satTest6Math2 : []
  },

  // =========================================================================
  // TAB "LUYỆN TẬP" & TAB "MATH": CHUYÊN ĐỀ TOÁN (ẨN SẠCH ĐỀ THI THẬT)
  // =========================================================================
  {
    id: 'sat-geometry-trig-mastery',
    title: 'Geometry & Trigonometry Question Bank (Hình học & Lượng giác)',
    domain: 'Geometry and Trigonometry',
    section: 'Math',
    description: `Bộ ngân hàng câu hỏi Hình học & Lượng giác toàn diện (${geomList.length || 148} câu).`,
    isExam: false,
    mode: 'practice',
    questions: geomList
  },
  {
    id: 'sat-data-analysis-mastery',
    title: 'Problem-Solving & Data Analysis Question Bank (Phân tích dữ liệu)',
    domain: 'Problem-Solving and Data Analysis',
    section: 'Math',
    description: `Bộ ngân hàng câu hỏi Phân tích Dữ liệu & Thống kê toàn diện (${dataList.length || 167} câu).`,
    isExam: false,
    mode: 'practice',
    questions: dataList
  },
  {
    id: 'algebra',
    title: 'Algebra (Đại số tuyến tính)',
    domain: 'Algebra',
    section: 'Math',
    description: 'Phương trình tuyến tính, hệ phương trình, đồ thị và bất phương trình.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(algebraQuestions) ? algebraQuestions : []
  },
  {
    id: 'practice-test-8-math-m1',
    title: 'Luyện tập: Test #8 Math - Module 1',
    domain: 'Official College Board',
    section: 'Math',
    description: 'Luyện tập riêng Module 1 Toán Test 8 (27 câu). Nộp bài xem đáp án ngay.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(satTest8Math1) ? satTest8Math1 : []
  },
  {
    id: 'practice-test-8-math-m2',
    title: 'Luyện tập: Test #8 Math - Module 2',
    domain: 'Official College Board',
    section: 'Math',
    description: 'Luyện tập riêng Module 2 Toán Test 8 (27 câu). Nộp bài xem đáp án ngay.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(satTest8Math2) ? satTest8Math2 : []
  },
  {
    id: 'practice-test-7-math-m1',
    title: 'Luyện tập: Test #7 Math - Module 1',
    domain: 'Official College Board',
    section: 'Math',
    description: 'Luyện tập riêng Module 1 Toán Test 7 (27 câu).',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(satTest7Math1) ? satTest7Math1 : []
  },
  {
    id: 'practice-test-5-math-m1',
    title: 'Luyện tập: Test #5 Math - Module 1',
    domain: 'Official College Board',
    section: 'Math',
    description: 'Luyện tập riêng Module 1 Toán Test 5 (27 câu).',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(satTest5Math1) ? satTest5Math1 : []
  },

  // =========================================================================
  // TAB "LUYỆN TẬP" & TAB "R&W": CHUYÊN ĐỀ VERBAL (ẨN SẠCH ĐỀ THI THẬT)
  // =========================================================================
  {
    id: 'command-of-evidence',
    title: 'Command of Evidence (Dẫn chứng & Bảng biểu)',
    domain: 'Information and Ideas',
    section: 'Reading and Writing',
    description: 'Phân tích dữ liệu văn bản, bảng thống kê và luận điểm khoa học.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(commandOfEvidenceQuestions) ? commandOfEvidenceQuestions : []
  },
  {
    id: 'words-in-context',
    title: 'Words in Context (Từ vựng ngữ cảnh)',
    domain: 'Craft and Structure',
    section: 'Reading and Writing',
    description: 'Lựa chọn từ ngữ chính xác và phân tích cấu trúc diễn đạt.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(wordInContextQuestions) ? wordInContextQuestions : []
  },
  {
    id: 'transitions',
    title: 'Transitions (Từ nối logic)',
    domain: 'Expression of Ideas',
    section: 'Reading and Writing',
    description: 'Các liên từ và chuyển ý logic câu trong đoạn văn bản.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(transitionQuestions) ? transitionQuestions : []
  },
  {
    id: 'grammar',
    title: 'Boundaries & Grammar (Ngữ pháp quy chuẩn)',
    domain: 'Standard English Conventions',
    section: 'Reading and Writing',
    description: 'Quy tắc ngắt câu, mệnh đề phụ, dấu câu và sự hòa hợp thì.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(grammarQuestions) ? grammarQuestions : []
  },
  {
    id: 'inference',
    title: 'Inferences (Suy luận logic)',
    domain: 'Information and Ideas',
    section: 'Reading and Writing',
    description: 'Suy luận logic kết bài và hoàn thành lập luận khoa học.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(inferenceQuestions) ? inferenceQuestions : []
  },
  {
    id: 'cross-text',
    title: 'Cross-Text Connections (Đối chiếu 2 văn bản)',
    domain: 'Craft and Structure',
    section: 'Reading and Writing',
    description: 'So sánh góc nhìn và luận điểm giữa Text 1 và Text 2.',
    isExam: false,
    mode: 'practice',
    questions: crossTextSafeList
  },
  {
    id: 'details',
    title: 'Central Ideas & Details (Ý chính & Chi tiết)',
    domain: 'Information and Ideas',
    section: 'Reading and Writing',
    description: 'Xác định chủ đề cốt lõi và nội dung trọng tâm của văn bản.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(detailsQuestions) && detailsQuestions.length > 0 ? detailsQuestions : inferenceQuestions
  },
  {
    id: 'vocabulary',
    title: 'Vocabulary (Từ vựng học thuật SAT)',
    domain: 'Craft and Structure',
    section: 'Reading and Writing',
    description: 'Trau dồi từ vựng học thuật nâng cao thường xuất hiện trong SAT.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(vocabularyQuestions) && vocabularyQuestions.length > 0 ? vocabularyQuestions : wordInContextQuestions
  },
  {
    id: 'practice-test-8-rw-m1',
    title: 'Luyện tập: Test #8 R&W - Module 1',
    domain: 'Official College Board',
    section: 'Reading and Writing',
    description: 'Luyện tập riêng Module 1 của Test 8 (33 câu). Nộp bài và xem giải thích chi tiết ngay.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(satTest8RW1) ? satTest8RW1 : []
  },
  {
    id: 'practice-test-8-rw-m2',
    title: 'Luyện tập: Test #8 R&W - Module 2',
    domain: 'Official College Board',
    section: 'Reading and Writing',
    description: 'Luyện tập riêng Module 2 của Test 8 (33 câu). Nộp bài và xem giải thích chi tiết ngay.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(satTest8RW2) ? satTest8RW2 : []
  },
  {
    id: 'practice-test-7-rw-m1',
    title: 'Luyện tập: Test #7 R&W - Module 1',
    domain: 'Official College Board',
    section: 'Reading and Writing',
    description: 'Luyện tập riêng Module 1 của Test 7 (33 câu).',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(satTest7RW1) ? satTest7RW1 : []
  },
  {
    id: 'practice-test-5-rw-m1',
    title: 'Luyện tập: Test #5 R&W - Module 1',
    domain: 'Official College Board',
    section: 'Reading and Writing',
    description: 'Luyện tập riêng Module 1 của Test 5 (33 câu).',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(satTest5RW1) ? satTest5RW1 : []
  },
  {
    id: 'practice-test-11-rw1',
    title: 'Luyện tập: Test #11 R&W (Module 1)',
    domain: 'Official College Board',
    section: 'Reading and Writing',
    description: 'Đề thi lẻ 27 câu Verbal chính thức từ College Board.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(satTest11RW1) ? satTest11RW1 : []
  },
  {
    id: 'practice-verbal-hard-01',
    title: 'Luyện tập: Verbal Hard Test 01',
    domain: 'Advanced Reading & Writing',
    section: 'Reading and Writing',
    description: 'Bộ 27 câu hỏi đọc hiểu khó mục tiêu 750+.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(verbalHard1) ? verbalHard1 : []
  },
  {
    id: 'practice-verbal-hard-02',
    title: 'Luyện tập: Verbal Hard Test 02',
    domain: 'Advanced Reading & Writing',
    section: 'Reading and Writing',
    description: 'Bộ 27 câu hỏi đọc hiểu khó mục tiêu 750+.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(verbalHard2) ? verbalHard2 : []
  }
];

export function createAdaptiveExamSession(section = 'Math') {
  const isMath = section.toLowerCase().includes('math');
  
  const m1 = isMath 
    ? (Array.isArray(satTest7Math1) ? satTest7Math1 : []) 
    : (Array.isArray(satTest7RW1) ? satTest7RW1 : []);

  const m2Hard = isMath 
    ? (Array.isArray(satTest8Math2) ? satTest8Math2 : []) 
    : (Array.isArray(satTest8RW2) ? satTest8RW2 : []);

  const m2Easy = isMath 
    ? (Array.isArray(satTest7Math2) ? satTest7Math2 : []) 
    : (Array.isArray(satTest7RW2) ? satTest7RW2 : []);

  return {
    id: `adaptive_${Date.now()}`,
    title: `Digital SAT Adaptive ${isMath ? 'Math' : 'Reading & Writing'} Exam`,
    section: isMath ? 'Math' : 'Reading and Writing',
    mode: 'exam',
    isExam: true,
    isFullTest: true,
    module1: m1,
    module2Easy: m2Easy,
    module2Hard: m2Hard,
    questions: m1
  };
}

export const questionService = {
  getCategories: () => DEFAULT_CATEGORIES,
  
  getQuestionsByCategory: (categoryId) => {
    const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
    return category ? (category.questions || []) : [];
  },

  getAllMathQuestions: () => {
    return DEFAULT_CATEGORIES
      .filter(c => c.section === 'Math')
      .flatMap(c => c.questions || []);
  },

  getAllReadingQuestions: () => {
    return DEFAULT_CATEGORIES
      .filter(c => c.section === 'Reading and Writing')
      .flatMap(c => c.questions || []);
  },

  createAdaptiveExamSession
};

export default questionService;