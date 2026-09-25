import initialQuestions from '../data/mockQuestions.js';
import { storageService } from './storageService';

export const questionService = {
  // Lấy toàn bộ câu hỏi gồm dữ liệu gốc + câu hỏi Admin tự tạo thêm
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

  // Thuật toán lọc đề ma trận chuẩn xác
  generateMatrixExam({ topic, topics = [], difficulty, count = 10 }) {
    let pool = this.getAllQuestions();

    if (topics && topics.length > 0) {
      pool = pool.filter(q => topics.some(t => t.toLowerCase() === (q.topic || '').toLowerCase()));
    } else if (topic && topic !== 'All') {
      pool = pool.filter(q => (q.topic || '').toLowerCase() === topic.toLowerCase());
    }

    if (difficulty && difficulty !== 'All') {
      pool = pool.filter(q => (q.difficulty || '').toLowerCase() === difficulty.toLowerCase());
    }

    // Nếu không tìm thấy câu đúng yêu cầu, fallback lấy câu ngẫu nhiên trong pool
    if (pool.length === 0) {
      pool = this.getAllQuestions();
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  },

  // Tính số câu hỏi thật và số câu làm đúng thật từ localStorage
  getTopicStats() {
    const all = this.getAllQuestions();
    const statsMap = {};
    const correctHistory = storageService.get('exam_correct_questions_set', {});

    all.forEach(q => {
      const topicName = q.topic || 'General';
      if (!statsMap[topicName]) {
        statsMap[topicName] = { total: 0, correct: 0 };
      }
      statsMap[topicName].total += 1;
      
      // Nếu câu này người dùng đã từng làm đúng
      if (correctHistory[q.id] === true) {
        statsMap[topicName].correct += 1;
      }
    });

    return statsMap;
  },

  // Lưu một câu hỏi là đã làm đúng (gọi khi bấm Check hoặc nộp bài)
  recordCorrectAnswer(questionId) {
    const correctHistory = storageService.get('exam_correct_questions_set', {});
    correctHistory[questionId] = true;
    storageService.set('exam_correct_questions_set', correctHistory);
  }
};