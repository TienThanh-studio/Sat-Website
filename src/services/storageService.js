// src/services/storageService.js
import { supabase } from '../lib/supabaseClient';

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
  // 1. QUẢN LÝ CÂU HỎI ĐÃ LÀM / CHƯA LÀM
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
    const remaining = this.getCompletedQuestionIds().filter(
      (id) => !removeSet.has(String(id))
    );
    safeWrite(KEYS.COMPLETED_QUESTIONS, remaining);
  },

  // =========================================================================
  // 2. LỊCH SỬ THI & BÁO CÁO ĐIỂM
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

    if (Array.isArray(report.questions)) {
      const answeredIds = report.questions
        .filter(
          (q) =>
            q &&
            q.userAnswer !== undefined &&
            String(q.userAnswer).trim() !== ''
        )
        .map((q) => q.id);
      this.markQuestionsCompleted(answeredIds);

      const wrongQuestions = report.questions.filter(
        (q) => q && !q.isCorrect && q.userAnswer
      );
      wrongQuestions.forEach((wq) => this.addMistake(wq));
    }
    return entry;
  },

  // =========================================================================
  // 3. SỔ TAY CÂU SAI
  // =========================================================================
  getMistakes() {
    return safeRead(KEYS.MISTAKE_LOG, []);
  },

  addMistake(questionObj) {
    if (!questionObj || !questionObj.id) return;
    const current = this.getMistakes();
    const filtered = current.filter(
      (item) => String(item.id) !== String(questionObj.id)
    );
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
  // 4. ĐÁNH DẤU CÂU HỎI & TIẾN ĐỘ TỪ VỰNG SRS
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
      studentName: 'Phan Tiến Thành',
      targetScore: 1550,
      soundEnabled: true,
      timerVisible: true,
    });
  },

  saveUserSettings(settings) {
    safeWrite(KEYS.USER_SETTINGS, {
      ...this.getUserSettings(),
      ...(settings || {}),
    });
  },

  // =========================================================================
  // 6. SAO LƯU / KHÔI PHỤC FILE JSON & ĐỒNG BỘ CLOUD (MỤC 5)
  // =========================================================================
  exportAllDataPayload() {
    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      completedQuestions: this.getCompletedQuestionIds(),
      vocabProgress: this.getVocabProgress(),
      examHistory: this.getExamHistory(),
      mistakes: this.getMistakes(),
      bookmarks: this.getBookmarks(),
      userSettings: this.getUserSettings(),
    };
  },

  downloadBackupJson() {
    const data = this.exportAllDataPayload();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `sat_progress_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importDataPayload(payload, mergeMode = true) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('File sao lưu không hợp lệ!');
    }

    if (Array.isArray(payload.completedQuestions)) {
      if (mergeMode) {
        this.markQuestionsCompleted(payload.completedQuestions);
      } else {
        safeWrite(KEYS.COMPLETED_QUESTIONS, payload.completedQuestions);
      }
    }

    if (payload.vocabProgress && typeof payload.vocabProgress === 'object') {
      const currentVocab = mergeMode ? this.getVocabProgress() : {};
      safeWrite(KEYS.VOCAB_PROGRESS, {
        ...currentVocab,
        ...payload.vocabProgress,
      });
    }

    if (Array.isArray(payload.examHistory)) {
      const currentHist = mergeMode ? this.getExamHistory() : [];
      const seenIds = new Set(currentHist.map((h) => h.id));
      const mergedHist = [
        ...currentHist,
        ...payload.examHistory.filter((h) => h && !seenIds.has(h.id)),
      ];
      safeWrite(KEYS.EXAM_HISTORY, mergedHist.slice(0, 150));
    }

    if (Array.isArray(payload.mistakes)) {
      const currentMistakes = mergeMode ? this.getMistakes() : [];
      const seenM = new Set(currentMistakes.map((m) => m.id));
      const mergedM = [
        ...currentMistakes,
        ...payload.mistakes.filter((m) => m && !seenM.has(m.id)),
      ];
      safeWrite(KEYS.MISTAKE_LOG, mergedM.slice(0, 300));
    }

    if (payload.userSettings && typeof payload.userSettings === 'object') {
      this.saveUserSettings(payload.userSettings);
    }

    return true;
  },

  async syncToSupabaseCloud(syncKey) {
    const cleanKey = String(syncKey || '').trim();
    if (!cleanKey) throw new Error('Vui lòng nhập Mã đồng bộ cá nhân (Sync Key)!');
    if (!supabase) throw new Error('Chưa cấu hình kết nối Supabase!');

    const payload = this.exportAllDataPayload();
    const { error } = await supabase.from('user_backups').upsert(
      {
        sync_key: cleanKey,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'sync_key' }
    );

    if (error) throw error;
    return true;
  },

  async restoreFromSupabaseCloud(syncKey) {
    const cleanKey = String(syncKey || '').trim();
    if (!cleanKey) throw new Error('Vui lòng nhập Mã đồng bộ cá nhân (Sync Key)!');
    if (!supabase) throw new Error('Chưa cấu hình kết nối Supabase!');

    const { data, error } = await supabase
      .from('user_backups')
      .select('payload, updated_at')
      .eq('sync_key', cleanKey)
      .single();

    if (error || !data?.payload) {
      throw new Error('Không tìm thấy bản sao lưu nào với mã này trên Cloud!');
    }

    this.importDataPayload(data.payload, true);
    return data.updated_at;
  },
};

export default storageService;