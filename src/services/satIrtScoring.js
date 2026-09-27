/**
 * satIrtScoring.js
 * Chấm điểm bài thi thích ứng 2 chặng và quy đổi ra thang điểm Scaled Score 200-800.
 */
import { normalizeSprAnswer, isAnswerCorrect } from './adaptiveEngine';

function roundToNearestTen(value) {
  return Math.round(value / 10) * 10;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const SCORE_CURVE = [
  { p: 0.0, s: 200 },
  { p: 0.1, s: 280 },
  { p: 0.2, s: 340 },
  { p: 0.3, s: 390 },
  { p: 0.4, s: 440 },
  { p: 0.5, s: 490 },
  { p: 0.6, s: 540 },
  { p: 0.7, s: 590 },
  { p: 0.8, s: 650 },
  { p: 0.9, s: 720 },
  { p: 1.0, s: 800 },
];

function interpolateScore(percentage) {
  const p = clamp(percentage, 0, 1);
  for (let i = 0; i < SCORE_CURVE.length - 1; i += 1) {
    const cur = SCORE_CURVE[i];
    const next = SCORE_CURVE[i + 1];
    if (p >= cur.p && p <= next.p) {
      const ratio = next.p === cur.p ? 0 : (p - cur.p) / (next.p - cur.p);
      return cur.s + ratio * (next.s - cur.s);
    }
  }
  return SCORE_CURVE[SCORE_CURVE.length - 1].s;
}

export function percentageToScaledScore(percentage, branch) {
  const rawScore = interpolateScore(percentage);
  const cap = branch === 'hard' ? 800 : 590;
  const capped = clamp(rawScore, 200, cap);
  return roundToNearestTen(capped);
}

export function gradeItems(questions = [], answers = {}) {
  let correct = 0;
  const gradedItems = questions.map((q) => {
    const userAns = answers[q.id];
    const ok = isAnswerCorrect(userAns, q);
    if (ok) correct += 1;
    return {
      ...q,
      userAnswer: userAns || '',
      isCorrect: ok
    };
  });
  return { correct, total: questions.length, gradedItems };
}

export function calculateSatScore({ module1Questions = [], module1Answers = {}, module2Questions = [], module2Answers = {}, branch = 'hard' } = {}) {
  const safeBranch = branch === 'hard' ? 'hard' : 'easy';
  const m1 = gradeItems(module1Questions, module1Answers);
  const m2 = gradeItems(module2Questions, module2Answers);

  const totalCorrect = m1.correct + m2.correct;
  const totalQuestions = m1.total + m2.total;
  const accuracyRatio = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
  const scaledScore = percentageToScaledScore(accuracyRatio, safeBranch);
  const allGraded = [...m1.gradedItems, ...m2.gradedItems];

  return {
    scaledScore,
    totalCorrect,
    totalQuestions,
    accuracy: Number((accuracyRatio * 100).toFixed(1)),
    branch: safeBranch,
    breakdown: {
      module1: { correct: m1.correct, total: m1.total },
      module2: { correct: m2.correct, total: m2.total }
    },
    gradedItems: allGraded,
  };
}

export default calculateSatScore;