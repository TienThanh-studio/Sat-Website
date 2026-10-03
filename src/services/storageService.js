import { examService, isNetworkError } from './examService';

const K = {
  draft: (sid) => `sat:draft:${sid}`,
  queue: 'sat:pendingSubmissions',
  attempts: 'sat:attemptsCache',
};

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
};

export const storageService = {
  // Bản nháp khi học viên đang làm bài
  saveDraft: (sessionId, draft) => write(K.draft(sessionId), { ...draft, savedAt: Date.now() }),
  loadDraft: (sessionId) => read(K.draft(sessionId), null),
  clearDraft: (sessionId) => localStorage.removeItem(K.draft(sessionId)),

  // Hàng đợi nộp bài khi rớt mạng
  getPending: () => read(K.queue, []),
  enqueueFinal({ sessionId, answers, times }) {
    const q = read(K.queue, []).filter((i) => i.sessionId !== sessionId);
    q.push({ sessionId, answers, times, queuedAt: Date.now() });
    write(K.queue, q);
  },

  /** Nộp bài; nếu mất mạng thì lưu tạm vào hàng đợi */
  async submitFinal({ sessionId, answers, times }) {
    try {
      const result = await examService.submitExam(sessionId, answers, times);
      this.clearDraft(sessionId);
      return result;
    } catch (err) {
      if (err.isNetwork || isNetworkError(err)) {
        this.enqueueFinal({ sessionId, answers, times });
        return { queued: true };
      }
      throw err;
    }
  },

  /** Tự động đồng bộ các bài thi còn trong hàng đợi khi có mạng */
  async flushPending() {
    const queue = read(K.queue, []);
    const synced = [];
    const remaining = [];
    for (let i = 0; i < queue.length; i++) {
      try {
        const result = await examService.submitExam(queue[i].sessionId, queue[i].answers, queue[i].times);
        this.clearDraft(queue[i].sessionId);
        synced.push(result);
      } catch (err) {
        if (err.isNetwork || isNetworkError(err)) {
          remaining.push(...queue.slice(i));
          break;
        }
      }
    }
    write(K.queue, remaining);
    return synced;
  },

  async getAttempts(userId) {
    try {
      const rows = await examService.listAttempts();
      write(`${K.attempts}:${userId}`, rows);
      return { rows, fromCache: false };
    } catch (err) {
      if (err.isNetwork) return { rows: read(`${K.attempts}:${userId}`, []), fromCache: true };
      throw err;
    }
  },

  getAttemptResult: (attemptId) => examService.getAttemptResult(attemptId),
};