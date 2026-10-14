/**
 * Thuật toán tính điểm chuẩn College Board Full Test (4 Modules):
 * - Mỗi Module có 2 câu Experimental (isExperimental = true): Bỏ qua hoàn toàn, Unscored (không trừ điểm).
 * - Sai 1 câu có tính điểm ở Module 1: Trừ 20 điểm.
 * - Sai 1 câu có tính điểm ở Module 2: Trừ 10 điểm.
 * - Base Score mỗi Section: 800 (tối đa), sàn tối thiểu: 200.
 * - Tổng điểm chuẩn: 400 - 1600.
 */

export function calculateModuleScore({
  m1Questions = [],
  m1Answers = {},
  m2Questions = [],
  m2Answers = {}
}) {
  let penaltyM1 = 0;
  let penaltyM2 = 0;
  let correctCount = 0;
  let totalScored = 0;
  let unScoredCount = 0;

  // 1. Chấm điểm Module 1 (-20đ / câu sai)
  m1Questions.forEach((q) => {
    if (q.isExperimental) {
      unScoredCount++;
      return; // Bỏ qua câu thử nghiệm
    }
    totalScored++;
    const userAns = String(m1Answers[q.id] || '').trim().toUpperCase();
    const correctAns = String(q.correctAnswer || '').trim().toUpperCase();

    if (userAns && userAns === correctAns) {
      correctCount++;
    } else {
      penaltyM1 += 20;
    }
  });

  // 2. Chấm điểm Module 2 (-10đ / câu sai)
  m2Questions.forEach((q) => {
    if (q.isExperimental) {
      unScoredCount++;
      return; // Bỏ qua câu thử nghiệm
    }
    totalScored++;
    const userAns = String(m2Answers[q.id] || '').trim().toUpperCase();
    const correctAns = String(q.correctAnswer || '').trim().toUpperCase();

    if (userAns && userAns === correctAns) {
      correctCount++;
    } else {
      penaltyM2 += 10;
    }
  });

  const rawScore = 800 - penaltyM1 - penaltyM2;
  const scaledScore = Math.max(200, Math.min(800, rawScore));

  return {
    sectionScore: Math.round(scaledScore / 10) * 10,
    correctCount,
    totalScored,
    unScoredCount,
    penaltyM1,
    penaltyM2
  };
}

export function calculateSatSectionScore(params) {
  // Hàm fallback tương thích với các bài thi module đơn cũ
  const totalCorrect = params?.totalCorrect || 0;
  const totalQ = params?.totalQuestions || 27;
  const approx = Math.round(200 + (totalCorrect / totalQ) * 600);
  return Math.max(200, Math.min(800, Math.round(approx / 10) * 10));
}