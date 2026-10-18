// src/services/adaptiveEngine.js

/**
 * Chuẩn hóa đáp án để so sánh chính xác cả trắc nghiệm (A, B, C, D)
 * lẫn câu điền khuyết Toán (SPR / Grid-in: hỗ trợ phân số như 292/3, số thập phân, số âm)
 */
export function isAnswerCorrect(userAns, question) {
  // Hỗ trợ tự động đảo tham số nếu nơi gọi truyền (question, userAns)
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

  const cleanUser = String(actualUserAns).trim().toUpperCase().replace(/\s+/g, '');
  const cleanCorrect = String(actualQuestion.correctAnswer ?? '')
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
 * Suy luận tham số IRT 3PL (a: độ phân loại, b: độ khó, c: xác suất đoán mò) cho từng câu hỏi
 */
export function getQuestionIrtParams(question, index = 0, total = 27) {
  const diffRaw = String(question?.difficulty || '').toLowerCase();
  const posRatio = total > 1 ? index / (total - 1) : 0.5;

  // 1. Tham số độ khó b (-2.0 đến +2.0)
  let b = 0.0;
  if (typeof question?.irtB === 'number') {
    b = question.irtB;
  } else if (diffRaw === 'easy' || diffRaw === 'dễ') {
    b = -1.15 + posRatio * 0.35;
  } else if (diffRaw === 'hard' || diffRaw === 'khó') {
    b = 0.95 + posRatio * 0.75;
  } else {
    // Medium hoặc tự động phân tầng theo thứ tự câu trong đề
    b = -0.6 + posRatio * 1.4;
  }

  // 2. Tham số độ phân biệt a (0.8 đến 1.8)
  const a =
    typeof question?.irtA === 'number'
      ? question.irtA
      : diffRaw === 'hard'
      ? 1.45
      : diffRaw === 'easy'
      ? 1.15
      : 1.3;

  // 3. Tham số đoán mò c (Grid-in không thể đoán mò nên c = 0; Trắc nghiệm 4 đáp án c = 0.22)
  const isGridIn = Boolean(
    question?.isGridIn ||
      !question?.options ||
      Object.keys(question?.options || {}).length === 0
  );
  const c = isGridIn ? 0.0 : 0.22;

  return { a, b, c, isGridIn };
}

/**
 * Hàm xác suất trả lời đúng theo mô hình 3PL IRT
 */
function prob3PL(theta, a, b, c) {
  const z = a * (theta - b);
  const logistic = 1 / (1 + Math.exp(-z));
  return c + (1 - c) * logistic;
}

/**
 * Ước lượng năng lực thí sinh Theta (-3.5 đến +3.5) bằng phương pháp Bayesian EAP / MLE
 */
export function estimateTheta3PL(evaluatedItems) {
  if (!Array.isArray(evaluatedItems) || evaluatedItems.length === 0) {
    return { theta: 0, se: 1.0, carelessMistakes: 0, hardSolved: 0 };
  }

  // Quét lưới mịn từ -3.5 đến +3.5 (701 điểm) kết hợp Prior phân phối chuẩn nhẹ N(0, 2.2)
  let bestTheta = 0;
  let maxLogLikelihood = -Infinity;

  for (let step = -350; step <= 350; step++) {
    const theta = step / 100;
    // Prior nhẹ để tránh theta vọt ra vô cùng khi đúng 100% hoặc sai 100%
    let logL = -(theta * theta) / (2 * 2.5 * 2.5);

    for (let i = 0; i < evaluatedItems.length; i++) {
      const item = evaluatedItems[i];
      const p = Math.min(0.9999, Math.max(0.0001, prob3PL(theta, item.a, item.b, item.c)));
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

  // Tính Sai số chuẩn (Standard Error of Estimation - SE) từ hàm thông tin Fisher I(theta)
  let fisherInfo = 1 / (2.5 * 2.5);
  let carelessMistakes = 0;
  let hardSolved = 0;

  evaluatedItems.forEach((item) => {
    const p = prob3PL(bestTheta, item.a, item.b, item.c);
    const q = 1 - p;
    const num = Math.pow(item.a, 2) * Math.pow(p - item.c, 2) * q;
    const den = Math.pow(1 - item.c, 2) * Math.max(0.0001, p);
    fisherInfo += num / den;

    if (!item.isCorrect && item.b < -0.35) {
      carelessMistakes += 1; // Sai câu dễ (bị phạt nặng hơn trong IRT)
    }
    if (item.isCorrect && item.b >= 0.75) {
      hardSolved += 1;
    }
  });

  const se = Number((1 / Math.sqrt(Math.max(0.1, fisherInfo))).toFixed(2));

  return {
    theta: Number(bestTheta.toFixed(2)),
    se,
    carelessMistakes,
    hardSolved,
  };
}

/**
 * Tính điểm Scaled Score chuẩn College Board (200 - 800) dựa trên mô hình IRT 3PL
 */
export function calculateSatScaledScore(sessionState) {
  const m1Questions = sessionState?.module1?.questions || [];
  const m1Answers = sessionState?.module1?.answers || {};
  const m2Questions = sessionState?.module2?.questions || [];
  const m2Answers = sessionState?.module2?.answers || {};

  const allEvaluated = [];

  m1Questions.forEach((q, idx) => {
    const { a, b, c, isGridIn } = getQuestionIrtParams(q, idx, m1Questions.length);
    const correct =
      typeof q.isCorrect === 'boolean'
        ? q.isCorrect
        : isAnswerCorrect(m1Answers[idx] ?? m1Answers[q.id], q);
    allEvaluated.push({ a, b, c, isGridIn, isCorrect: correct, module: 1 });
  });

  m2Questions.forEach((q, idx) => {
    const { a, b, c, isGridIn } = getQuestionIrtParams(q, idx, m2Questions.length);
    // Nếu ở nhánh Hard, độ khó b cộng thêm 0.45
    const pathBonus = sessionState?.module2?.path === 'Easy' ? -0.45 : 0.45;
    const correct =
      typeof q.isCorrect === 'boolean'
        ? q.isCorrect
        : isAnswerCorrect(m2Answers[idx] ?? m2Answers[q.id], q);
    allEvaluated.push({
      a,
      b: b + pathBonus,
      c,
      isGridIn,
      isCorrect: correct,
      module: 2,
    });
  });

  const totalCount = Math.max(1, allEvaluated.length);
  const correctCount = allEvaluated.filter((x) => x.isCorrect).length;
  const rawAccuracy = correctCount / totalCount;

  const { theta, se, carelessMistakes, hardSolved } = estimateTheta3PL(allEvaluated);

  // Quy đổi kết hợp giữa Theta IRT và tỷ lệ đúng thực tế + phạt sảy chân câu dễ
  const normalizedTheta = (theta + 3.2) / 6.4; // 0.0 -> 1.0
  const blendedRatio = rawAccuracy * 0.68 + Math.min(1, Math.max(0, normalizedTheta)) * 0.32;

  // Phạt IRT khi sai câu dễ (mỗi câu dễ sai bị trừ nặng hơn câu khó khoảng 10-15 điểm)
  const carelessPenalty = carelessMistakes * 8;

  let rawScaled = 200 + blendedRatio * 600 - carelessPenalty + hardSolved * 4;

  // Nếu làm đúng tuyệt đối 100% thì đạt 800 tròn; nếu trống toàn bộ thì 200
  if (correctCount === totalCount && totalCount > 0) {
    rawScaled = 800;
  } else if (correctCount === 0) {
    rawScaled = 200;
  } else {
    // Nếu rơi vào nhánh Module 2 Easy thì chặn trần ở 620 chuẩn quy chế
    if (sessionState?.module2?.path === 'Easy' && m2Questions.length > 0) {
      rawScaled = Math.min(620, rawScaled);
    }
    rawScaled = Math.min(790, Math.max(200, rawScaled));
  }

  const scaledScore = Math.round(rawScaled / 10) * 10;

  // Tính phân vị Percentile toàn cầu
  let percentile = 50;
  if (scaledScore >= 770) percentile = 99;
  else if (scaledScore >= 730) percentile = 96;
  else if (scaledScore >= 680) percentile = 90;
  else if (scaledScore >= 620) percentile = 78;
  else if (scaledScore >= 550) percentile = 60;

  return {
    scaledScore,
    rawCorrect: correctCount,
    totalQuestions: totalCount,
    accuracy: Math.round(rawAccuracy * 100),
    irtMetrics: {
      theta,
      se,
      carelessMistakes,
      hardSolved,
      percentile,
      confidenceBand: `${Math.max(200, scaledScore - 20)} – ${Math.min(800, scaledScore + 20)}`,
    },
  };
}