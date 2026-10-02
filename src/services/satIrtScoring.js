export function calculateSatScore({
  module1Responses = [],
  module2Responses = [],
  module1Questions = [],
  module1Answers = {},
  module2Questions = [],
  module2Answers = {},
  branch = 'easy',
  forcedBranch
}) {
  const chosenBranch = forcedBranch || branch || 'easy';

  let responses = [];

  if (Array.isArray(module1Responses) && module1Responses.length > 0) {
    responses = [...module1Responses, ...module2Responses];
  } else {
    const parseList = (qList, aMap) => {
      return (qList || []).map(q => {
        const uAns = aMap ? aMap[q.id] : q.userAnswer;
        const cAns = q.correctAnswer;
        let isCorrect = false;

        if (uAns !== undefined && uAns !== null && uAns !== '') {
          if (q.isGridIn || q.type === 'spr') {
            const acc = q.acceptedAnswers || [cAns];
            isCorrect = acc.some(a => String(a).trim().toLowerCase() === String(uAns).trim().toLowerCase());
          } else {
            isCorrect = String(uAns).trim().toUpperCase() === String(cAns).trim().toUpperCase();
          }
        }

        return {
          questionId: q.id,
          correct: isCorrect,
          difficulty: q.difficulty || 'medium'
        };
      });
    };

    responses = [
      ...parseList(module1Questions, module1Answers),
      ...parseList(module2Questions, module2Answers)
    ];
  }

  const totalQuestions = responses.length || 54;
  const correctCount = responses.filter(r => r.correct).length;

  let earnedWeight = 0;
  let maxWeight = 0;

  responses.forEach(r => {
    const diff = (r.difficulty || 'medium').toLowerCase();
    const weight = diff === 'hard' ? 2.2 : diff === 'medium' ? 1.5 : 1.0;
    maxWeight += weight;
    if (r.correct) {
      earnedWeight += weight;
    }
  });

  const accuracyRatio = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  const weightRatio = maxWeight > 0 ? earnedWeight / maxWeight : accuracyRatio;
  const abilityEstimate = weightRatio * 0.7 + accuracyRatio * 0.3;

  let scaledScore = 400;
  if (chosenBranch === 'hard') {
    scaledScore = 480 + abilityEstimate * (800 - 480);
  } else {
    scaledScore = 200 + abilityEstimate * (620 - 200);
  }

  scaledScore = Math.round(scaledScore / 10) * 10;
  scaledScore = Math.max(200, Math.min(800, scaledScore));

  return {
    scaledScore,
    score: scaledScore,
    totalQuestions,
    correctCount,
    branch: chosenBranch,
    accuracy: Math.round(accuracyRatio * 100)
  };
}

export const calculateSatSectionScore = (params) => {
  const res = calculateSatScore(params);
  return typeof res === 'object' ? res.scaledScore : res;
};

export default {
  calculateSatScore,
  calculateSatSectionScore
};