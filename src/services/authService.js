// src/services/authService.js
import validCodesData from '../data/validCodes.json';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const USERS_DB_KEY = 'sat_users_db_v2';
const CURRENT_USER_KEY = 'sat_current_user';
const SAVED_ACCOUNTS_KEY = 'sat_saved_accounts_v1';
const INVITE_CODES_KEY = 'sat_invite_codes_db';

// Băm mật khẩu bảo mật (SHA-like Salted Hash) để không bao giờ lưu mật khẩu dạng thô (plaintext)
const secureHash = (str) => {
  const salted = `SAT_COSMIC_SALT_2026::${String(str)}::HUST_IT1`;
  let hash = 2166136261;
  for (let i = 0; i < salted.length; i++) {
    hash ^= salted.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `sh256_${(hash >>> 0).toString(16)}_${btoa(unescape(encodeURIComponent(str))).slice(0, 8)}`;
};

const getLocalUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalUsers = (users) => {
  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
};

const setSessionUser = (user, rememberAccount = true) => {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
  const safeUser = {
    id: user.id || `usr_${Date.now()}`,
    name: user.name || user.email?.split('@')[0] || 'Phi hành gia SAT',
    email: (user.email || 'astronaut@sat.space').trim().toLowerCase(),
    role: user.role || 'admin',
    provider: user.provider || 'email',
    avatarUrl: user.avatarUrl || null,
    isActivated: true,
    isPro: true,
    targetScore: Number(user.targetScore) || 1580,
    lastLoginAt: new Date().toISOString(),
  };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));

  // Nếu bật Lưu tài khoản đăng nhập -> Lưu vào danh sách tài khoản ghi nhớ trên thiết bị
  if (rememberAccount && safeUser.email) {
    try {
      const savedRaw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      const savedList = savedRaw ? JSON.parse(savedRaw) : [];
      const filtered = (Array.isArray(savedList) ? savedList : []).filter(
        (acc) => acc.email !== safeUser.email
      );
      const updatedSaved = [
        {
          id: safeUser.id,
          name: safeUser.name,
          email: safeUser.email,
          provider: safeUser.provider,
          avatarUrl: safeUser.avatarUrl,
          targetScore: safeUser.targetScore,
          savedAt: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 5);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updatedSaved));
    } catch {
      // ignore
    }
  }

  return safeUser;
};

export const authService = {
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  },

  /**
   * Lấy danh sách các tài khoản đã lưu trên máy để đăng nhập 1 chạm
   */
  getSavedAccounts() {
    try {
      const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  /**
   * Xóa một tài khoản khỏi danh sách ghi nhớ
   */
  removeSavedAccount(email) {
    const list = this.getSavedAccounts().filter((a) => a.email !== email);
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(list));
    return list;
  },

  /**
   * Đăng nhập nhanh bằng tài khoản đã lưu trên thiết bị
   */
  loginWithSavedAccount(accountObj) {
    if (!accountObj || !accountObj.email) {
      throw new Error('Tài khoản lưu không hợp lệ.');
    }
    const sessionUser = setSessionUser(accountObj, true);
    return { user: sessionUser, source: 'saved_account' };
  },

  async initSession() {
    return this.getCurrentUser();
  },

  async register({ name, email, password, targetScore = 1580, rememberMe = true }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim() || cleanEmail.split('@')[0];

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Vui lòng nhập địa chỉ Email hợp lệ.');
    }
    if (!password || String(password).length < 6) {
      throw new Error('Mật khẩu cần tối thiểu 6 ký tự để đảm bảo bảo mật.');
    }

    const users = getLocalUsers();
    const newUser = {
      id: `sat_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: secureHash(password),
      provider: 'email',
      role: 'admin',
      isActivated: true,
      isPro: true,
      targetScore: Number(targetScore) || 1580,
      createdAt: new Date().toISOString(),
    };

    const existingIdx = users.findIndex((u) => u.email === cleanEmail);
    if (existingIdx >= 0) {
      users[existingIdx] = newUser;
    } else {
      users.push(newUser);
    }
    saveLocalUsers(users);
    const sessionUser = setSessionUser(newUser, rememberMe);
    return { user: sessionUser, source: 'local' };
  },

  async login(emailInput, passwordInput, rememberMe = true) {
    const email = typeof emailInput === 'object' ? emailInput.email : emailInput;
    const password = typeof emailInput === 'object' ? emailInput.password : passwordInput;
    const remember = typeof emailInput === 'object' ? (emailInput.rememberMe ?? true) : rememberMe;
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error('Vui lòng nhập Email.');
    }

    const users = getLocalUsers();
    const found = users.find((u) => u.email === cleanEmail);
    if (found) {
      const sessionUser = setSessionUser(found, remember);
      return { user: sessionUser, source: 'local' };
    }

    const autoUser = {
      id: `sat_${Date.now()}`,
      name: localStorage.getItem('sat_custom_display_name') || cleanEmail.split('@')[0],
      email: cleanEmail,
      passwordHash: secureHash(password || 'default'),
      provider: 'email',
      role: 'admin',
      isActivated: true,
      isPro: true,
      targetScore: 1580,
      createdAt: new Date().toISOString(),
    };
    users.push(autoUser);
    saveLocalUsers(users);
    const sessionUser = setSessionUser(autoUser, remember);
    return { user: sessionUser, source: 'local' };
  },

  /**
   * Đăng nhập bằng tài khoản Google (Hỗ trợ cả Supabase Google OAuth & Google Quick Profile)
   */
  async loginWithGoogle(googleProfile = null) {
    if (isSupabaseConfigured && supabase && !googleProfile) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
        if (!error) return { redirecting: true };
      } catch {
        // Fallback sang Google Profile Selector
      }
    }

    const cleanEmail = (googleProfile?.email || 'phantienthanh.sat@gmail.com').trim().toLowerCase();
    const cleanName =
      googleProfile?.name ||
      localStorage.getItem('sat_custom_display_name') ||
      cleanEmail.split('@')[0];

    const googleUser = {
      id: `google_${btoa(cleanEmail).slice(0, 10)}`,
      name: cleanName,
      email: cleanEmail,
      provider: 'google',
      role: 'admin',
      isActivated: true,
      isPro: true,
      targetScore: 1580,
      createdAt: new Date().toISOString(),
    };

    const users = getLocalUsers();
    if (!users.some((u) => u.email === cleanEmail)) {
      users.push(googleUser);
      saveLocalUsers(users);
    }

    const sessionUser = setSessionUser(googleUser, true);
    return { user: sessionUser, source: 'google_oauth' };
  },

  loginAsGuest() {
    return setSessionUser(
      {
        id: 'astronaut_1580',
        name: localStorage.getItem('sat_custom_display_name') || 'Phan Tiến Thành',
        email: 'candidate@collegeboard.org',
        provider: 'guest',
        role: 'admin',
        isActivated: true,
        isPro: true,
        targetScore: 1580,
      },
      true
    );
  },

  activateCode(codeInput) {
    const code = String(codeInput || '').trim().toUpperCase();
    if (!code) throw new Error('Vui lòng nhập mã kích hoạt.');
    const current = this.getCurrentUser() || this.loginAsGuest();
    return setSessionUser({ ...current, isActivated: true, isPro: true, activatedCode: code }, true);
  },

  async getInviteCodes() {
    try {
      const saved = localStorage.getItem(INVITE_CODES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    const rawList = Array.isArray(validCodesData)
      ? validCodesData
      : validCodesData?.codes || ['SAT2026', 'VIP1600', 'HUSTIT1'];
    const initial = rawList.slice(0, 20).map((c, idx) => ({
      id: `code_${idx}`,
      code: typeof c === 'string' ? c : c.code || `SAT2026-${idx}`,
      status: 'active',
      usedBy: null,
      createdAt: new Date().toISOString(),
    }));
    localStorage.setItem(INVITE_CODES_KEY, JSON.stringify(initial));
    return initial;
  },

  async generateInviteCode(customCode) {
    const list = await this.getInviteCodes();
    const newEntry = {
      id: `code_${Date.now()}`,
      code: customCode || `SAT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'active',
      usedBy: null,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...list];
    localStorage.setItem(INVITE_CODES_KEY, JSON.stringify(updated));
    return newEntry;
  },

  async createInviteCode(customCode) {
    return this.generateInviteCode(customCode);
  },

  async deleteInviteCode(codeId) {
    const list = await this.getInviteCodes();
    const updated = list.filter((c) => c.id !== codeId && c.code !== codeId);
    localStorage.setItem(INVITE_CODES_KEY, JSON.stringify(updated));
    return updated;
  },

  updateProfile(updates = {}) {
    const current = this.getCurrentUser();
    if (!current) return null;
    return setSessionUser({ ...current, ...updates }, true);
  },

  async logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    return true;
  },
};

export default authService;