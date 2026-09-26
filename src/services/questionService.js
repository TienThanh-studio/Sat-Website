import wordsInContextData from '../data/questions/wordInContext.json';
import commandOfEvidenceData from '../data/questions/commandOfEvidence.json';
import crossTextData from '../data/questions/crossText.json';
import detailsData from '../data/questions/details.json';
import grammarData from '../data/questions/grammar.json';
import inferenceData from '../data/questions/inference.json';
import transitionData from '../data/questions/transition.json';
import vocabularyData from '../data/questions/vocabulary.json';
import algebraData from '../data/questions/algebra.json';

// Cấu hình đầy đủ danh mục SAT (Reading & Writing + Math)
export const DEFAULT_CATEGORIES = [
  // --- READING & WRITING ---
  {
    id: 'words-in-context',
    title: 'Words in Context',
    domain: 'Craft and Structure',
    section: 'Reading & Writing',
    description: 'Xác định nghĩa của từ và cụm từ dựa theo ngữ cảnh văn bản.',
    questions: wordsInContextData || []
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
    questions: crossTextData || []
  },
  {
    id: 'central-ideas',
    title: 'Central Ideas and Details',
    domain: 'Information and Ideas',
    section: 'Reading & Writing',
    description: 'Tìm ý chính và định vị chi tiết then chốt trong văn bản.',
    questions: detailsData || []
  },
  {
    id: 'command-of-evidence',
    title: 'Command of Evidence',
    domain: 'Information and Ideas',
    section: 'Reading & Writing',
    description: 'Đánh giá bằng chứng văn bản và dữ liệu bảng biểu/đồ thị.',
    questions: commandOfEvidenceData || []
  },
  {
    id: 'inferences',
    title: 'Inferences',
    domain: 'Information and Ideas',
    section: 'Reading & Writing',
    description: 'Đưa ra kết luận suy luận hợp lý nhất từ các dữ kiện cho trước.',
    questions: inferenceData || []
  },
  {
    id: 'boundaries',
    title: 'Form, Structure, and Sense',
    domain: 'Standard English Conventions',
    section: 'Reading & Writing',
    description: 'Quy tắc ngữ pháp, dấu câu và cấu trúc câu tiếng Anh tiêu chuẩn.',
    questions: grammarData || []
  },
  {
    id: 'transitions',
    title: 'Transitions',
    domain: 'Expression of Ideas',
    section: 'Reading & Writing',
    description: 'Lựa chọn từ nối và liên từ logic giữa các mệnh đề.',
    questions: transitionData || []
  },

  // --- MATH ---
  {
    id: 'algebra',
    title: 'Algebra (Đại số tuyến tính)',
    domain: 'Heart of Algebra',
    section: 'Math',
    description: 'Phương trình tuyến tính, hệ phương trình, bất đẳng thức và đồ thị đường thẳng.',
    questions: algebraData || []
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
  // Lấy toàn bộ danh mục kèm số lượng câu hỏi thực tế (bao gồm cả câu upload vào localStorage)
  getCategories: () => {
    const uploadedMath = JSON.parse(localStorage.getItem('sat_math_questions') || '[]');
    
    return DEFAULT_CATEGORIES.map(cat => {
      let qList = [...(cat.questions || [])];
      
      // Nếu là Math, gộp thêm các câu đã upload qua LaTeX Parser nếu có
      if (cat.section === 'Math') {
        const extra = uploadedMath.filter(q => 
          q.category?.toLowerCase() === cat.title?.toLowerCase() ||
          q.category?.toLowerCase() === cat.id?.toLowerCase()
        );
        qList = [...qList, ...extra];
      }

      return {
        ...cat,
        questionCount: qList.length,
        questions: qList
      };
    });
  },

  // Lấy câu hỏi theo ID danh mục
  getQuestionsByCategory: (categoryId) => {
    const categories = questionService.getCategories();
    const target = categories.find(c => c.id === categoryId);
    return target ? target.questions : [];
  },

  // Thống kê nhanh
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