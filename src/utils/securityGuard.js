// src/utils/securityGuard.js

const actionTimestamps = new Map();
const burstHistory = [];
let penaltyUntil = 0;

// Cấu hình thời gian chờ (Cooldown tính bằng mili-giây) cho từng loại hành động
const COOLDOWN_RULES = {
  forum_post: 12000,    // Đăng bài diễn đàn: tối thiểu 12 giây / bài
  forum_reply: 4000,    // Bình luận diễn đàn: tối thiểu 4 giây / lần
  forum_like: 800,      // Bấm Like: 0.8 giây / lần
  study_chat: 1500,     // Chat phòng học: 1.5 giây / tin nhắn
  study_emoji: 350,     // Thả cảm xúc: 0.35 giây / lần
  exam_submit: 5000,    // Nộp bài thi: khóa 5 giây chống double-submit
};

const MAX_BURST_ACTIONS = 22; // Tối đa 22 request trong 10 giây
const BURST_WINDOW_MS = 10000;
const PENALTY_LOCK_MS = 25000; // Khóa 25 giây nếu phát hiện spam script

export const securityGuard = {
  /**
   * Kiểm tra xem hành động có được phép thực hiện hay đang trong thời gian chờ (Cooldown)
   * @param {string} actionKey - Tên hành động (VD: 'forum_post', 'study_chat')
   * @param {number} customCooldownMs - Thời gian chờ tùy chỉnh (nếu có)
   * @returns {{ allowed: boolean, waitSeconds: number, reason: string }}
   */
  checkRateLimit(actionKey, customCooldownMs = null) {
    const now = Date.now();

    // 1. Kiểm tra xem người dùng có đang bị phạt khóa tạm thời do spam quá nhanh không
    if (now < penaltyUntil) {
      const waitSec = Math.ceil((penaltyUntil - now) / 1000);
      return {
        allowed: false,
        waitSeconds: waitSec,
        reason: `Hệ thống phát hiện thao tác quá nhanh! Vui lòng chờ ${waitSec} giây để tiếp tục.`,
      };
    }

    // 2. Kiểm tra Burst (tổng số hành động trong 10 giây qua)
    while (burstHistory.length > 0 && now - burstHistory[0] > BURST_WINDOW_MS) {
      burstHistory.shift();
    }
    burstHistory.push(now);

    if (burstHistory.length > MAX_BURST_ACTIONS) {
      penaltyUntil = now + PENALTY_LOCK_MS;
      return {
        allowed: false,
        waitSeconds: Math.ceil(PENALTY_LOCK_MS / 1000),
        reason: 'Cảnh báo bảo mật: Bạn đang gửi yêu cầu quá dồn dập. Tạm khóa thao tác trong 25 giây!',
      };
    }

    // 3. Kiểm tra Cooldown của từng hành động cụ thể
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

    // Hợp lệ -> Ghi nhận mốc thời gian mới
    actionTimestamps.set(actionKey, now);
    return { allowed: true, waitSeconds: 0, reason: '' };
  },

  /**
   * Làm sạch văn bản đầu vào: Chống XSS / Script Injection nhưng bảo toàn công thức LaTeX
   * @param {string} rawText - Chuỗi người dùng nhập
   * @param {number} maxLength - Độ dài tối đa cho phép
   */
  sanitizeInput(rawText = '', maxLength = 3500) {
    if (typeof rawText !== 'string') return '';

    let cleaned = rawText.trim();

    // Giới hạn chiều dài chống tràn bộ nhớ (Payload Limit)
    if (cleaned.length > maxLength) {
      cleaned = cleaned.slice(0, maxLength);
    }

    // Loại bỏ các thẻ HTML nguy hiểm (<script>, <iframe>, <object>, <embed>, on* events)
    cleaned = cleaned
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/<\s*(iframe|object|embed|applet|meta|link|style)[^>]*>/gi, '')
      .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/javascript\s*:/gi, '');

    return cleaned;
  },

  /**
   * Kiểm tra tệp đính kèm an toàn (chỉ cho phép định dạng ảnh/tài liệu chuẩn và giới hạn dung lượng)
   */
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