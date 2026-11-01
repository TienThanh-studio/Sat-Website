// src/services/satIrtScoring.js
import {
  ROUTING_RULES,
  routeNextModule,
  getQuestion2PLParams,
  estimateTheta2PL,
} from './adaptiveEngine';

/**
 * Thuật toán tính điểm chuẩn College Board Full Test (4 Modules):
 * - Mỗi Module có 2 câu Experimental (isExperimental = true): Bỏ qua hoàn toàn, Unscored.
 * - Hỗ trợ phân nhánh Module 2 (Hard vs Easy) theo số câu đúng Module 1.
 * - Base Score mỗi Section: 800 (tối đa), sàn tối thiểu: 200.
 * - Tổng điểm chuẩn: 400 - 1600.
 */
export function calculateModuleScore({
  m1Questions = [],
  m1Answers = {},
  m2Questions = [],
  m2Answers = {},
  section = 'Reading & Writing',
}) {
  let penaltyM1 = 0;
  let penaltyM2 = 0;
  let m1Correct = 0;
  let m2Correct = 0;
  let totalScored = 0;
  let unScoredCount = 0;

  // 1. Chấm điểm Module 1
  m1Questions.forEach((q) => {
    if (q.isExperimental) {
      unScoredCount++;
      return;
    }
    totalScored++;
    const userAns = String(m1Answers[q.id] || '').trim().toUpperCase();
    const correctAns = String(q.correctAnswer || '').trim().toUpperCase();

    if (userAns && userAns === correctAns) {
      m1Correct++;
    } else {
      penaltyM1 += 20;
    }
  });

  // Kiểm tra Routing
  const routing = routeNextModule({
    section,
    m1CorrectCount: m1Correct,
    m1TotalQuestions: m1Questions.filter((q) => !q.isExperimental).length,
  });

  // 2. Chấm điểm Module 2
  m2Questions.forEach((q) => {
    if (q.isExperimental) {
      unScoredCount++;
      return;
    }
    totalScored++;
    const userAns = String(m2Answers[q.id] || '').trim().toUpperCase();
    const correctAns = String(q.correctAnswer || '').trim().toUpperCase();

    if (userAns && userAns === correctAns) {
      m2Correct++;
    } else {
      penaltyM2 += 10;
    }
  });

  const rawScore = 800 - penaltyM1 - penaltyM2;
  let scaledScore = Math.max(200, Math.min(800, rawScore));

  // Áp dụng trần điểm nếu phân nhánh Easy
  if (routing.path === 'Easy') {
    scaledScore = Math.min(scaledScore, routing.ceilingScore);
  }

  const finalScaledScore = Math.round(scaledScore / 10) * 10;

  return {
    sectionScore: finalScaledScore,
    correctCount: m1Correct + m2Correct,
    m1Correct,
    m2Correct,
    totalScored,
    unScoredCount,
    module2Path: routing.path,
    penaltyM1,
    penaltyM2,
  };
}

/**
 * Tính điểm theo mô hình 2PL IRT cho danh sách câu hỏi
 */
export function calculateIrtScore(questions = [], section = 'Reading & Writing') {
  if (!Array.isArray(questions) || questions.length === 0) {
    return { scaledScore: 200, correctCount: 0, totalQuestions: 0, module2Path: 'Standard' };
  }

  const total = questions.length;
  let correctCount = 0;
  const evaluatedItems = [];

  questions.forEach((q, idx) => {
    const { a, b } = getQuestion2PLParams(q, idx, total);
    const isCorrect = Boolean(q.isCorrect);
    if (isCorrect) correctCount += 1;
    evaluatedItems.push({ a, b, isCorrect });
  });

  const { theta, se, carelessMistakes, hardSolved } = estimateTheta2PL(evaluatedItems);
  const rawRatio = correctCount / total;
  const normalizedTheta = (theta + 3.2) / 6.4;
  const blended = rawRatio * 0.65 + Math.min(1, Math.max(0, normalizedTheta)) * 0.35;

  let scaled = 200 + blended * 600 - carelessMistakes * 8 + hardSolved * 4;
  if (correctCount === total) scaled = 800;
  else if (correctCount === 0) scaled = 200;
  else scaled = Math.min(790, Math.max(200, scaled));

  const scaledScore = Math.round(scaled / 10) * 10;
  const isMath = String(section).toLowerCase().includes('math');
  const cutoff = isMath ? 14 : 15;
  const module2Path = correctCount >= cutoff ? 'Hard' : 'Easy';

  return {
    scaledScore,
    correctCount,
    totalQuestions: total,
    theta,
    se,
    module2Path,
  };
}

export function calculateSatSectionScore(params) {
  const totalCorrect = params?.totalCorrect || 0;
  const totalQ = params?.totalQuestions || 27;
  const approx = Math.round(200 + (totalCorrect / totalQ) * 600);
  return Math.max(200, Math.min(800, Math.round(approx / 10) * 10));
}

export default {
  calculateModuleScore,
  calculateIrtScore,
  calculateSatSectionScore,
};