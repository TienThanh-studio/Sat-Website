// Import các chủ đề Reading & Writing
import wordsInContextData from '../data/questions/wordInContext.json';
import commandOfEvidenceData from '../data/questions/commandOfEvidence.json';
import crossTextData from '../data/questions/crossText.json';
import detailsData from '../data/questions/details.json';
import grammarData from '../data/questions/grammar.json';
import inferenceData from '../data/questions/inference.json';
import transitionData from '../data/questions/transition.json';
import vocabularyData from '../data/questions/vocabulary.json';

// Import câu hỏi Math
import algebraQuestions from '../data/questions/algebra.json';

// Import 2 đề thi tuyển chọn Verbal Hard (nằm trong thư mục tests)
import verbalHardTest1 from '../data/questions/tests/verbal_hard_test1.json';
import verbalHardTest2 from '../data/questions/tests/verbal_hard_test2.json';

//Import các đề thi từ Bluebook 
import satTest11RW1 from '../data/questions/tests/sat_test_11_rw1.json';

// Cấu hình đầy đủ danh mục Digital SAT
export const DEFAULT_CATEGORIES = [
  // --- MỤC ĐỀ THI TUYỂN CHỌN / NÂNG CAO (27 CÂU) ---
  {
    id: 'curated-hard-verbal-01',
    title: 'Phase 2.40 - Verbal Test 01 (Hard)',
    domain: 'Curated Full Test',
    section: 'Full Test',
    description: 'Đề thi Verbal nâng cao sưu tầm tuyển chọn gồm 27 câu hỏi phân hóa cao chuẩn College Board.',
    questions: Array.isArray(verbalHardTest1) ? verbalHardTest1 : []
  },
  {
    id: 'curated-hard-verbal-02',
    title: 'Phase 2.40 - Final Verbal Test 02 (Hard)',
    domain: 'Curated Full Test',
    section: 'Full Test',
    description: 'Đề thi Verbal chung cuộc nâng cao 27 câu với các bài đọc học thuật phức tạp và bẫy suy luận.',
    questions: Array.isArray(verbalHardTest2) ? verbalHardTest2 : []
  },

  // --- Mục đề thi Bluebook SAT Practice Test ---
  {
    id: 'official-sat-practice-11-rw1',
    title: 'Official SAT Practice Test #11 (Reading & Writing)',
    domain: 'Official College Board',
    section: 'Full Test',
    description: 'Đề thi chính thức Digital SAT Test #11 chuẩn 27 câu từ College Board kèm giải thích chi tiết.',
    questions: Array.isArray(satTest11RW1) ? satTest11RW1 : []
  },

  // --- READING & WRITING THEO CHUYÊN ĐỀ ---
  {
    id: 'words-in-context',
    title: 'Words in Context',
    domain: 'Craft and Structure',
    section: 'Reading & Writing',
    description: 'Xác định nghĩa của từ và cụm từ dựa theo ngữ cảnh văn bản.',
    questions: Array.isArray(wordsInContextData) ? wordsInContextData : []
  },
  {
    id: 'text-structure',
    title: 'Text Structure and Purpose',
    domain: 'Craft and Structure',
    section: 'Reading & Writing',
    description: 'Phân tích mục đích hùng biện và cấu trúc liên kết của đoạn trích.',
    questions: []
  },
  {
    id: 'cross-text',
    title: 'Cross-Text Connections',
    domain: 'Craft and Structure',
    section: 'Reading & Writing',
    description: 'So sánh, đối chiếu quan điểm giữa hai đoạn văn ngắn.',
    questions: Array.isArray(crossTextData) ? crossTextData : []
  },
  {
    id: 'central-ideas',
    title: 'Central Ideas and Details',
    domain: 'Information and Ideas',
    section: 'Reading & Writing',
    description: 'Tìm ý chính và định vị chi tiết then chốt trong văn bản.',
    questions: Array.isArray(detailsData) ? detailsData : []
  },
  {
    id: 'command-of-evidence',
    title: 'Command of Evidence',
    domain: 'Information and Ideas',
    section: 'Reading & Writing',
    description: 'Đánh giá bằng chứng văn bản và dữ liệu bảng biểu/đồ thị.',
    questions: Array.isArray(commandOfEvidenceData) ? commandOfEvidenceData : []
  },
  {
    id: 'inferences',
    title: 'Inferences',
    domain: 'Information and Ideas',
    section: 'Reading & Writing',
    description: 'Đưa ra kết luận suy luận hợp lý nhất từ các dữ kiện cho trước.',
    questions: Array.isArray(inferenceData) ? inferenceData : []
  },
  {
    id: 'boundaries',
    title: 'Form, Structure, and Sense',
    domain: 'Standard English Conventions',
    section: 'Reading & Writing',
    description: 'Quy tắc ngữ pháp, dấu câu và cấu trúc câu tiếng Anh tiêu chuẩn.',
    questions: Array.isArray(grammarData) ? grammarData : []
  },
  {
    id: 'transitions',
    title: 'Transitions',
    domain: 'Expression of Ideas',
    section: 'Reading & Writing',
    description: 'Lựa chọn từ nối và liên từ logic giữa các mệnh đề.',
    questions: Array.isArray(transitionData) ? transitionData : []
  },

  // --- MATH ---
  {
    id: 'algebra',
    title: 'Algebra (Đại số tuyến tính)',
    domain: 'Heart of Algebra',
    section: 'Math',
    description: 'Phương trình tuyến tính, hệ phương trình, bất đẳng thức và đồ thị đường thẳng.',
    questions: Array.isArray(algebraQuestions) ? algebraQuestions : []
  },
  {
    id: 'advanced-math',
    title: 'Advanced Math (Hàm số & Đa thức)',
    domain: 'Passport to Advanced Math',
    section: 'Math',
    description: 'Phương trình bậc hai, đa thức, biểu thức hữu tỉ và hàm phi tuyến.',
    questions: []
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving & Data Analysis',
    domain: 'Problem Solving and Data Analysis',
    section: 'Math',
    description: 'Tỷ lệ, phần trăm, phân tích dữ liệu thống kê và xác suất.',
    questions: []
  },
  {
    id: 'geometry',
    title: 'Geometry & Trigonometry',
    domain: 'Additional Topics in Math',
    section: 'Math',
    description: 'Hình học phẳng, lượng giác, đường tròn và hình học không gian.',
    questions: []
  }
];

export const questionService = {
  // Lấy toàn bộ danh mục kèm số lượng câu hỏi thực tế (kết hợp cả câu hỏi lưu trong localStorage)
  getCategories: () => {
    let extraMath = [];
    try {
      extraMath = JSON.parse(localStorage.getItem('sat_math_questions') || '[]');
    } catch (e) {
      extraMath = [];
    }

    return DEFAULT_CATEGORIES.map(cat => {
      let qList = [...(cat.questions || [])];
      if (cat.id === 'algebra' && extraMath.length > 0) {
        qList = [...qList, ...extraMath];
      }
      return {
        ...cat,
        questionCount: qList.length,
        questions: qList
      };
    });
  },

  // Lấy toàn bộ câu hỏi Math
  getAllMathQuestions: () => {
    let extraMath = [];
    try {
      extraMath = JSON.parse(localStorage.getItem('sat_math_questions') || '[]');
    } catch (e) {
      extraMath = [];
    }
    return [...(Array.isArray(algebraQuestions) ? algebraQuestions : []), ...extraMath];
  },

  // Lấy danh sách đề thi tuyển chọn nâng cao (Full Test)
  getCuratedHardTests: () => {
    return questionService.getCategories().filter(c => c.section === 'Full Test');
  },

  // Lấy câu hỏi theo ID danh mục
  getQuestionsByCategory: (categoryId) => {
    const categories = questionService.getCategories();
    const target = categories.find(c => c.id === categoryId);
    return target ? target.questions : [];
  },

  // Thống kê nhanh số lượng câu theo từng Category
  getCategoryStats: () => {
    const categories = questionService.getCategories();
    return categories.map(cat => ({
      id: cat.id,
      title: cat.title,
      domain: cat.domain,
      section: cat.section,
      total: cat.questionCount,
      completed: 0
    }));
  }
};

export default questionService;