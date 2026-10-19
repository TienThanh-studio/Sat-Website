// src/utils/securityGuard.js

const actionTimestamps = new Map();
const burstHistory = [];
let penaltyUntil = 0;

const COOLDOWN_RULES = {
  forum_post: 10000,   // Đăng bài diễn đàn: tối thiểu 10 giây / bài
  forum_reply: 3000,   // Bình luận diễn đàn: tối thiểu 3 giây / lần
  forum_like: 500,     // Bấm Like: 0.5 giây / lần
  study_chat: 1200,    // Chat phòng học: 1.2 giây / tin nhắn
  study_emoji: 250,    // Thả cảm xúc: 0.25 giây / lần
  exam_submit: 4000,   // Nộp bài thi: khóa 4 giây chống double-submit
};

const MAX_BURST_ACTIONS = 25;
const BURST_WINDOW_MS = 10000;
const PENALTY_LOCK_MS = 20000;

export const securityGuard = {
  checkRateLimit(actionKey, customCooldownMs = null) {
    const now = Date.now();

    if (now < penaltyUntil) {
      const waitSec = Math.ceil((penaltyUntil - now) / 1000);
      return {
        allowed: false,
        waitSeconds: waitSec,
        reason: `Hệ thống phát hiện thao tác quá nhanh! Vui lòng chờ ${waitSec} giây để tiếp tục.`,
      };
    }

    while (burstHistory.length > 0 && now - burstHistory[0] > BURST_WINDOW_MS) {
      burstHistory.shift();
    }
    burstHistory.push(now);

    if (burstHistory.length > MAX_BURST_ACTIONS) {
      penaltyUntil = now + PENALTY_LOCK_MS;
      return {
        allowed: false,
        waitSeconds: Math.ceil(PENALTY_LOCK_MS / 1000),
        reason: 'Cảnh báo bảo mật: Bạn đang gửi yêu cầu quá dồn dập. Tạm khóa thao tác 20 giây!',
      };
    }

    const cooldown = customCooldownMs ?? COOLDOWN_RULES[actionKey] ?? 1000;
    const lastTime = actionTimestamps.get(actionKey) || 0;
    const elapsed = now - lastTime;

    if (elapsed < cooldown) {
      const remainingSec = Math.ceil((cooldown - elapsed) / 1000);
      return {
        allowed: false,
        waitSeconds: remainingSec,
        reason: `Thao tác hơi nhanh! Vui lòng đợi ${remainingSec} giây nữa nhé.`,
      };
    }

    actionTimestamps.set(actionKey, now);
    return { allowed: true, waitSeconds: 0, reason: '' };
  },

  sanitizeInput(rawText = '', maxLength = 3500) {
    if (typeof rawText !== 'string') return '';

    let cleaned = rawText.trim();
    if (cleaned.length > maxLength) {
      cleaned = cleaned.slice(0, maxLength);
    }

    cleaned = cleaned
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/<\s*(iframe|object|embed|applet|meta|link|style)[^>]*>/gi, '')
      .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/javascript\s*:/gi, '');

    return cleaned;
  },

  validateAttachment(file, maxSizeMB = 4) {
    if (!file) return { valid: false, error: 'Không tìm thấy tệp.' };

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `Tệp "${file.name}" vượt quá dung lượng tối đa ${maxSizeMB}MB!`,
      };
    }

    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt)$/i;
    if (!allowedExtensions.test(file.name)) {
      return {
        valid: false,
        error: `Định dạng tệp "${file.name}" không được hỗ trợ vì lý do bảo mật!`,
      };
    }

    return { valid: true, error: '' };
  },
};