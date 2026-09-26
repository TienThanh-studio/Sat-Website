import { questionService } from './questionService';

// Ngưỡng bẻ nhánh Digital SAT chuẩn (Đúng >= 65% ở Module 1 sẽ vào Module 2 Hard)
const ADAPTIVE_THRESHOLD = 0.65;

export const adaptiveEngine = {
  // Tạo bộ đề mô phỏng Adaptive Test gồm 2 Module
  createAdaptiveSession: (section = 'Math') => {
    const allCategories = questionService.getCategories();
    const sectionCats = allCategories.filter(c => 
      section === 'Math' ? c.section === 'Math' : c.section === 'Reading & Writing'
    );

    const pool = sectionCats.flatMap(c => c.questions || []);
    if (pool.length === 0) return null;

    // Trộn ngẫu nhiên câu hỏi
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    
    // Module 1: 15 câu chuẩn (Standard Pool)
    const module1Questions = shuffled.slice(0, Math.min(15, shuffled.length)).map(q => ({
      ...q,
      module: 1,
      difficulty: 'Standard'
    }));

    // Pool câu hỏi còn lại chuẩn bị cho Module 2
    const remainingPool = shuffled.slice(module1Questions.length);

    return {
      testId: `adaptive_${section.toLowerCase()}_${Date.now()}`,
      section: section,
      currentModule: 1,
      module1Questions,
      remainingPool,
      module1Answers: {},
      module2Questions: [],
      module2Answers: {},
      isHardBranch: false
    };
  },

  // Đánh giá kết quả Module 1 để tạo Module 2 thích ứng (Easy hoặc Hard)
  branchToModule2: (sessionState, module1Answers) => {
    const { module1Questions, remainingPool } = sessionState;
    let correctCount = 0;

    module1Questions.forEach(q => {
      if (module1Answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const accuracy = module1Questions.length > 0 ? (correctCount / module1Questions.length) : 0;
    const isHardBranch = accuracy >= ADAPTIVE_THRESHOLD;

    // Chọn 15 câu cho Module 2
    const module2Questions = remainingPool.slice(0, 15).map(q => ({
      ...q,
      module: 2,
      difficulty: isHardBranch ? 'Hard' : 'Easy'
    }));

    return {
      ...sessionState,
      currentModule: 2,
      module1Answers,
      isHardBranch,
      module2Questions,
      m1Score: {
        correct: correctCount,
        total: module1Questions.length,
        accuracy: Math.round(accuracy * 100)
      }
    };
  },

  // Tính điểm SAT chuẩn 200 - 800 dựa trên mô hình phân nhánh
  calculateFinalSATScore: (sessionState, module2Answers) => {
    const { module1Questions, module2Questions, module1Answers, isHardBranch } = sessionState;

    let m1Correct = 0;
    module1Questions.forEach(q => {
      if (module1Answers[q.id] === q.correctAnswer) m1Correct++;
    });

    let m2Correct = 0;
    module2Questions.forEach(q => {
      if (module2Answers[q.id] === q.correctAnswer) m2Correct++;
    });

    const totalCorrect = m1Correct + m2Correct;
    const totalQuestions = module1Questions.length + module2Questions.length;

    // Thang điểm Digital SAT ước tính:
    // Nhánh Hard: Max 800, Min ~ 480
    // Nhánh Easy: Max ~ 600, Min 200
    let estimatedScore = 200;
    if (isHardBranch) {
      estimatedScore = Math.round(480 + (m2Correct / (module2Questions.length || 1)) * 320);
    } else {
      estimatedScore = Math.round(200 + (totalCorrect / (totalQuestions || 1)) * 400);
    }

    return {
      estimatedScore: Math.min(800, Math.max(200, estimatedScore)),
      isHardBranch,
      m1Correct,
      m2Correct,
      totalCorrect,
      totalQuestions,
      accuracy: Math.round((totalCorrect / (totalQuestions || 1)) * 100)
    };
  }
};