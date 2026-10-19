// src/services/storageService.js

const KEYS = {
  EXAM_HISTORY: 'sat_exam_history_v1',
  MISTAKE_LOG: 'sat_mistake_log_v1',
  COMPLETED_QUESTIONS: 'sat_completed_question_ids_v1',
  BOOKMARKED_QUESTIONS: 'sat_bookmarked_questions_v1',
  VOCAB_PROGRESS: 'sat_vocab_progress_v1',
  USER_SETTINGS: 'sat_user_settings_v1',
  FORUM_POSTS: 'sat_forum_posts_v1',
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
}

export const storageService = {
  // =========================================================================
  // 1. QUẢN LÝ CÂU HỎI ĐÃ LÀM / CHƯA LÀM (COMPLETED QUESTIONS TRACKER)
  // =========================================================================
  getCompletedQuestionIds() {
    const list = safeRead(KEYS.COMPLETED_QUESTIONS, []);
    return Array.isArray(list) ? list : [];
  },

  getCompletedSet() {
    return new Set(this.getCompletedQuestionIds());
  },

  isQuestionCompleted(questionId) {
    if (!questionId) return false;
    return this.getCompletedSet().has(String(questionId));
  },

  markQuestionsCompleted(questionIds = []) {
    if (!Array.isArray(questionIds) || questionIds.length === 0) return;
    const currentSet = this.getCompletedSet();
    questionIds.forEach((id) => {
      if (id) currentSet.add(String(id));
    });
    safeWrite(KEYS.COMPLETED_QUESTIONS, Array.from(currentSet));
  },

  markSingleQuestionCompleted(questionId) {
    if (!questionId) return;
    this.markQuestionsCompleted([String(questionId)]);
  },

  resetCompletedQuestions(questionIdsToRemove = null) {
    if (!questionIdsToRemove) {
      safeWrite(KEYS.COMPLETED_QUESTIONS, []);
      return;
    }
    const removeSet = new Set(questionIdsToRemove.map(String));
    const remaining = this.getCompletedQuestionIds().filter((id) => !removeSet.has(String(id)));
    safeWrite(KEYS.COMPLETED_QUESTIONS, remaining);
  },

  // =========================================================================
  // 2. LỊCH SỬ THI & BÁO CÁO ĐIỂM (EXAM HISTORY)
  // =========================================================================
  getExamHistory() {
    return safeRead(KEYS.EXAM_HISTORY, []);
  },

  saveExamResult(report) {
    if (!report) return;
    const history = this.getExamHistory();
    const entry = {
      id: report.id || `exam_${Date.now()}`,
      timestamp: report.timestamp || new Date().toISOString(),
      ...report,
    };
    safeWrite(KEYS.EXAM_HISTORY, [entry, ...history.slice(0, 99)]);

    // Tự động ghi nhận các câu hỏi đã trả lời vào danh sách "Đã làm"
    if (Array.isArray(report.questions)) {
      const answeredIds = report.questions
        .filter((q) => q && q.userAnswer !== undefined && String(q.userAnswer).trim() !== '')
        .map((q) => q.id);
      this.markQuestionsCompleted(answeredIds);

      // Tự động lưu các câu làm sai vào Sổ tay câu sai
      const wrongQuestions = report.questions.filter((q) => q && !q.isCorrect && q.userAnswer);
      wrongQuestions.forEach((wq) => this.addMistake(wq));
    }
    return entry;
  },

  // =========================================================================
  // 3. SỔ TAY CÂU SAI (MISTAKE LOG)
  // =========================================================================
  getMistakes() {
    return safeRead(KEYS.MISTAKE_LOG, []);
  },

  addMistake(questionObj) {
    if (!questionObj || !questionObj.id) return;
    const current = this.getMistakes();
    const filtered = current.filter((item) => String(item.id) !== String(questionObj.id));
    const updated = [
      {
        ...questionObj,
        savedAt: new Date().toISOString(),
      },
      ...filtered,
    ];
    safeWrite(KEYS.MISTAKE_LOG, updated.slice(0, 300));
  },

  removeMistake(questionId) {
    const current = this.getMistakes();
    safeWrite(
      KEYS.MISTAKE_LOG,
      current.filter((item) => String(item.id) !== String(questionId))
    );
  },

  clearMistakes() {
    safeWrite(KEYS.MISTAKE_LOG, []);
  },

  // =========================================================================
  // 4. ĐÁNH DẤU CÂU HỎI & TIẾN ĐỘ TỪ VỰNG
  // =========================================================================
  getBookmarks() {
    return safeRead(KEYS.BOOKMARKED_QUESTIONS, []);
  },

  toggleBookmark(questionObj) {
    if (!questionObj?.id) return [];
    const current = this.getBookmarks();
    const exists = current.some((q) => String(q.id) === String(questionObj.id));
    const next = exists
      ? current.filter((q) => String(q.id) !== String(questionObj.id))
      : [questionObj, ...current];
    safeWrite(KEYS.BOOKMARKED_QUESTIONS, next);
    return next;
  },

  getVocabProgress() {
    return safeRead(KEYS.VOCAB_PROGRESS, {});
  },

  saveVocabProgress(progress) {
    safeWrite(KEYS.VOCAB_PROGRESS, progress || {});
  },

  // =========================================================================
  // 5. DIỄN ĐÀN & CÀI ĐẶT NGƯỜI DÙNG
  // =========================================================================
  getForumPosts() {
    return safeRead(KEYS.FORUM_POSTS, []);
  },

  saveForumPosts(posts) {
    safeWrite(KEYS.FORUM_POSTS, Array.isArray(posts) ? posts : []);
  },

  getUserSettings() {
    return safeRead(KEYS.USER_SETTINGS, {
      targetScore: 1550,
      soundEnabled: true,
      timerVisible: true,
    });
  },

  saveUserSettings(settings) {
    safeWrite(KEYS.USER_SETTINGS, settings || {});
  },
};

export default storageService;