/**
 * adaptiveEngine.js
 * Logic thuần cho Digital SAT Multistage Adaptive Testing (MST)
 */

export const ROUTES = Object.freeze({ EASY: 'easy', HARD: 'hard' });

export const SECTION_CONFIG = Object.freeze({
  rw: Object.freeze({
    label: 'Reading and Writing',
    questionsPerModule: 27,
    durationSec: 32 * 60,
    routingThreshold: 0.63,
  }),
  math: Object.freeze({
    label: 'Math',
    questionsPerModule: 22,
    durationSec: 35 * 60,
    routingThreshold: 0.63,
  }),
});

export function resolveSectionKey(section) {
  return String(section ?? '').toLowerCase().includes('math') ? 'math' : 'rw';
}

export function getSectionConfig(section) {
  return SECTION_CONFIG[resolveSectionKey(section)];
}

const EPS = 1e-9;
const GRID_IN_ALLOWED = /[^0-9./-]/g;
const GRID_IN_MAX_LEN = 7;
const isBlank = (v) => v === null || v === undefined || String(v).trim() === '';
const nearlyEqual = (a, b, eps = EPS) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

export function sanitizeGridInInput(value) {
  return String(value ?? '').replace(GRID_IN_ALLOWED, '').slice(0, GRID_IN_MAX_LEN);
}

export function parseNumeric(raw) {
  if (isBlank(raw)) return null;
  const s = String(raw).replace(/\s+/g, '');
  const frac = s.match(/^([+-]?\d+)\/(\d+)$/);
  if (frac) {
    const n = Number(frac[1]);
    const d = Number(frac[2]);
    if (d === 0) return null;
    return { value: n / d, fraction: { n, d }, decimals: 0 };
  }
  const dec = s.match(/^[+-]?(?:\d+\.?\d*|\.\d+)$/);
  if (dec) {
    const [, fractional = ''] = s.split('.');
    return { value: Number(s), fraction: null, decimals: fractional.length };
  }
  return null;
}

function isTerminating({ n, d }) {
  let den = Math.abs(d) / (gcd(Math.abs(n), Math.abs(d)) || 1);
  while (den % 2 === 0) den /= 2;
  while (den % 5 === 0) den /= 5;
  return den === 1;
}

function matchesRepeatingDecimal(fractionSide, decimalSide) {
  if (!fractionSide.fraction || isTerminating(fractionSide.fraction)) return false;
  if (decimalSide.fraction || decimalSide.decimals < 3) return false;
  const f = 10 ** decimalSide.decimals;
  return [Math.round, Math.trunc].some((fn) =>
    nearlyEqual(decimalSide.value, fn(fractionSide.value * f) / f, 1e-12)
  );
}

export function numericEqual(userRaw, correctRaw) {
  const u = parseNumeric(userRaw);
  const c = parseNumeric(correctRaw);
  if (!u || !c) return false;
  return (
    nearlyEqual(u.value, c.value) || matchesRepeatingDecimal(c, u) || matchesRepeatingDecimal(u, c)
  );
}

export function normalizeChoice(raw) {
  if (isBlank(raw)) return '';
  const m = String(raw).trim().match(/^$?([A-Za-z])$?[.)]?$/);
  return m ? m[1].toUpperCase() : String(raw).trim().toUpperCase();
}

const toAcceptedList = (correctAnswer) =>
  (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]).filter((a) => !isBlank(a));

export function isAnswerCorrect(question, userAnswer) {
  if (!question || isBlank(userAnswer)) return false;
  const accepted = toAcceptedList(question.correctAnswer);
  if (question.isGridIn) {
    return accepted.some(
      (a) =>
        numericEqual(userAnswer, a) ||
        String(userAnswer).trim().toLowerCase() === String(a).trim().toLowerCase()
    );
  }
  const user = normalizeChoice(userAnswer);
  return accepted.some((a) => normalizeChoice(a) === user);
}

export function gradeModule(questions, answers = {}) {
  const perQuestion = questions.map((q) => {
    const userAnswer = answers[q.id] ?? null;
    return {
      id: q.id,
      domain: q.domain,
      difficulty: q.difficulty,
      userAnswer,
      answered: !isBlank(userAnswer),
      isCorrect: isAnswerCorrect(q, userAnswer),
    };
  });
  const correct = perQuestion.filter((p) => p.isCorrect).length;
  const total = questions.length;
  return { correct, total, ratio: total ? correct / total : 0, perQuestion };
}

export function decideModule2Route(module1Result, { section, threshold } = {}) {
  const limit = threshold ?? getSectionConfig(section).routingThreshold;
  if (!module1Result?.total) return ROUTES.EASY;
  return module1Result.correct / module1Result.total >= limit - EPS ? ROUTES.HARD : ROUTES.EASY;
}

export function selectModule2Questions(pools, route, excludeIds = []) {
  const pool = pools?.[route] ?? [];
  if (!excludeIds.length) return pool;
  const banned = new Set(excludeIds);
  return pool.filter((q) => !banned.has(q.id));
}

export function buildFinalResult({ section, route, module1, module2, answers, flags }) {
  const correct = (module1?.correct || 0) + (module2?.correct || 0);
  const total = (module1?.total || 0) + (module2?.total || 0);
  return {
    section: resolveSectionKey(section),
    route,
    module1,
    module2,
    totalCorrect: correct,
    totalQuestions: total,
    rawRatio: total ? correct / total : 0,
    answers,
    flags,
    completedAt: new Date().toISOString(),
  };
}

/* Các hàm tương thích ngược (Backward Compatibility) */
export const calculateModuleCorrectCount = (moduleQuestions, userAnswers) => {
  return gradeModule(moduleQuestions, userAnswers).correct;
};

export const routeToNextModule = (section, correctCount, totalQuestions) => {
  const ratio = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  const limit = getSectionConfig(section).routingThreshold;
  return ratio >= limit ? ROUTES.HARD : ROUTES.EASY;
};