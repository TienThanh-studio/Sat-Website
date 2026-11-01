// src/services/adaptiveEngine.js
/**
 * Digital SAT Adaptive 2PL / 3PL IRT Scoring Engine & Routing Logic
 * Tuân thủ chuẩn mực khảo thí College Board cho bài thi Digital SAT thích ứng 2 chặng:
 * - Reading & Writing: 27 câu/Module. Cắt ngưỡng M1: >= 15 câu đúng -> M2 Hard (trần 800); < 15 -> M2 Easy (trần 600 - 620).
 * - Math: 22 câu/Module. Cắt ngưỡng M1: >= 14 câu đúng -> M2 Hard; < 14 -> M2 Easy.
 */

// 1. Ngưỡng phân nhánh (Routing Cutoffs) chuẩn College Board
export const ROUTING_RULES = Object.freeze({
  'Reading & Writing': Object.freeze({
    totalQuestions: 27,
    threshold: 15, // >= 15 câu đúng -> Hard Module 2
    easyCap: 600, // Điểm tối đa khi rơi vào nhánh Easy
    hardFloor: 420, // Điểm cơ sở nhánh Hard
  }),
  Math: Object.freeze({
    totalQuestions: 22,
    threshold: 14, // >= 14 câu đúng -> Hard Module 2
    easyCap: 620,
    hardFloor: 440,
  }),
});

/**
 * Xác định phân nhánh Module 2 (Hard vs Easy) dựa trên số câu đúng ở Module 1
 */
export function routeNextModule({ section = 'Reading & Writing', m1CorrectCount = 0, m1TotalQuestions = null }) {
  const isMath = String(section).toLowerCase().includes('math');
  const rule = isMath ? ROUTING_RULES.Math : ROUTING_RULES['Reading & Writing'];
  const total = m1TotalQuestions || rule.totalQuestions;

  // Tính tỷ lệ đúng hoặc so sánh theo ngưỡng chuẩn
  const isHard =
    total === rule.totalQuestions
      ? m1CorrectCount >= rule.threshold
      : m1CorrectCount / Math.max(1, total) >= (rule.threshold / rule.totalQuestions);

  return {
    path: isHard ? 'Hard' : 'Easy',
    isHard,
    threshold: rule.threshold,
    correctCount: m1CorrectCount,
    totalQuestions: total,
    ceilingScore: isHard ? 800 : rule.easyCap,
  };
}

/**
 * Chuẩn hóa đáp án để so sánh chính xác cả trắc nghiệm (A, B, C, D)
 * lẫn câu điền khuyết Toán (SPR / Grid-in: hỗ trợ phân số như 292/3, số thập phân, số âm)
 */
export function isAnswerCorrect(userAns, question) {
  let actualUserAns = userAns;
  let actualQuestion = question;
  if (
    userAns &&
    typeof userAns === 'object' &&
    ('correctAnswer' in userAns || 'question' in userAns)
  ) {
    actualQuestion = userAns;
    actualUserAns = question;
  }

  if (
    !actualQuestion ||
    actualUserAns === undefined ||
    actualUserAns === null ||
    actualUserAns === ''
  ) {
    return false;
  }

  const cleanUser = String(actualUserAns)
    .normalize('NFC')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  const cleanCorrect = String(actualQuestion.correctAnswer ?? '')
    .normalize('NFC')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  if (!cleanUser || !cleanCorrect) return false;
  if (cleanUser === cleanCorrect) return true;

  // Xử lý tương đương toán học cho câu Grid-in (VD: "85/87" hoặc "0.78" vs ".78" hoặc "5/3")
  const parseMathValue = (str) => {
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 2) {
        const num = Number(parts[0]);
        const den = Number(parts[1]);
        if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
          return num / den;
        }
      }
    }
    const val = Number(str);
    return Number.isNaN(val) ? null : val;
  };

  const numUser = parseMathValue(cleanUser);
  const numCorrect = parseMathValue(cleanCorrect);

  if (numUser !== null && numCorrect !== null) {
    return Math.abs(numUser - numCorrect) < 1e-3;
  }

  return false;
}

/**
 * Tham số IRT 2PL rút gọn cho từng câu hỏi dựa theo độ khó:
 * - Easy:   b ≈ -1.2, a ≈ 1.2
 * - Medium: b ≈  0.0, a ≈ 1.3
 * - Hard:   b ≈ +1.5, a ≈ 1.45
 */
export function getQuestion2PLParams(question, index = 0, total = 27) {
  const diffRaw = String(question?.difficulty || '').toLowerCase();
  let b = 0.0;
  let a = 1.3;

  if (typeof question?.irtB === 'number') {
    b = question.irtB;
  } else if (diffRaw === 'easy' || diffRaw === 'dễ') {
    b = -1.2;
    a = 1.2;
  } else if (diffRaw === 'hard' || diffRaw === 'khó') {
    b = 1.5;
    a = 1.45;
  } else {
    // Medium
    b = 0.0;
    a = 1.3;
  }

  // Điều chỉnh nhẹ theo vị trí câu trong đề (câu cuối module thường thách thức hơn)
  if (total > 1) {
    const posOffset = ((index / (total - 1)) - 0.5) * 0.3;
    b += posOffset;
  }

  return { a, b, isGridIn: Boolean(question?.isGridIn) };
}

/**
 * Hàm xác suất trả lời đúng theo mô hình 2PL IRT:
 * P(theta) = 1 / (1 + exp(-a * (theta - b)))
 */
export function prob2PL(theta, a, b) {
  const z = a * (theta - b);
  return 1 / (1 + Math.exp(-z));
}

/**
 * Ước lượng năng lực thí sinh Theta (-3.5 đến +3.5) theo mô hình 2PL IRT
 * sử dụng phương pháp tối ưu hóa hàm Log-Likelihood với Gaussian Prior
 */
export function estimateTheta2PL(evaluatedItems = []) {
  if (!Array.isArray(evaluatedItems) || evaluatedItems.length === 0) {
    return { theta: 0.0, se: 0.8, carelessMistakes: 0, hardSolved: 0 };
  }

  let bestTheta = 0;
  let maxLogLikelihood = -Infinity;

  // Quét lưới từ -3.50 đến +3.50 với bước nhảy 0.01 (701 điểm)
  for (let step = -350; step <= 350; step++) {
    const theta = step / 100;
    // Gaussian Prior N(0, 2.5^2) để ổn định khi đúng hết hoặc sai hết
    let logL = -(theta * theta) / (2 * 2.5 * 2.5);

    for (let i = 0; i < evaluatedItems.length; i++) {
      const item = evaluatedItems[i];
      const p = Math.min(0.9999, Math.max(0.0001, prob2PL(theta, item.a, item.b)));
      if (item.isCorrect) {
        logL += Math.log(p);
      } else {
        logL += Math.log(1 - p);
      }
    }

    if (logL > maxLogLikelihood) {
      maxLogLikelihood = logL;
      bestTheta = theta;
    }
  }

  // Tính sai số chuẩn SE và thống kê bẫy
  let fisherInfo = 1 / (2.5 * 2.5);
  let carelessMistakes = 0;
  let hardSolved = 0;

  evaluatedItems.forEach((item) => {
    const p = prob2PL(bestTheta, item.a, item.b);
    const q = 1 - p;
    fisherInfo += Math.pow(item.a, 2) * p * q;

    if (!item.isCorrect && item.b <= -0.8) {
      carelessMistakes += 1; // Sai câu dễ (sảy chân)
    }
    if (item.isCorrect && item.b >= 1.0) {
      hardSolved += 1;
    }
  });

  const se = Number((1 / Math.sqrt(Math.max(0.08, fisherInfo))).toFixed(2));

  return {
    theta: Number(bestTheta.toFixed(2)),
    se,
    carelessMistakes,
    hardSolved,
  };
}

/**
 * Tính Scaled Score (200 - 800) thích ứng chuẩn College Board kết hợp phân nhánh Module 2
 */
export function calculateSatScaledScore(sessionState) {
  const isMath = String(sessionState?.section || '').toLowerCase().includes('math');
  const rule = isMath ? ROUTING_RULES.Math : ROUTING_RULES['Reading & Writing'];

  const m1Questions = sessionState?.module1?.questions || sessionState?.questions?.slice(0, rule.totalQuestions) || [];
  const m1Answers = sessionState?.module1?.answers || sessionState?.answers || {};
  const m2Questions = sessionState?.module2?.questions || sessionState?.questions?.slice(rule.totalQuestions) || [];
  const m2Answers = sessionState?.module2?.answers || sessionState?.answers || {};

  const allEvaluated = [];
  let m1Correct = 0;

  m1Questions.forEach((q, idx) => {
    const { a, b } = getQuestion2PLParams(q, idx, m1Questions.length);
    const isCorrect =
      typeof q.isCorrect === 'boolean'
        ? q.isCorrect
        : isAnswerCorrect(m1Answers[idx] ?? m1Answers[q.id], q);

    if (isCorrect) m1Correct += 1;
    allEvaluated.push({ a, b, isCorrect, module: 1 });
  });

  // Tự động suy ra routing path nếu chưa có
  const routing = routeNextModule({
    section: sessionState?.section,
    m1CorrectCount: m1Correct,
    m1TotalQuestions: m1Questions.length,
  });
  const module2Path = sessionState?.module2?.path || routing.path;

  m2Questions.forEach((q, idx) => {
    const { a, b } = getQuestion2PLParams(q, idx, m2Questions.length);
    // Nhánh Hard: độ khó tăng +0.45; Nhánh Easy: độ khó giảm -0.45
    const pathShift = module2Path === 'Easy' ? -0.45 : 0.45;
    const isCorrect =
      typeof q.isCorrect === 'boolean'
        ? q.isCorrect
        : isAnswerCorrect(m2Answers[idx] ?? m2Answers[q.id], q);

    allEvaluated.push({ a, b: b + pathShift, isCorrect, module: 2 });
  });

  const totalCount = Math.max(1, allEvaluated.length);
  const correctCount = allEvaluated.filter((x) => x.isCorrect).length;
  const rawRatio = correctCount / totalCount;

  const { theta, se, carelessMistakes, hardSolved } = estimateTheta2PL(allEvaluated);

  // Chuyển đổi Theta [-3.2, +3.2] thành Score 200 - 800
  const normalizedTheta = (theta + 3.2) / 6.4;
  const blendedRatio = rawRatio * 0.65 + Math.min(1, Math.max(0, normalizedTheta)) * 0.35;
  const carelessPenalty = carelessMistakes * 10;

  let rawScaled = 200 + blendedRatio * 600 - carelessPenalty + hardSolved * 5;

  if (correctCount === totalCount && totalCount > 0) {
    rawScaled = 800;
  } else if (correctCount === 0) {
    rawScaled = 200;
  } else {
    // Áp dụng trần điểm nếu ở nhánh Easy (trần tối đa 600 cho RW, 620 cho Math)
    if (module2Path === 'Easy' && m2Questions.length > 0) {
      rawScaled = Math.min(rule.easyCap, rawScaled);
    }
    rawScaled = Math.min(790, Math.max(200, rawScaled));
  }

  const scaledScore = Math.round(rawScaled / 10) * 10;

  return {
    scaledScore,
    rawCorrect: correctCount,
    totalQuestions: totalCount,
    module2Path,
    m1Correct,
    m1Total: m1Questions.length,
    accuracy: Math.round(rawRatio * 100),
    irtMetrics: {
      theta,
      se,
      carelessMistakes,
      hardSolved,
      confidenceBand: `${Math.max(200, scaledScore - 20)} – ${Math.min(800, scaledScore + 20)}`,
    },
  };
}

export default {
  ROUTING_RULES,
  routeNextModule,
  isAnswerCorrect,
  getQuestion2PLParams,
  prob2PL,
  estimateTheta2PL,
  calculateSatScaledScore,
};