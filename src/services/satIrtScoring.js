/**
 * Mô phỏng chấm điểm Digital SAT thích ứng (2-Stage Adaptive)
 * Dựa trên Item Response Theory (Mô hình 3PL - Three-Parameter Logistic)
 */

const IRT_PARAMS = {
  easy:   { a: 0.75, b: -1.10, c: 0.22 },
  medium: { a: 1.05, b:  0.00, c: 0.20 },
  hard:   { a: 1.35, b:  1.30, c: 0.18 },
};

const BRANCH_CONFIG = {
  hard: { minScaled: 200, maxScaled: 800, thetaShift: 0 },
  easy: { minScaled: 200, maxScaled: 650, thetaShift: -0.15 },
};

const SCALE_MEAN = 500;
const SCALE_SD = 100;
const THETA_MIN = -4;
const THETA_MAX = 4;

function probCorrect3PL(theta, { a, b, c }) {
  const z = -a * (theta - b);
  return c + (1 - c) / (1 + Math.exp(z));
}

export function estimateTheta(responses, options = {}) {
  const { maxIterations = 50, tolerance = 1e-4 } = options;

  if (!Array.isArray(responses) || responses.length === 0) {
    return 0;
  }

  let theta = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    let scoreSum = 0;
    let infoSum = 0;

    for (const r of responses) {
      const diffKey = (r.difficulty || 'medium').toLowerCase();
      const params = IRT_PARAMS[diffKey] || IRT_PARAMS.medium;
      const { a, c } = params;
      const p = probCorrect3PL(theta, params);
      const u = r.correct ? 1 : 0;

      const w = (a * (p - c)) / (p * (1 - c));
      scoreSum += w * (u - p);

      const info = a * a * Math.pow((p - c) / (1 - c), 2) * ((1 - p) / p);
      infoSum += info;
    }

    if (infoSum === 0) break;

    const delta = scoreSum / infoSum;
    theta += delta;

    if (Math.abs(delta) < tolerance) break;
  }

  return Math.min(THETA_MAX, Math.max(THETA_MIN, theta));
}

export function thetaToScaledScore(theta, branch = 'hard') {
  const branchConfig = BRANCH_CONFIG[branch] || BRANCH_CONFIG.hard;
  const adjustedTheta = theta + branchConfig.thetaShift;

  const raw = SCALE_MEAN + adjustedTheta * SCALE_SD;
  const clamped = Math.min(branchConfig.maxScaled, Math.max(branchConfig.minScaled, raw));

  return Math.round(clamped / 10) * 10;
}

export function determineModule2Branch(module1Responses, routingThreshold = 0) {
  const theta1 = estimateTheta(module1Responses);
  const branch = theta1 >= routingThreshold ? 'hard' : 'easy';
  return { branch, theta1 };
}

export function calculateSatSectionScore({
  module1Responses = [],
  module2Responses = [],
  routingThreshold = 0,
  forcedBranch,
}) {
  const { branch: autoBranch, theta1 } = determineModule2Branch(module1Responses, routingThreshold);
  const branch = forcedBranch || autoBranch;

  const allResponses = [...module1Responses, ...module2Responses];
  const thetaFinal = estimateTheta(allResponses.length > 0 ? allResponses : module1Responses);

  const scaledScore = thetaToScaledScore(thetaFinal, branch);

  const byDifficulty = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
  for (const r of allResponses) {
    const diffKey = (r.difficulty || 'medium').toLowerCase();
    const key = byDifficulty[diffKey] ? diffKey : 'medium';
    byDifficulty[key].total += 1;
    if (r.correct) byDifficulty[key].correct += 1;
  }

  return {
    branch,
    theta1: Number(theta1.toFixed(3)),
    thetaFinal: Number(thetaFinal.toFixed(3)),
    scaledScore,
    breakdown: {
      module1Correct: module1Responses.filter(r => r.correct).length,
      module1Total: module1Responses.length,
      module2Correct: module2Responses.filter(r => r.correct).length,
      module2Total: module2Responses.length,
      byDifficulty,
    },
  };
}

export function calculateFullSatScore({ readingWriting, math }) {
  const rw = calculateSatSectionScore(readingWriting);
  const m = calculateSatSectionScore(math);

  return {
    readingWriting: rw,
    math: m,
    totalScore: rw.scaledScore + m.scaledScore,
  };
}