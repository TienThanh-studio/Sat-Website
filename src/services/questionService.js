import algebraQuestions from '../data/questions/algebra.json';
import grammarQuestions from '../data/questions/grammar.json';
import transitionQuestions from '../data/questions/transition.json';
import wordInContextQuestions from '../data/questions/wordInContext.json';
import commandOfEvidenceQuestions from '../data/questions/commandOfEvidence.json';
import crossTextQuestions from '../data/questions/crossText.json';
import detailsQuestions from '../data/questions/details.json';
import inferenceQuestions from '../data/questions/inference.json';
import vocabularyQuestions from '../data/questions/vocabulary.json';

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

// Dữ liệu ngân hàng câu hỏi Hình học & Lượng giác
const geometryQuestionsList = [
  {
    id: "geom_001",
    questionNumber: 1,
    section: "Math",
    domain: "Geometry and Trigonometry",
    difficulty: "medium",
    question: "Square $A$ has side lengths that are $166$ times the side lengths of square $B$. The area of square $A$ is $k$ times the area of square $B$. What is the value of $k$?",
    isGridIn: true,
    correctAnswer: "27556",
    explanation: "Since the ratio of side lengths is 166, the ratio of areas is $166^2 = 27{,}556$."
  },
  {
    id: "geom_002",
    questionNumber: 2,
    section: "Math",
    domain: "Geometry and Trigonometry",
    difficulty: "hard",
    question: "A cube has an edge length of $68\\text{ inches}$. A solid sphere with a radius of $34\\text{ inches}$ is inside the cube, such that the sphere touches the center of each face of the cube. To the nearest cubic inch, what is the volume of the space in the cube not taken up by the sphere?",
    isGridIn: false,
    options: { "A": "149,796", "B": "164,500", "C": "190,955", "D": "310,800" },
    correctAnswer: "A",
    explanation: "Cube volume = $68^3 = 314{,}432$. Sphere volume = $\\frac{4}{3}\\pi (34)^3 \\approx 164{,}636$. Difference $\\approx 314{,}432 - 164{,}636 = 149{,}796$."
  },
  {
    id: "geom_003",
    questionNumber: 3,
    section: "Math",
    domain: "Geometry and Trigonometry",
    difficulty: "medium",
    question: "A right circular cylinder has radius $r$ and height $h$. A second right circular cylinder has volume $392$ times as large. Which of the following could represent radius $R$ and height $H$ of the second cylinder?",
    isGridIn: false,
    options: { "A": "R = 8r and H = 7h", "B": "R = 8r and H = 49h", "C": "R = 7r and H = 8h", "D": "R = 49r and H = 8h" },
    correctAnswer: "C",
    explanation: "Volume scale = $(R/r)^2 \\times (H/h) = 7^2 \\times 8 = 49 \\times 8 = 392$."
  },
  {
    id: "geom_004",
    questionNumber: 4,
    section: "Math",
    domain: "Geometry and Trigonometry",
    difficulty: "medium",
    question: "A cube has a volume of $474{,}552\\text{ cubic units}$. What is the surface area, in square units, of the cube?",
    isGridIn: true,
    correctAnswer: "36504",
    explanation: "Edge length $s = \\sqrt[3]{474{,}552} = 78$. Surface area = $6s^2 = 6 \\times 78^2 = 36{,}504$."
  },
  {
    id: "geom_005",
    questionNumber: 5,
    section: "Math",
    domain: "Geometry and Trigonometry",
    difficulty: "easy",
    question: "A right circular cone has a height of $22\\text{ cm}$ and a base with a diameter of $6\\text{ cm}$. The volume of this cone is $n\\pi\\text{ cm}^3$. What is the value of $n$?",
    isGridIn: true,
    correctAnswer: "66",
    explanation: "Radius $r = 3\\text{ cm}$. Volume = $\\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi (9)(22) = 66\\pi$. Thus $n = 66$."
  },
  {
    id: "geom_006",
    questionNumber: 6,
    section: "Math",
    domain: "Geometry and Trigonometry",
    difficulty: "easy",
    question: "A right cylindrical container has height $4\\text{ inches}$ longer than its radius $r$. Which expresses its volume $V$ in cubic inches?",
    isGridIn: false,
    options: { "A": "V = 4\\pi r^3", "B": "V = \\pi(2r)^3", "C": "V = \\pi r^2 + 4\\pi r", "D": "V = \\pi r^3 + 4\\pi r^2" },
    correctAnswer: "D",
    explanation: "$V = \\pi r^2 (r + 4) = \\pi r^3 + 4\\pi r^2$."
  },
  {
    id: "geom_007",
    questionNumber: 7,
    section: "Math",
    domain: "Geometry and Trigonometry",
    difficulty: "easy",
    question: "A rectangular poster has an area of $360\\text{ sq inches}$. If both length and width are increased by $20\\%$, what is the area of the copy?",
    isGridIn: true,
    correctAnswer: "518.4",
    explanation: "New area = $360 \\times (1.20)^2 = 360 \\times 1.44 = 518.4$."
  },
  {
    id: "geom_008",
    questionNumber: 8,
    section: "Math",
    domain: "Geometry and Trigonometry",
    difficulty: "easy",
    question: "A right rectangular prism has length $28\\text{ cm}$, width $15\\text{ cm}$, and height $16\\text{ cm}$. What is the surface area in $\\text{cm}^2$?",
    isGridIn: true,
    correctAnswer: "2216",
    explanation: "$2(28 \\times 15 + 15 \\times 16 + 28 \\times 16) = 2(420 + 240 + 448) = 2(1108) = 2{,}216$."
  },
  {
    id: "geom_009",
    questionNumber: 9,
    section: "Math",
    domain: "Geometry and Trigonometry",
    difficulty: "easy",
    question: "A right circular cone has volume $\\frac{1}{3}\\pi\\text{ cu ft}$ and height $9\\text{ ft}$. What is the radius of the base?",
    isGridIn: false,
    options: { "A": "1/3", "B": "1/\\sqrt{3}", "C": "\\sqrt{3}", "D": "3" },
    correctAnswer: "A",
    explanation: "$\\frac{1}{3}\\pi r^2 (9) = \\frac{1}{3}\\pi \\implies 9r^2 = 1 \\implies r = 1/3$."
  },
  {
    id: "geom_010",
    questionNumber: 10,
    section: "Math",
    domain: "Geometry and Trigonometry",
    difficulty: "hard",
    question: "Two identical square-base prisms each have height $90\\text{ cm}$ and surface area $K$. Glued along a square base, the resulting prism has surface area $\\frac{92}{47}K$. What is the side length of the square base in cm?",
    isGridIn: false,
    options: { "A": "4", "B": "8", "C": "9", "D": "16" },
    correctAnswer: "B",
    explanation: "Solving $2K - 2s^2 = \\frac{92}{47}K \\implies s = 8$."
  }
];

// Dữ liệu ngân hàng câu hỏi Problem-Solving and Data Analysis
const dataAnalysisQuestionsList = [
  {
    id: "data_001",
    questionNumber: 1,
    section: "Math",
    domain: "Problem-Solving and Data Analysis",
    difficulty: "hard",
    question: "The table below gives the growth factor for tree species:\n\n| Species of tree | Growth factor |\n|---|---|\n| Red maple | 4.5 |\n| River birch | 3.5 |\n| Cottonwood | 2.0 |\n| White birch | 5.0 |\n| Pin oak | 3.0 |\n\nIf a white birch and a pin oak each now have a diameter of 1 foot (12 inches), which of the following is closest to the difference, in inches, of their diameters 10 years from now?",
    isGridIn: false,
    options: { "A": "1.0", "B": "1.2", "C": "1.3", "D": "1.4" },
    correctAnswer: "C",
    explanation: "10-year difference = $10/3.0 - 10/5.0 = 3.33 - 2.0 = 1.33 \\approx 1.3\\text{ inches}$."
  },
  {
    id: "data_002",
    questionNumber: 2,
    section: "Math",
    domain: "Problem-Solving and Data Analysis",
    difficulty: "medium",
    question: "A sample of oak has density $807\\text{ kg/m}^3$ and is a cube with each edge $0.90\\text{ m}$. To the nearest whole number, what is the mass in kg?",
    isGridIn: false,
    options: { "A": "588", "B": "726", "C": "897", "D": "1,107" },
    correctAnswer: "A",
    explanation: "Mass = $807 \\times (0.90)^3 = 807 \\times 0.729 \\approx 588\\text{ kg}$."
  },
  {
    id: "data_003",
    questionNumber: 3,
    section: "Math",
    domain: "Problem-Solving and Data Analysis",
    difficulty: "medium",
    question: "If $\\dfrac{4a}{b} = 6.7$ and $\\dfrac{a}{bn} = 26.8$, what is the value of $n$?",
    isGridIn: true,
    correctAnswer: "0.0625",
    explanation: "$a/b = 1.675$. $1.675 / n = 26.8 \\implies n = 0.0625$."
  },
  {
    id: "data_004",
    questionNumber: 4,
    section: "Math",
    domain: "Problem-Solving and Data Analysis",
    difficulty: "medium",
    question: "A cubic sample of wood has density $353\\text{ kg/m}^3$ and mass $345\\text{ kg}$. What is the length of one edge to the nearest hundredth of a meter?",
    isGridIn: false,
    options: { "A": "0.98", "B": "0.99", "C": "1.01", "D": "1.02" },
    correctAnswer: "B",
    explanation: "Edge = $\\sqrt[3]{345 / 353} \\approx 0.99\\text{ m}$."
  },
  {
    id: "data_005",
    questionNumber: 5,
    section: "Math",
    domain: "Problem-Solving and Data Analysis",
    difficulty: "easy",
    question: "Anita creates paint mixing 2 oz blue with 3 oz yellow. In a second batch she uses 5 oz blue paint with the same ratio. How much yellow paint should she use?",
    isGridIn: false,
    options: {
      "A": "Exactly 5 ounces",
      "B": "3 ounces more than the first batch",
      "C": "1.5 times the yellow paint in the first batch",
      "D": "1.5 times the blue paint used in the second batch"
    },
    correctAnswer: "D",
    explanation: "Yellow is always $3/2 = 1.5$ times the blue paint in the mix."
  },
  {
    id: "data_006",
    questionNumber: 6,
    section: "Math",
    domain: "Problem-Solving and Data Analysis",
    difficulty: "medium",
    question: "A park has an area of $11{,}863{,}808\\text{ sq yd}$. What is the area in square miles? ($1\\text{ mile} = 1{,}760\\text{ yards}$)",
    isGridIn: false,
    options: { "A": "1.96", "B": "3.83", "C": "3,444.39", "D": "6,740.8" },
    correctAnswer: "B",
    explanation: "$11{,}863{,}808 / (1{,}760)^2 = 11{,}863{,}808 / 3{,}097{,}600 \\approx 3.83$."
  },
  {
    id: "data_007",
    questionNumber: 7,
    section: "Math",
    domain: "Problem-Solving and Data Analysis",
    difficulty: "easy",
    question: "Jeremy deposited $x$ dollars on Jan 1, 2001. The amount doubled each year until it reached $480$ dollars on Jan 1, 2005. What is the value of $x$?",
    isGridIn: true,
    correctAnswer: "30",
    explanation: "$x \\times 2^4 = 480 \\implies 16x = 480 \\implies x = 30$."
  },
  {
    id: "data_008",
    questionNumber: 8,
    section: "Math",
    domain: "Problem-Solving and Data Analysis",
    difficulty: "medium",
    question: "Nine Texas wind projects have capacity $4{,}952\\text{ MW}$. Operated continuously for $24\\text{ hours}$ at maximum rate, approximately how many megawatt-hours are produced?",
    isGridIn: false,
    options: { "A": "200", "B": "5,000", "C": "11,000", "D": "120,000" },
    correctAnswer: "D",
    explanation: "$4{,}952 \\times 24 = 118{,}848 \\approx 120{,}000\\text{ MWh}$."
  },
  {
    id: "data_009",
    questionNumber: 9,
    section: "Math",
    domain: "Problem-Solving and Data Analysis",
    difficulty: "easy",
    question: "A town has an area of $4.36\\text{ sq miles}$. What is the area in square yards? ($1\\text{ mile} = 1{,}760\\text{ yards}$)",
    isGridIn: false,
    options: { "A": "404", "B": "7,674", "C": "710,459", "D": "13,505,536" },
    correctAnswer: "D",
    explanation: "$4.36 \\times 1{,}760^2 = 13{,}505{,}536\\text{ sq yards}$."
  },
  {
    id: "data_010",
    questionNumber: 10,
    section: "Math",
    domain: "Problem-Solving and Data Analysis",
    difficulty: "medium",
    question: "A poll estimates $30\\%$ of teens are heavy texters with margin of error $3\\%$. Which is a correct statement?",
    isGridIn: false,
    options: {
      "A": "3% of teens surveyed are not really heavy texters",
      "B": "It is not possible the true percent is less than 27%",
      "C": "The true percent of teens is exactly 33%",
      "D": "It is doubtful that the percent of all US teens is 35%"
    },
    correctAnswer: "D",
    explanation: "35% is outside the plausible interval of $[27\\%, 33\\%]$."
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
    description: 'Bộ câu hỏi Hình học & Lượng giác toàn diện, đầy đủ tam giác, đường tròn, hình khối và tỷ số lượng giác.',
    isExam: false,
    mode: 'practice',
    questions: geometryQuestionsList
  },
  {
    id: 'sat-data-analysis-mastery',
    title: 'Problem-Solving & Data Analysis Question Bank (Phân tích dữ liệu)',
    domain: 'Problem-Solving and Data Analysis',
    section: 'Math',
    description: 'Bộ câu hỏi Phân tích Dữ liệu, Xác suất Thống kê, Bảng tần số, Scatterplot và Đơn vị thực tế.',
    isExam: false,
    mode: 'practice',
    questions: dataAnalysisQuestionsList
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
    questions: Array.isArray(crossTextQuestions) ? crossTextQuestions : []
  },
  {
    id: 'details',
    title: 'Central Ideas & Details (Ý chính & Chi tiết)',
    domain: 'Information and Ideas',
    section: 'Reading and Writing',
    description: 'Xác định chủ đề cốt lõi và nội dung trọng tâm của văn bản.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(detailsQuestions) ? detailsQuestions : []
  },
  {
    id: 'vocabulary',
    title: 'Vocabulary (Từ vựng học thuật SAT)',
    domain: 'Craft and Structure',
    section: 'Reading and Writing',
    description: 'Trau dồi từ vựng học thuật nâng cao thường xuất hiện trong SAT.',
    isExam: false,
    mode: 'practice',
    questions: Array.isArray(vocabularyQuestions) ? vocabularyQuestions : []
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