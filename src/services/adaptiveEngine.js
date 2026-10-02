export const ADAPTIVE_CONFIG = {
  'Reading and Writing': {
    hardThresholdPercent: 0.63,
  },
  'Math': {
    hardThresholdPercent: 0.63,
  }
};

export function sanitizeGridInInput(val) {
  if (val === undefined || val === null) return '';
  return String(val)
    .trim()
    .replace(/[^0-9./-]/g, '');
}

export function normalizeSprAnswer(val) {
  return sanitizeGridInInput(val);
}

function parseNumericValue(str) {
  if (typeof str === 'number') return str;
  if (!str) return NaN;
  const clean = String(str).trim();
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 2) {
      const num = Number(parts[0]);
      const den = Number(parts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
    return NaN;
  }
  return Number(clean);
}

export function isAnswerCorrect(userAns, question) {
  if (userAns === undefined || userAns === null || userAns === '') return false;
  if (!question) return false;

  const rawUser = String(userAns).trim();
  const rawCorrect = String(question.correctAnswer || '').trim();

  if (question.isGridIn || question.type === 'spr') {
    const accepted = Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 0
      ? question.acceptedAnswers
      : [rawCorrect];

    const userVal = parseNumericValue(rawUser);

    for (const target of accepted) {
      const strTarget = String(target).trim();
      if (rawUser.toLowerCase() === strTarget.toLowerCase()) return true;

      const targetVal = parseNumericValue(strTarget);
      if (!isNaN(userVal) && !isNaN(targetVal)) {
        if (Math.abs(userVal - targetVal) < 1e-4) return true;
      }
    }
    return false;
  }

  const extractChoice = (str) => {
    if (!str) return '';
    const clean = String(str).trim();
    const match = clean.match(/^\(?([A-Za-z])\)?[.]?$/);
    return match ? match[1].toUpperCase() : clean.toUpperCase();
  };

  const cleanUserChoice = extractChoice(rawUser);
  const cleanCorrectChoice = extractChoice(rawCorrect);

  return cleanUserChoice === cleanCorrectChoice;
}

export function routeNextModule(correctCount, totalQuestions = 27) {
  if (!totalQuestions || totalQuestions <= 0) return 'easy';
  const ratio = correctCount / totalQuestions;
  return ratio >= 0.60 ? 'hard' : 'easy';
}

export function decideModule2Route(module1Result, options = {}) {
  const correct = module1Result?.correctCount ?? module1Result?.correct ?? 0;
  const total = module1Result?.totalQuestions ?? module1Result?.total ?? 27;
  const threshold = options.threshold || 0.60;
  return (correct / total) >= threshold ? 'hard' : 'easy';
}

export function calculateSatScaledScore(sessionState) {
  const m1 = sessionState?.module1 || {};
  const m2 = sessionState?.module2 || {};

  const m1Questions = Array.isArray(m1.questions) ? m1.questions : [];
  const m2Questions = Array.isArray(m2.questions) ? m2.questions : [];

  let m1Correct = 0;
  m1Questions.forEach((q, idx) => {
    const ans = m1.answers ? m1.answers[idx] ?? m1.answers[q.id] : q.userAnswer;
    if (isAnswerCorrect(ans, q)) m1Correct++;
  });

  let m2Correct = 0;
  m2Questions.forEach((q, idx) => {
    const ans = m2.answers ? m2.answers[idx] ?? m2.answers[q.id] : q.userAnswer;
    if (isAnswerCorrect(ans, q)) m2Correct++;
  });

  const isHardBranch = m2.path === 'Hard' || (m1Questions.length > 0 && m1Correct / m1Questions.length >= 0.6);
  const totalCorrect = m1Correct + m2Correct;
  const totalQ = (m1Questions.length + m2Questions.length) || 54;

  let scaled = 400;
  if (isHardBranch) {
    scaled = 480 + Math.round((totalCorrect / totalQ) * 320);
  } else {
    scaled = 200 + Math.round((totalCorrect / totalQ) * 400);
  }

  scaled = Math.min(800, Math.max(200, Math.round(scaled / 10) * 10));

  return {
    scaledScore: scaled,
    rawCorrect: totalCorrect,
    totalQuestions: totalQ,
    module1Stats: { correct: m1Correct, total: m1Questions.length },
    module2Stats: { correct: m2Correct, total: m2Questions.length, path: isHardBranch ? 'Hard' : 'Easy' }
  };
}

export default {
  sanitizeGridInInput,
  normalizeSprAnswer,
  isAnswerCorrect,
  routeNextModule,
  decideModule2Route,
  calculateSatScaledScore
};