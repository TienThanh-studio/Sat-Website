/**
 * src/services/adaptiveEngine.js
 * Engine thi thích ứng 2 chặng hỗ trợ đầy đủ luồng gọi từ QuestionBankPage & ExamWorkspacePage.
 */
import questionService from './questionService';

export function normalizeQuestionPool(allQuestions) {
  if (!Array.isArray(allQuestions)) {
    return { module1: [], module2Easy: [], module2Hard: [] };
  }
  const module1 = [];
  const module2Easy = [];
  const module2Hard = [];

  allQuestions.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const question = {
      id: raw.id ?? `q_${idx}`,
      stage: raw.stage === 2 ? 2 : 1,
      branch: raw.branch === 'hard' ? 'hard' : raw.branch === 'easy' ? 'easy' : null,
      section: raw.section ?? 'Math',
      difficulty: raw.difficulty ?? (idx % 3 === 0 ? 'easy' : idx % 3 === 1 ? 'medium' : 'hard'),
      isGridIn: Boolean(raw.isGridIn || raw.type === 'spr'),
      ...raw,
    };

    if (question.stage === 2) {
      if (question.branch === 'hard') {
        module2Hard.push(question);
      } else {
        module2Easy.push(question);
      }
    } else {
      module1.push(question);
    }
  });

  if (module1.length > 0 && module2Easy.length === 0 && module2Hard.length === 0) {
    const half = Math.ceil(module1.length / 2);
    const m1 = module1.slice(0, half);
    const poolRemaining = module1.slice(half);
    return {
      module1: m1,
      module2Easy: poolRemaining.filter(q => q.difficulty !== 'hard'),
      module2Hard: poolRemaining.filter(q => q.difficulty !== 'easy')
    };
  }

  return { module1, module2Easy, module2Hard };
}

export function routeNextModule(module1Score, totalModule1) {
  const score = Number(module1Score);
  const total = Number(totalModule1);
  if (!total || total <= 0 || Number.isNaN(score)) {
    return 'easy';
  }
  const ratio = score / total;
  return ratio >= 0.6 ? 'hard' : 'easy';
}

export function getModule2Questions(pool, branch) {
  if (!pool) return [];
  return branch === 'hard' ? (pool.module2Hard || []) : (pool.module2Easy || []);
}

export function normalizeSprAnswer(value) {
  const str = String(value ?? '').trim().replace(/\s+/g, '');
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const denom = parseFloat(parts[1]);
      if (!Number.isNaN(num) && !Number.isNaN(denom) && denom !== 0) {
        return (num / denom).toFixed(4);
      }
    }
  }
  const num = parseFloat(str);
  if (!Number.isNaN(num)) {
    return num.toFixed(4);
  }
  return str.toLowerCase();
}

export function isAnswerCorrect(userAnswer, question) {
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') return false;
  if (!question) return false;

  const isGridIn = question.isGridIn || question.type === 'spr';
  if (isGridIn) {
    const accepted = question.acceptedAnswers || [question.correctAnswer];
    const uNorm = normalizeSprAnswer(userAnswer);
    return accepted.some(ans => normalizeSprAnswer(ans) === uNorm);
  }

  return String(userAnswer).trim().toUpperCase() === String(question.correctAnswer).trim().toUpperCase();
}

export function scoreModule1(module1Questions, module1Answers = {}) {
  let correct = 0;
  module1Questions.forEach((q) => {
    const userAns = module1Answers[q.id];
    if (isAnswerCorrect(userAns, q)) {
      correct += 1;
    }
  });
  return { correct, total: module1Questions.length };
}

export function buildAdaptiveExam(allQuestions) {
  const pool = normalizeQuestionPool(allQuestions);
  return {
    module1: pool.module1,
    scoreModule1: (answers) => scoreModule1(pool.module1, answers),
    route: (correct, total) => routeNextModule(correct, total),
    getModule2: (branch) => getModule2Questions(pool, branch),
  };
}

// Đối tượng adaptiveEngine tương thích đầy đủ với QuestionBankPage
export const adaptiveEngine = {
  normalizeQuestionPool,
  routeNextModule,
  getModule2Questions,
  normalizeSprAnswer,
  isAnswerCorrect,
  scoreModule1,
  buildAdaptiveExam,

  // Hàm khởi tạo bài thi thích ứng từ QuestionBankPage
  createAdaptiveSession: (section = 'Math') => {
    let pool = [];
    if (section === 'Math') {
      pool = questionService.getAllMathQuestions() || [];
    } else {
      const cats = (questionService.getCategories() || []).filter(c => c.section === 'Reading & Writing');
      pool = cats.flatMap(c => c.questions || []);
    }

    if (pool.length === 0) {
      // Fallback nếu chưa load kịp
      pool = questionService.getQuestionsByCategory('algebra') || [];
    }

    const { module1, module2Easy, module2Hard } = normalizeQuestionPool(pool);

    return {
      testId: `adaptive_${section.toLowerCase()}_${Date.now()}`,
      title: `Thi thử Adaptive: ${section}`,
      section: section,
      currentModule: 1,
      duration: 2100, // 35 phút
      questions: module1.length > 0 ? module1 : pool,
      module1Questions: module1,
      module2Easy: module2Easy,
      module2Hard: module2Hard,
      module1Answers: {},
      isHardBranch: false
    };
  },

  generateAdaptiveExam: (questions = []) => {
    return buildAdaptiveExam(questions);
  }
};

export default adaptiveEngine;