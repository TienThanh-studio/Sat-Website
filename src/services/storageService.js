/**
 * storageService.js
 * Quản lý LocalStorage an toàn, hỗ trợ đồng bộ hóa trạng thái phiên làm bài thi.
 * Đảm bảo khi F5 hoặc tắt trình duyệt, tiến trình làm bài vẫn còn nguyên.
 */

const STORAGE_KEYS = {
  CURRENT_USER: 'exam_current_user',
  EXAM_SESSION: 'exam_active_session',
  USER_STATS: 'exam_user_stats',
  CUSTOM_QUESTIONS: 'exam_custom_questions',
  INVITE_CODES: 'exam_invite_codes',
  DOCUMENTS: 'exam_uploaded_docs'
};

export const storageService = {
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing ${key} from localStorage:`, e);
    }
  },

  // Quản lý phiên làm bài thi (Chống mất bài khi F5)
  saveExamSession(sessionData) {
    this.set(STORAGE_KEYS.EXAM_SESSION, {
      ...sessionData,
      lastUpdated: Date.now()
    });
  },

  getExamSession() {
    return this.get(STORAGE_KEYS.EXAM_SESSION, null);
  },

  clearExamSession() {
    this.remove(STORAGE_KEYS.EXAM_SESSION);
  },

  KEYS: STORAGE_KEYS
};