/**
 * src/services/adaptiveEngine.js
 *
 * Module dịch vụ độc lập mô phỏng cơ chế Multistage Adaptive Testing (MST)
 * 2 chặng của Digital SAT, cùng thuật toán quy đổi điểm số (200 - 800)
 * theo phong cách IRT (Item Response Theory).
 */

// ============================================================================
// HẰNG SỐ CẤU HÌNH
// ============================================================================
export const SECTION_CONFIG = {
  'Reading & Writing': {
    module1Count: 27,
    module2Count: 27,
    difficultyRatio: { easy: 0.3, medium: 0.4, hard: 0.3 },
  },
  Math: {
    module1Count: 22,
    module2Count: 22,
    difficultyRatio: { easy: 0.3, medium: 0.4, hard: 0.3 },
  },
};

// Ngưỡng phân nhánh sau Module 1 (>= 60% vào nhánh Hard)
export const BRANCHING_THRESHOLD = 0.6;

// Trọng số điểm theo độ khó câu hỏi (dùng khi quy đổi Scaled Score)
const DIFFICULTY_WEIGHT = {
  easy: 1,
  medium: 1.5,
  hard: 2.2,
};

// Giới hạn thang điểm quy đổi theo nhánh
const SCORE_BAND = {
  Hard: { min: 480, max: 800 },
  Easy: { min: 200, max: 600 },
};

const GLOBAL_MIN_SCORE = 200;
const GLOBAL_MAX_SCORE = 800;

// ============================================================================
// TIỆN ÍCH NỘI BỘ (helpers)
// ============================================================================
const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

const shuffle = (arr) => {
  const cloned = [...safeArray(arr)];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

/**
 * Chuẩn hóa chuỗi đáp án dạng số (SPR / Grid-in), hỗ trợ so khớp phân số <-> thập phân.
 * Export cả 2 tên normalizeSprAnswer và normalizeGridInAnswer để tương thích mọi service.
 */
export const normalizeGridInAnswer = (rawValue) => {
  if (rawValue === null || rawValue === undefined) return null;
  const value = String(rawValue).trim().replace(/\s+/g, '');
  if (value === '') return null;

  // Dạng phân số a/b
  const fractionMatch = value.match(/^-?\d+\/\d+$/);
  if (fractionMatch) {
    const [numeratorStr, denominatorStr] = value.split('/');
    const numerator = parseFloat(numeratorStr);
    const denominator = parseFloat(denominatorStr);
    if (denominator === 0 || Number.isNaN(numerator) || Number.isNaN(denominator)) {
      return null;
    }
    return parseFloat((numerator / denominator).toFixed(6));
  }

  // Dạng số thập phân / số nguyên
  const numericValue = parseFloat(value);
  if (Number.isNaN(numericValue)) return null;
  return parseFloat(numericValue.toFixed(6));
};

// Alias export đúng tên satIrtScoring.js đang gọi
export const normalizeSprAnswer = normalizeGridInAnswer;

/**
 * So sánh câu trả lời của thí sinh với đáp án đúng, hỗ trợ cả trắc nghiệm
 * lẫn grid-in (điền số), chuẩn hóa cả phân số và số thập phân.
 */
export const isAnswerCorrect = (question, userAnswer) => {
  if (!question || userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return false;
  }

  if (question.isGridIn) {
    const accepted = safeArray(question.acceptedAnswers).length
      ? question.acceptedAnswers
      : [question.correctAnswer].filter(Boolean);

    const normalizedUser = normalizeGridInAnswer(userAnswer);
    if (normalizedUser === null) return false;

    return accepted.some((acceptedValue) => {
      const normalizedAccepted = normalizeGridInAnswer(acceptedValue);
      if (normalizedAccepted === null) return false;
      return Math.abs(normalizedAccepted - normalizedUser) < 1e-6;
    });
  }

  // Trắc nghiệm thông thường
  return String(userAnswer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
};

/**
 * Làm tròn điểm số về bội số gần nhất của 10, giới hạn trong [min, max].
 */
const roundToNearestTen = (value, min = GLOBAL_MIN_SCORE, max = GLOBAL_MAX_SCORE) => {
  const rounded = Math.round(value / 10) * 10;
  return Math.min(max, Math.max(min, rounded));
};

const getDomainKey = (question) => (question && question.domain ? question.domain : 'General');

const getUniqueDomains = (questions) => {
  const domains = safeArray(questions).map(getDomainKey);
  return [...new Set(domains)];
};

/**
 * Lấy N câu hỏi theo tỷ lệ độ khó mong muốn, trải đều qua các domain.
 */
const pickQuestionsByRatio = (pool, count, ratio, usedIds = new Set()) => {
  const availablePool = safeArray(pool).filter((q) => q && !usedIds.has(q.id));
  if (availablePool.length === 0 || count <= 0) return [];

  const domains = getUniqueDomains(availablePool);
  const byDifficulty = {
    easy: shuffle(availablePool.filter((q) => q.difficulty === 'easy')),
    medium: shuffle(availablePool.filter((q) => q.difficulty === 'medium')),
    hard: shuffle(availablePool.filter((q) => q.difficulty === 'hard')),
  };

  const targetCounts = {
    easy: Math.round(count * (ratio.easy || 0)),
    medium: Math.round(count * (ratio.medium || 0)),
    hard: Math.round(count * (ratio.hard || 0)),
  };

  let diff = count - (targetCounts.easy + targetCounts.medium + targetCounts.hard);
  const diffOrder = ['medium', 'hard', 'easy'];
  let diffIndex = 0;
  while (diff !== 0 && diffIndex < 100) {
    const key = diffOrder[diffIndex % diffOrder.length];
    targetCounts[key] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
    diffIndex++;
  }

  const selected = [];
  const selectedIds = new Set();

  const takeSpreadAcrossDomains = (difficultyKey, wantedCount) => {
    const bucket = byDifficulty[difficultyKey];
    if (!bucket || wantedCount <= 0) return;

    const domainRoundRobin = domains.length > 0 ? domains : ['General'];
    let taken = 0;
    let safetyCounter = 0;

    while (taken < wantedCount && safetyCounter < wantedCount * (domainRoundRobin.length + 5) + 50) {
      const domain = domainRoundRobin[safetyCounter % domainRoundRobin.length];
      const candidate = bucket.find(
        (q) => !selectedIds.has(q.id) && getDomainKey(q) === domain
      );
      if (candidate) {
        selected.push(candidate);
        selectedIds.add(candidate.id);
        taken++;
      }
      safetyCounter++;
    }

    if (taken < wantedCount) {
      for (const q of bucket) {
        if (taken >= wantedCount) break;
        if (!selectedIds.has(q.id)) {
          selected.push(q);
          selectedIds.add(q.id);
          taken++;
        }
      }
    }
  };

  takeSpreadAcrossDomains('easy', targetCounts.easy);
  takeSpreadAcrossDomains('medium', targetCounts.medium);
  takeSpreadAcrossDomains('hard', targetCounts.hard);

  if (selected.length < count) {
    for (const q of availablePool) {
      if (selected.length >= count) break;
      if (!selectedIds.has(q.id)) {
        selected.push(q);
        selectedIds.add(q.id);
      }
    }
  }

  return shuffle(selected).slice(0, count);
};

// ============================================================================
// TẠO PHIÊN THI THÍCH ỨNG (MODULE 1 & MODULE 2)
// ============================================================================
export const generateAdaptiveSession = (section, questionPool) => {
  const config = SECTION_CONFIG[section] || SECTION_CONFIG['Reading & Writing'];
  const fullPool = safeArray(questionPool).filter((q) => q && q.section === section);
  const module1Questions = pickQuestionsByRatio(
    fullPool,
    config.module1Count,
    config.difficultyRatio,
    new Set()
  );
  const usedIds = new Set(module1Questions.map((q) => q.id));

  return {
    section,
    config,
    module1: {
      questions: module1Questions,
      answers: {},
      timeSpent: 0,
    },
    module2: {
      path: null,
      questions: [],
      answers: {},
      timeSpent: 0,
    },
    usedQuestionIds: usedIds,
    remainingPool: fullPool.filter((q) => !usedIds.has(q.id)),
    createdAt: new Date().toISOString(),
  };
};

/**
 * Hàm phân nhánh Module 2 (Ánh xạ đầy đủ cả resolveModule2Branch và routeNextModule)
 */
export const resolveModule2Branch = (sessionState, module1Answers = {}) => {
  if (!sessionState) return sessionState;

  const m1Questions = safeArray(sessionState.module1?.questions);
  const m1Total = m1Questions.length;
  let m1Correct = 0;

  m1Questions.forEach((q) => {
    if (isAnswerCorrect(q, module1Answers[q.id])) m1Correct += 1;
  });

  const m1Accuracy = m1Total > 0 ? m1Correct / m1Total : 0;
  const isHardBranch = m1Accuracy >= BRANCHING_THRESHOLD;
  const path = isHardBranch ? 'Hard' : 'Easy';

  const module2Ratio = isHardBranch
    ? { easy: 0.1, medium: 0.4, hard: 0.5 }
    : { easy: 0.45, medium: 0.45, hard: 0.1 };

  const module2Questions = pickQuestionsByRatio(
    sessionState.remainingPool,
    sessionState.config.module2Count,
    module2Ratio,
    new Set()
  );

  const newUsedIds = new Set([
    ...sessionState.usedQuestionIds,
    ...module2Questions.map((q) => q.id),
  ]);

  return {
    ...sessionState,
    module1: {
      ...sessionState.module1,
      answers: module1Answers,
    },
    module2: {
      ...sessionState.module2,
      path,
      questions: module2Questions,
    },
    usedQuestionIds: newUsedIds,
    remainingPool: sessionState.remainingPool.filter((q) => !newUsedIds.has(q.id)),
    m1Accuracy,
  };
};

// Export alias routeNextModule cho ExamWorkspacePage.jsx
export const routeNextModule = (module1Score, totalModule1 = 27) => {
  const accuracy = totalModule1 > 0 ? module1Score / totalModule1 : 0;
  return accuracy >= BRANCHING_THRESHOLD ? 'hard' : 'easy';
};

// ============================================================================
// CHẤM ĐIỂM (SCALED SCORE 200 - 800)
// ============================================================================
const computeDomainPerformance = (questions, answers) => {
  const performance = {};
  safeArray(questions).forEach((q) => {
    if (!q) return;
    const domainKey = getDomainKey(q);
    if (!performance[domainKey]) {
      performance[domainKey] = { correct: 0, total: 0, percentage: 0 };
    }
    performance[domainKey].total += 1;
    if (isAnswerCorrect(q, answers[q.id])) {
      performance[domainKey].correct += 1;
    }
  });

  Object.keys(performance).forEach((domainKey) => {
    const stat = performance[domainKey];
    stat.percentage = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
  });

  return performance;
};

const computeWeightedScore = (questions, answers) => {
  let earnedWeight = 0;
  let maxWeight = 0;

  safeArray(questions).forEach((q) => {
    if (!q) return;
    const weight = DIFFICULTY_WEIGHT[q.difficulty] ?? 1;
    maxWeight += weight;
    if (isAnswerCorrect(q, answers[q.id])) {
      earnedWeight += weight;
    }
  });

  return { earnedWeight, maxWeight };
};

export const calculateSatScaledScore = (sessionState, module2Answers = null) => {
  const safeSession = sessionState || {};
  const m1Questions = safeArray(safeSession.module1?.questions);
  const m1Answers = safeSession.module1?.answers || {};
  const m2Questions = safeArray(safeSession.module2?.questions);
  const m2Answers = module2Answers || safeSession.module2?.answers || {};
  const path = safeSession.module2?.path === 'Easy' ? 'Easy' : 'Hard';

  let m1Correct = 0;
  m1Questions.forEach((q) => {
    if (isAnswerCorrect(q, m1Answers[q.id])) m1Correct += 1;
  });
  const m1Total = m1Questions.length;
  const m1Accuracy = m1Total > 0 ? parseFloat((m1Correct / m1Total).toFixed(4)) : 0;

  let m2Correct = 0;
  m2Questions.forEach((q) => {
    if (isAnswerCorrect(q, m2Answers[q.id])) m2Correct += 1;
  });
  const m2Total = m2Questions.length;
  const m2Accuracy = m2Total > 0 ? parseFloat((m2Correct / m2Total).toFixed(4)) : 0;

  const allQuestions = [...m1Questions, ...m2Questions];
  const allAnswers = { ...m1Answers, ...m2Answers };
  const rawCorrect = m1Correct + m2Correct;
  const totalQuestions = m1Total + m2Total;

  const band = SCORE_BAND[path] || SCORE_BAND.Hard;
  const { earnedWeight, maxWeight } = computeWeightedScore(allQuestions, allAnswers);
  const weightedRatio = maxWeight > 0 ? earnedWeight / maxWeight : 0;
  const overallAccuracy = totalQuestions > 0 ? rawCorrect / totalQuestions : 0;
  const abilityEstimate = weightedRatio * 0.7 + overallAccuracy * 0.3;
  const rawScaled = band.min + abilityEstimate * (band.max - band.min);
  const scaledScore = roundToNearestTen(rawScaled, band.min, band.max);

  const domainPerformance = computeDomainPerformance(allQuestions, allAnswers);
  const timeSpentTotal =
    (safeSession.module1?.timeSpent || 0) + (safeSession.module2?.timeSpent || 0);

  return {
    scaledScore,
    rawCorrect,
    totalQuestions,
    module1Stats: {
      correct: m1Correct,
      total: m1Total,
      accuracy: m1Accuracy,
    },
    module2Stats: {
      correct: m2Correct,
      total: m2Total,
      accuracy: m2Accuracy,
      path,
    },
    domainPerformance,
    timeSpentTotal,
  };
};

export const createAdaptiveSession = (section = 'Math', pool = []) => {
  return generateAdaptiveSession(section, pool);
};

export const adaptiveEngine = {
  SECTION_CONFIG,
  BRANCHING_THRESHOLD,
  normalizeSprAnswer,
  normalizeGridInAnswer,
  generateAdaptiveSession,
  createAdaptiveSession,
  resolveModule2Branch,
  routeNextModule,
  calculateSatScaledScore,
  isAnswerCorrect,
};

export default adaptiveEngine;