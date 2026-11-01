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

export const ERROR_TAGS = [
  {
    id: 'careless',
    label: 'Đọc ẩu / Thiếu NOT',
    shortLabel: 'Đọc ẩu/Miss NOT',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    lightBadgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  {
    id: 'vocab_trap',
    label: 'Bẫy từ vựng',
    shortLabel: 'Bẫy từ vựng',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    lightBadgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
  },
  {
    id: 'algebra_sign',
    label: 'Lỗi tính toán/Dấu',
    shortLabel: 'Sai đại số/dấu',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    lightBadgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
  },
  {
    id: 'time_pressure',
    label: 'Áp lực thời gian',
    shortLabel: 'Áp lực thời gian',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    lightBadgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
  },
  {
    id: 'concept_gap',
    label: 'Hổng kiến thức gốc',
    shortLabel: 'Hổng kiến thức',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    lightBadgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
  },
];

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

/**
 * Chuẩn hóa đối tượng MistakeRecord để tương thích ngược với cả cấu trúc phẳng lẫn cấu trúc nested `question: object`
 */
function normalizeMistakeRecord(rawItem) {
  if (!rawItem || typeof rawItem !== 'object') return null;

  const baseQuestion =
    rawItem.question && typeof rawItem.question === 'object'
      ? rawItem.question
      : rawItem;

  const id = String(rawItem.id || baseQuestion.id || `mistake_${Date.now()}`);
  const strikeCount =
    typeof rawItem.strikeCount === 'number'
      ? Math.max(0, rawItem.strikeCount)
      : 0;
  const mastered = Boolean(rawItem.mastered || strikeCount >= 2);
  const history = Array.isArray(rawItem.history) ? rawItem.history : [];

  return {
    ...baseQuestion,
    ...rawItem,
    id,
    question: {
      ...baseQuestion,
      id,
    },
    errorTag: rawItem.errorTag || baseQuestion.errorTag || null,
    strikeCount,
    lastCorrectDate: rawItem.lastCorrectDate || null,
    pendingNextDayStrike: Boolean(rawItem.pendingNextDayStrike),
    mastered,
    lastReviewedAt: rawItem.lastReviewedAt || rawItem.savedAt || new Date().toISOString(),
    savedAt: rawItem.savedAt || new Date().toISOString(),
    history,
  };
}

export const storageService = {
  ERROR_TAGS,

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
      completedAt: report.completedAt || new Date().toISOString(),
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

      const qTimes = report.questionTimes || {};
      report.questions.forEach((q, idx) => {
        if (!q || !q.id) return;
        const timeSpent = Number(qTimes[q.id] ?? qTimes[idx] ?? 0) || 0;
        const hasAnswered =
          q.userAnswer !== undefined && String(q.userAnswer).trim() !== '';

        if (!q.isCorrect && hasAnswered) {
          this.addMistake(q, q.errorTag || null, timeSpent);
        } else if (q.isCorrect && report.isMistakeDrill) {
          this.recordMistakeAttempt(q.id, true, timeSpent);
        }
      });
    }
    return entry;
  },

  // =========================================================================
  // 3. SỔ TAY CÂU SAI (2-STRIKE MASTERY DRILL & ERROR TAGGING)
  // =========================================================================
  getMistakes() {
    const rawList = safeRead(KEYS.MISTAKE_LOG, []);
    if (!Array.isArray(rawList)) return [];
    return rawList.map(normalizeMistakeRecord).filter(Boolean);
  },

  getUnmasteredMistakes() {
    return this.getMistakes().filter(
      (item) => !item.mastered && (item.strikeCount || 0) < 2
    );
  },

  addMistake(questionObj, errorTag = null, timeSpent = 0) {
    if (!questionObj || !questionObj.id) return this.getMistakes();
    const current = this.getMistakes();
    const qId = String(questionObj.id);
    const existing = current.find((item) => String(item.id) === qId);
    const nowIso = new Date().toISOString();

    const baseQuestion =
      questionObj.question && typeof questionObj.question === 'object'
        ? { ...questionObj.question, ...questionObj }
        : { ...questionObj };

    const newHistoryEntry = {
      date: nowIso,
      isCorrect: false,
      timeSpent: Number(timeSpent) || 0,
    };

    const updatedRecord = normalizeMistakeRecord({
      ...(existing || {}),
      ...baseQuestion,
      id: qId,
      question: baseQuestion,
      errorTag: errorTag || existing?.errorTag || baseQuestion.errorTag || null,
      strikeCount: 0, // Làm sai -> reset chuỗi đúng liên tiếp về 0
      lastCorrectDate: null,
      pendingNextDayStrike: false,
      mastered: false,
      lastReviewedAt: nowIso,
      savedAt: existing?.savedAt || nowIso,
      history: [...(existing?.history || []), newHistoryEntry].slice(-20),
    });

    const filtered = current.filter((item) => String(item.id) !== qId);
    const nextList = [updatedRecord, ...filtered].slice(0, 300);
    safeWrite(KEYS.MISTAKE_LOG, nextList);
    return nextList;
  },

  /**
   * Ghi nhận 1 lần luyện lại câu sai (2-Strike Mastery ở 2 ngày khác nhau):
   * - Nếu isCorrect === true:
   *   + Lần đúng 1 (strikeCount = 0 -> 1): lưu lastCorrectDate = YYYY-MM-DD hôm nay.
   *   + Lần đúng 2: kiểm tra nếu khác ngày (lastCorrectDate !== todayKey) hoặc forceDifferentDay = true -> tăng strikeCount = 2 & mastered = true.
   *     Nếu trùng ngày hôm nay -> giữ strikeCount = 1 và gắn cờ pendingNextDayStrike = true.
   * - Nếu isCorrect === false -> reset strikeCount = 0, lastCorrectDate = null, mastered = false.
   */
  recordMistakeAttempt(
    questionId,
    isCorrect,
    timeSpent = 0,
    errorTag = null,
    forceDifferentDay = false
  ) {
    if (!questionId) return null;
    const qId = String(questionId);
    const current = this.getMistakes();
    const idx = current.findIndex((item) => String(item.id) === qId);

    if (idx === -1) return null;

    const target = current[idx];
    const nowIso = new Date().toISOString();
    const todayKey = nowIso.slice(0, 10);
    const prevStrike = Number(target.strikeCount) || 0;

    let nextStrike = 0;
    let nextLastCorrectDate = null;
    let pendingNextDayStrike = false;

    if (isCorrect) {
      if (prevStrike === 0) {
        nextStrike = 1;
        nextLastCorrectDate = todayKey;
      } else if (prevStrike >= 1) {
        const isDifferentDay =
          forceDifferentDay ||
          !target.lastCorrectDate ||
          target.lastCorrectDate !== todayKey;
        if (isDifferentDay) {
          nextStrike = 2;
          nextLastCorrectDate = todayKey;
        } else {
          nextStrike = 1;
          nextLastCorrectDate = todayKey;
          pendingNextDayStrike = true;
        }
      }
    }

    const isNowMastered = nextStrike >= 2;

    const updatedRecord = normalizeMistakeRecord({
      ...target,
      errorTag: errorTag || target.errorTag || null,
      strikeCount: nextStrike,
      lastCorrectDate: nextLastCorrectDate,
      pendingNextDayStrike,
      mastered: isNowMastered,
      lastReviewedAt: nowIso,
      history: [
        ...(Array.isArray(target.history) ? target.history : []),
        {
          date: nowIso,
          dayKey: todayKey,
          isCorrect: Boolean(isCorrect),
          timeSpent: Number(timeSpent) || 0,
        },
      ].slice(-20),
    });

    current[idx] = updatedRecord;
    safeWrite(KEYS.MISTAKE_LOG, current);
    return updatedRecord;
  },

  /**
   * Cập nhật nhãn nguyên nhân sai ('careless' | 'vocab_trap' | 'algebra_sign' | 'time_pressure' | 'concept_gap')
   */
  updateMistakeTag(questionId, errorTag, fallbackQuestionObj = null) {
    if (!questionId) return [];
    const qId = String(questionId);
    let current = this.getMistakes();
    const idx = current.findIndex((item) => String(item.id) === qId);

    if (idx === -1 && fallbackQuestionObj) {
      current = this.addMistake(fallbackQuestionObj, errorTag, 0);
      return current;
    }

    if (idx !== -1) {
      current[idx] = normalizeMistakeRecord({
        ...current[idx],
        errorTag,
        lastReviewedAt: new Date().toISOString(),
      });
      safeWrite(KEYS.MISTAKE_LOG, current);
    }

    return current;
  },

  removeMistake(questionId) {
    const current = this.getMistakes();
    const next = current.filter((item) => String(item.id) !== String(questionId));
    safeWrite(KEYS.MISTAKE_LOG, next);
    return next;
  },

  clearMistakes() {
    safeWrite(KEYS.MISTAKE_LOG, []);
    return [];
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
  // 6. SAO LƯU / KHÔI PHỤC FILE JSON 1-CLICK & ĐỒNG BỘ CLOUD
  // =========================================================================
  computeChecksum(dataObj) {
    try {
      const raw = JSON.stringify(dataObj || {});
      let hash = 5381;
      for (let i = 0; i < raw.length; i++) {
        hash = (hash * 33) ^ raw.charCodeAt(i);
      }
      return `sat_chk_${(hash >>> 0).toString(16)}`;
    } catch {
      return 'sat_chk_0';
    }
  },

  exportAllDataPayload() {
    const examHistory = this.getExamHistory();
    const mistakes = this.getMistakes();
    const completedQuestions = this.getCompletedQuestionIds();
    const bookmarks = this.getBookmarks();
    const vocabProgress = this.getVocabProgress();
    const userSettings = this.getUserSettings();

    const coreData = {
      EXAM_HISTORY: examHistory,
      MISTAKE_LOG: mistakes,
      COMPLETED_QUESTIONS: completedQuestions,
      BOOKMARKED_QUESTIONS: bookmarks,
      VOCAB_PROGRESS: vocabProgress,
      USER_SETTINGS: userSettings,
      // Các trường tương thích ngược
      examHistory,
      mistakes,
      completedQuestions,
      bookmarks,
      vocabProgress,
      userSettings,
    };

    const checksum = this.computeChecksum(coreData);

    return {
      version: '2.0',
      appName: 'SAT Exam Platform',
      exportedAt: new Date().toISOString(),
      checksum,
      ...coreData,
    };
  },

  exportBackupData() {
    const data = this.exportAllDataPayload();
    const settings = this.getUserSettings();
    const rawName =
      localStorage.getItem('sat_custom_display_name') ||
      settings?.studentName ||
      'Phan_Tien_Thanh';
    const safeDisplayName = String(rawName)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Student';

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `sat_backup_${safeDisplayName}_${dateStr}.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      filename,
      exportedAt: data.exportedAt,
      checksum: data.checksum,
      examCount: data.EXAM_HISTORY.length,
      mistakeCount: data.MISTAKE_LOG.length,
      vocabCount: Object.keys(data.VOCAB_PROGRESS || {}).length,
      completedCount: data.COMPLETED_QUESTIONS.length,
    };
  },

  downloadBackupJson() {
    return this.exportBackupData();
  },

  inspectBackupPayload(jsonStringOrObj) {
    try {
      const parsed =
        typeof jsonStringOrObj === 'string'
          ? JSON.parse(jsonStringOrObj)
          : jsonStringOrObj;

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {
          valid: false,
          error: 'Cấu trúc tệp JSON không phải là một đối tượng sao lưu hợp lệ.'.normalize('NFC'),
        };
      }

      const rawExams = parsed.EXAM_HISTORY ?? parsed.examHistory;
      const rawMistakes = parsed.MISTAKE_LOG ?? parsed.mistakes;
      const rawCompleted =
        parsed.COMPLETED_QUESTIONS ?? parsed.completedQuestions;
      const rawBookmarks =
        parsed.BOOKMARKED_QUESTIONS ?? parsed.bookmarks;
      const rawVocab = parsed.VOCAB_PROGRESS ?? parsed.vocabProgress;
      const rawSettings = parsed.USER_SETTINGS ?? parsed.userSettings;

      const hasAnyRequiredField =
        Array.isArray(rawExams) ||
        Array.isArray(rawMistakes) ||
        Array.isArray(rawCompleted) ||
        (rawVocab && typeof rawVocab === 'object') ||
        parsed.appName === 'SAT Exam Platform';

      if (!hasAnyRequiredField) {
        return {
          valid: false,
          error:
            'Tệp JSON thiếu các trường dữ liệu bắt buộc của SAT Exam Platform (EXAM_HISTORY, MISTAKE_LOG, COMPLETED_QUESTIONS, VOCAB_PROGRESS).'.normalize(
              'NFC'
            ),
        };
      }

      const examList = Array.isArray(rawExams) ? rawExams : [];
      const mistakeList = Array.isArray(rawMistakes) ? rawMistakes : [];
      const completedList = Array.isArray(rawCompleted) ? rawCompleted : [];
      const bookmarkList = Array.isArray(rawBookmarks) ? rawBookmarks : [];
      const vocabObj =
        rawVocab && typeof rawVocab === 'object' && !Array.isArray(rawVocab)
          ? rawVocab
          : {};
      const settingsObj =
        rawSettings && typeof rawSettings === 'object' ? rawSettings : null;

      return {
        valid: true,
        summary: {
          version: parsed.version || '1.0',
          appName: parsed.appName || 'SAT Exam Platform',
          exportedAt: parsed.exportedAt || null,
          checksum: parsed.checksum || null,
          studentName:
            settingsObj?.studentName || 'Phan Tiến Thành'.normalize('NFC'),
          examCount: examList.length,
          mistakeCount: mistakeList.length,
          vocabCount: Object.keys(vocabObj).length,
          completedCount: completedList.length,
          bookmarkCount: bookmarkList.length,
        },
        normalizedPayload: {
          examHistory: examList,
          mistakes: mistakeList,
          completedQuestions: completedList,
          bookmarks: bookmarkList,
          vocabProgress: vocabObj,
          userSettings: settingsObj,
        },
      };
    } catch (err) {
      return {
        valid: false,
        error: `Tệp tải lên bị lỗi cú pháp JSON hoặc không đúng định dạng (${err?.message || 'Syntax Error'}).`.normalize(
          'NFC'
        ),
      };
    }
  },

  validateAndRestoreBackup(jsonString, mode = 'merge') {
    const inspection = this.inspectBackupPayload(jsonString);
    if (!inspection.valid) {
      throw new Error(inspection.error);
    }

    const mergeMode = mode !== 'overwrite';
    const {
      examHistory,
      mistakes,
      completedQuestions,
      bookmarks,
      vocabProgress,
      userSettings,
    } = inspection.normalizedPayload;

    // 1. Khôi phục danh sách câu hỏi đã hoàn thành (COMPLETED_QUESTIONS)
    if (mergeMode) {
      this.markQuestionsCompleted(completedQuestions);
    } else {
      safeWrite(
        KEYS.COMPLETED_QUESTIONS,
        Array.from(new Set(completedQuestions.filter(Boolean).map(String)))
      );
    }

    // 2. Khôi phục tiến độ từ vựng SRS (VOCAB_PROGRESS)
    if (mergeMode) {
      const currentVocab = this.getVocabProgress();
      safeWrite(KEYS.VOCAB_PROGRESS, {
        ...currentVocab,
        ...vocabProgress,
      });
    } else {
      safeWrite(KEYS.VOCAB_PROGRESS, vocabProgress);
    }

    // 3. Khôi phục lịch sử thi (EXAM_HISTORY)
    if (mergeMode) {
      const currentHist = this.getExamHistory();
      const seenIds = new Set(currentHist.map((h) => h?.id).filter(Boolean));
      const mergedHist = [
        ...currentHist,
        ...examHistory.filter((h) => h && (!h.id || !seenIds.has(h.id))),
      ];
      safeWrite(KEYS.EXAM_HISTORY, mergedHist.slice(0, 150));
    } else {
      safeWrite(KEYS.EXAM_HISTORY, examHistory.slice(0, 150));
    }

    // 4. Khôi phục Sổ tay câu sai 2-Strike (MISTAKE_LOG)
    const normalizedIncomingMistakes = mistakes
      .map(normalizeMistakeRecord)
      .filter(Boolean);

    if (mergeMode) {
      const currentMistakes = this.getMistakes();
      const seenM = new Set(currentMistakes.map((m) => String(m.id)));
      const mergedM = [
        ...currentMistakes,
        ...normalizedIncomingMistakes.filter((m) => !seenM.has(String(m.id))),
      ];
      safeWrite(KEYS.MISTAKE_LOG, mergedM.slice(0, 300));
    } else {
      safeWrite(KEYS.MISTAKE_LOG, normalizedIncomingMistakes.slice(0, 300));
    }

    // 5. Khôi phục câu hỏi đánh dấu (BOOKMARKED_QUESTIONS)
    if (mergeMode) {
      const currentBookmarks = this.getBookmarks();
      const seenB = new Set(currentBookmarks.map((b) => String(b?.id)));
      const mergedB = [
        ...currentBookmarks,
        ...bookmarks.filter((b) => b && b.id && !seenB.has(String(b.id))),
      ];
      safeWrite(KEYS.BOOKMARKED_QUESTIONS, mergedB);
    } else {
      safeWrite(KEYS.BOOKMARKED_QUESTIONS, bookmarks);
    }

    // 6. Khôi phục cài đặt người dùng (USER_SETTINGS)
    if (userSettings && typeof userSettings === 'object') {
      if (mergeMode) {
        this.saveUserSettings(userSettings);
      } else {
        safeWrite(KEYS.USER_SETTINGS, {
          studentName: 'Phan Tiến Thành',
          targetScore: 1550,
          soundEnabled: true,
          timerVisible: true,
          ...userSettings,
        });
      }
    }

    return {
      success: true,
      mode: mergeMode ? 'merge' : 'overwrite',
      examCount: this.getExamHistory().length,
      mistakeCount: this.getMistakes().length,
      vocabCount: Object.keys(this.getVocabProgress() || {}).length,
      completedCount: this.getCompletedQuestionIds().length,
    };
  },

  importDataPayload(payload, mergeMode = true) {
    return this.validateAndRestoreBackup(
      payload,
      mergeMode ? 'merge' : 'overwrite'
    );
  },

  async syncToSupabaseCloud(syncKey) {
    const cleanKey = String(syncKey || '').trim();
    if (!cleanKey)
      throw new Error('Vui lòng nhập Mã đồng bộ cá nhân (Sync Key)!');
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
    if (!cleanKey)
      throw new Error('Vui lòng nhập Mã đồng bộ cá nhân (Sync Key)!');
    if (!supabase) throw new Error('Chưa cấu hình kết nối Supabase!');

    const { data, error } = await supabase
      .from('user_backups')
      .select('payload, updated_at')
      .eq('sync_key', cleanKey)
      .single();

    if (error || !data?.payload) {
      throw new Error('Không tìm thấy bản sao lưu nào với mã này trên Cloud!');
    }

    this.validateAndRestoreBackup(data.payload, 'merge');
    return data.updated_at;
  },
};

export default storageService;