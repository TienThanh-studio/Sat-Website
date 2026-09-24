import initialQuestions from '../data/mockQuestions.json';
import { storageService } from './storageService';

/**
 * questionService.js
 * Quản lý kho câu hỏi, thuật toán sinh đề ma trận ngẫu nhiên, lưu lịch sử trả lời.
 */
export const questionService = {
  getAllQuestions() {
    const custom = storageService.get(storageService.KEYS.CUSTOM_QUESTIONS, []);
    return [...initialQuestions, ...custom];
  },

  addQuestion(questionData) {
    const custom = storageService.get(storageService.KEYS.CUSTOM_QUESTIONS, []);
    const newQ = {
      ...questionData,
      id: 'q_custom_' + Date.now()
    };
    custom.push(newQ);
    storageService.set(storageService.KEYS.CUSTOM_QUESTIONS, custom);
    return newQ;
  },

  deleteQuestion(id) {
    const custom = storageService.get(storageService.KEYS.CUSTOM_QUESTIONS, []);
    const updated = custom.filter(q => q.id !== id);
    storageService.set(storageService.KEYS.CUSTOM_QUESTIONS, updated);
  },

  // Thuật toán sinh đề ngẫu nhiên theo ma trận
  generateMatrixExam({ topic, topics = [], difficulty, count = 10 }) {
    let pool = this.getAllQuestions();

    // Lọc theo chủ đề
    if (topics && topics.length > 0) {
      pool = pool.filter(q => topics.includes(q.topic));
    } else if (topic && topic !== 'All') {
      pool = pool.filter(q => q.topic.toLowerCase() === topic.toLowerCase());
    }

    // Lọc theo độ khó
    if (difficulty && difficulty !== 'All') {
      pool = pool.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    // Xáo trộn ngẫu nhiên (Fisher-Yates Shuffle)
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  },

  // Thống kê tiến độ theo Topic
  getTopicStats() {
    const all = this.getAllQuestions();
    const statsMap = {};

    all.forEach(q => {
      if (!statsMap[q.topic]) {
        statsMap[q.topic] = { total: 0, correct: 0 };
      }
      statsMap[q.topic].total += 1;
    });

    // Lấy thông tin người dùng đã làm đúng từ storage
    const userAnswers = storageService.get('exam_user_answers_history', {});
    Object.keys(userAnswers).forEach(qId => {
      const targetQ = all.find(q => q.id === qId);
      if (targetQ && userAnswers[qId] === targetQ.correctAnswer) {
        if (statsMap[targetQ.topic]) {
          statsMap[targetQ.topic].correct += 1;
        }
      }
    });

    return statsMap;
  }
};