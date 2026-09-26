import wordInContext from '../data/questions/wordInContext.json';
import transition from '../data/questions/transition.json';
import grammar from '../data/questions/grammar.json';
import inference from '../data/questions/inference.json';
import commandOfEvidence from '../data/questions/commandOfEvidence.json';
import details from '../data/questions/details.json';
import crossText from '../data/questions/crossText.json';
import vocabulary from '../data/questions/vocabulary.json';

const CATEGORY_MAP = {
  'word-in-context': {
    id: 'word-in-context',
    label: 'Words in Context',
    category: 'Craft and Structure',
    data: Array.isArray(wordInContext) ? wordInContext : []
  },
  'text-structure': {
    id: 'text-structure',
    label: 'Text Structure and Purpose',
    category: 'Craft and Structure',
    data: Array.isArray(details) ? details : []
  },
  'cross-text': {
    id: 'cross-text',
    label: 'Cross-Text Connections',
    category: 'Craft and Structure',
    data: Array.isArray(crossText) ? crossText : []
  },
  'central-ideas': {
    id: 'central-ideas',
    label: 'Central Ideas and Details',
    category: 'Information and Ideas',
    data: Array.isArray(details) ? details : []
  },
  'command-of-evidence': {
    id: 'command-of-evidence',
    label: 'Command of Evidence',
    category: 'Information and Ideas',
    data: Array.isArray(commandOfEvidence) ? commandOfEvidence : []
  },
  'inferences': {
    id: 'inferences',
    label: 'Inferences',
    category: 'Information and Ideas',
    data: Array.isArray(inference) ? inference : []
  },
  'boundaries': {
    id: 'boundaries',
    label: 'Boundaries (Grammar)',
    category: 'Standard English Conventions',
    data: Array.isArray(grammar) ? grammar : []
  },
  'form-structure-sense': {
    id: 'form-structure-sense',
    label: 'Form, Structure, and Sense',
    category: 'Standard English Conventions',
    data: Array.isArray(grammar) ? grammar : []
  },
  'transitions': {
    id: 'transitions',
    label: 'Transitions',
    category: 'Expression of Ideas',
    data: Array.isArray(transition) ? transition : []
  },
  'rhetorical-synthesis': {
    id: 'rhetorical-synthesis',
    label: 'Rhetorical Synthesis',
    category: 'Expression of Ideas',
    data: Array.isArray(vocabulary) ? vocabulary : []
  }
};

export const questionService = {
  // Thống kê danh sách dạng bài
  getCategoryStats: () => {
    let solvedIds = [];
    try {
      solvedIds = JSON.parse(localStorage.getItem('sat_solved_correct') || '[]');
    } catch (e) {
      solvedIds = [];
    }

    return Object.values(CATEGORY_MAP).map(cat => {
      const total = cat.data.length;
      const solved = cat.data.filter(q => solvedIds.includes(q.id)).length;
      return {
        id: cat.id,
        label: cat.label,
        category: cat.category,
        totalQuestions: total,
        solvedQuestions: solved,
        availablePhases: total > 0 ? ['01'] : [],
        phases: total > 0 ? ['01'] : []
      };
    });
  },

  // Lấy câu hỏi theo id dạng bài
  getQuestionsByCategory: (categoryId) => {
    const target = CATEGORY_MAP[categoryId];
    return target ? target.data : [];
  },

  // Ghi nhận câu trả lời đúng
  recordCorrectAnswer: (questionId) => {
    if (!questionId) return;
    try {
      const solved = JSON.parse(localStorage.getItem('sat_solved_correct') || '[]');
      if (!solved.includes(questionId)) {
        solved.push(questionId);
        localStorage.setItem('sat_solved_correct', JSON.stringify(solved));
      }
    } catch (e) {
      console.warn("Không thể lưu tiến độ làm bài:", e);
    }
  }
};

export default questionService;