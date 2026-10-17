// src/services/storageService.js
import { authService } from './authService';

const KEYS = {
  EXAM_HISTORY: 'sat_exam_history_v2',
  MISTAKES: 'sat_mistakes',
  VOCAB_PROGRESS: 'sat_vocab_progress',
};

const safeRead = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const storageService = {
  /**
   * Lưu kết quả bài thi kèm toàn bộ chi tiết câu hỏi & đáp án để người dùng Xem lại (Review) bất cứ lúc nào
   */
  saveExamResult(reportData) {
    if (!reportData) return null;

    const currentUser = authService.getCurrentUser();
    const history = safeRead(KEYS.EXAM_HISTORY, []);

    const totalQ = Number(reportData.totalQuestions) || (reportData.questions ? reportData.questions.length : 0);
    const correctQ = Number(reportData.correctCount) || 0;
    const accuracy = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

    // Đảm bảo điểm số chuẩn xác: 0 câu đúng = 200 điểm
    let safeScore = Number(reportData.scaledScore) || 200;
    if (correctQ === 0) {
      safeScore = 200;
    } else {
      safeScore = Math.max(200, Math.min(800, Math.round(safeScore / 10) * 10));
    }

    const record = {
      id: reportData.id || `exam_${Date.now()}`,
      userId: currentUser?.id || 'guest',
      title: reportData.section || reportData.title || 'Digital SAT Practice',
      section: reportData.section || 'Reading & Writing',
      scaledScore: safeScore,
      correctCount: correctQ,
      totalQuestions: totalQ,
      accuracy,
      timeSpent: Number(reportData.timeSpent) || 0,
      module2Path: correctQ / Math.max(1, totalQ) >= 0.6 ? 'Hard' : 'Easy',
      domainPerformance: reportData.domainPerformance || {},
      skillPerformance: reportData.skillPerformance || {},
      questionTimes: reportData.questionTimes || {},
      questions: Array.isArray(reportData.questions) ? reportData.questions : [],
      completedAt: new Date().toISOString(),
    };

    const updatedHistory = [record, ...(Array.isArray(history) ? history : [])].slice(0, 50);
    safeWrite(KEYS.EXAM_HISTORY, updatedHistory);

    if (Array.isArray(reportData.questions)) {
      this.saveMistakesFromQuestions(reportData.questions, record.section);
    }

    return record;
  },

  /**
   * Lấy danh sách lịch sử thi
   */
  getExamHistory() {
    const list = safeRead(KEYS.EXAM_HISTORY, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Xóa 1 bài làm khỏi lịch sử
   */
  deleteExamResult(examId) {
    const list = this.getExamHistory().filter((item) => item.id !== examId);
    safeWrite(KEYS.EXAM_HISTORY, list);
    return list;
  },

  /**
   * Xóa toàn bộ lịch sử làm bài
   */
  clearAllExamHistory() {
    safeWrite(KEYS.EXAM_HISTORY, []);
    return [];
  },

  /**
   * Thống kê tổng hợp cho Dashboard & MissionLog
   */
  getDashboardStats() {
    const history = this.getExamHistory();
    if (history.length === 0) {
      return {
        totalTests: 0,
        highestScore: 0,
        averageScore: 0,
        latestScore: 0,
        totalQuestionsSolved: 0,
        overallAccuracy: 0,
        recentHistory: [],
      };
    }

    const scores = history.map((h) => Number(h.scaledScore) || 200);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const averageScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length / 10) * 10 : 0;
    const latestScore = scores[0] || 0;

    const totalQuestionsSolved = history.reduce((sum, h) => sum + (Number(h.totalQuestions) || 0), 0);
    const totalCorrect = history.reduce((sum, h) => sum + (Number(h.correctCount) || 0), 0);
    const overallAccuracy =
      totalQuestionsSolved > 0 ? Math.round((totalCorrect / totalQuestionsSolved) * 100) : 0;

    return {
      totalTests: history.length,
      highestScore,
      averageScore,
      latestScore,
      totalQuestionsSolved,
      overallAccuracy,
      recentHistory: history,
    };
  },

  saveMistakesFromQuestions(questions = [], sectionName = '') {
    const mistakes = questions.filter((q) => q && q.isCorrect === false);
    if (mistakes.length === 0) return 0;

    const existing = safeRead(KEYS.MISTAKES, []);
    const existingArr = Array.isArray(existing) ? existing : [];
    const existingIds = new Set(existingArr.map((item) => item.id));

    const newEntries = mistakes
      .filter((q) => q.id && !existingIds.has(q.id))
      .map((q) => ({
        id: q.id,
        prompt: q.prompt || q.passage || q.content || '',
        question: q.question || '',
        options: q.options || {},
        userAnswer: q.userAnswer,
        correctAnswer: q.correctAnswer,
        domain: q.domain || sectionName || 'Reading & Writing',
        skill: q.skill || q.category || 'Inference',
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || '',
        section: sectionName,
        savedAt: new Date().toISOString(),
      }));

    if (newEntries.length > 0) {
      safeWrite(KEYS.MISTAKES, [...newEntries, ...existingArr].slice(0, 300));
    }
    return newEntries.length;
  },

  getMistakes() {
    const list = safeRead(KEYS.MISTAKES, []);
    return Array.isArray(list) ? list : [];
  },

  removeMistake(questionId) {
    const list = this.getMistakes().filter((item) => item.id !== questionId);
    safeWrite(KEYS.MISTAKES, list);
    return list;
  },

  getVocabProgress() {
    return safeRead(KEYS.VOCAB_PROGRESS, {});
  },

  saveVocabWordStatus(wordId, statusData) {
    const current = this.getVocabProgress();
    const updated = {
      ...current,
      [wordId]: {
        ...current[wordId],
        ...statusData,
        updatedAt: new Date().toISOString(),
      },
    };
    safeWrite(KEYS.VOCAB_PROGRESS, updated);
    return updated;
  },
};

export default storageService;