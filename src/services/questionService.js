import wordsInContextData from '../data/questions/wordInContext.json';
import commandOfEvidenceData from '../data/questions/commandOfEvidence.json';
import crossTextData from '../data/questions/crossText.json';
import detailsData from '../data/questions/details.json';
import grammarData from '../data/questions/grammar.json';
import inferenceData from '../data/questions/inference.json';
import transitionData from '../data/questions/transition.json';
import vocabularyData from '../data/questions/vocabulary.json';
import algebraData from '../data/questions/algebra.json';

// Danh sách tất cả các category
export const SAT_CATEGORIES = [
  // --- READING & WRITING ---
  {
    id: 'words-in-context',
    title: 'Words in Context',
    domain: 'Craft and Structure',
    section: 'Reading & Writing',
    questions: wordsInContextData || []
  },
  {
    id: 'text-structure',
    title: 'Text Structure and Purpose',
    domain: 'Craft and Structure',
    section: 'Reading & Writing',
    questions: []
  },
  {
    id: 'cross-text',
    title: 'Cross-Text Connections',
    domain: 'Craft and Structure',
    section: 'Reading & Writing',
    questions: crossTextData || []
  },
  {
    id: 'central-ideas',
    title: 'Central Ideas and Details',
    domain: 'Information and Ideas',
    section: 'Reading & Writing',
    questions: detailsData || []
  },
  {
    id: 'command-of-evidence',
    title: 'Command of Evidence',
    domain: 'Information and Ideas',
    section: 'Reading & Writing',
    questions: commandOfEvidenceData || []
  },
  {
    id: 'inferences',
    title: 'Inferences',
    domain: 'Information and Ideas',
    section: 'Reading & Writing',
    questions: inferenceData || []
  },
  {
    id: 'boundaries',
    title: 'Form, Structure, and Sense',
    domain: 'Standard English Conventions',
    section: 'Reading & Writing',
    questions: grammarData || []
  },
  {
    id: 'transitions',
    title: 'Transitions',
    domain: 'Expression of Ideas',
    section: 'Reading & Writing',
    questions: transitionData || []
  },

  // --- MATH ---
  {
    id: 'algebra',
    title: 'Algebra (Đại số)',
    domain: 'Math: Heart of Algebra',
    section: 'Math',
    questions: algebraData || []
  }
];

// Lấy danh sách câu hỏi theo categoryId
export const getQuestionsByCategory = (categoryId) => {
  if (categoryId === 'algebra') {
    return algebraData || [];
  }
  const cat = SAT_CATEGORIES.find(c => c.id === categoryId);
  return cat ? cat.questions : [];
};

// Lấy toàn bộ câu hỏi (bao gồm cả Math)
export const getAllQuestions = () => {
  return SAT_CATEGORIES.flatMap(c => c.questions);
};