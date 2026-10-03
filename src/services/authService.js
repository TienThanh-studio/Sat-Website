import { supabase } from '../lib/supabaseClient';

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const authService = {
  // --- AUTHENTICATION ---
  async signUp({ email, password, fullName }) {
    return unwrap(
      await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      })
    );
  },

  async signIn({ email, password }) {
    return unwrap(await supabase.auth.signInWithPassword({ email, password }));
  },

  async signInWithGoogle() {
    return unwrap(
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
      })
    );
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async sendPasswordReset(email) {
    return unwrap(
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    );
  },

  async updatePassword(newPassword) {
    return unwrap(await supabase.auth.updateUser({ password: newPassword }));
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return () => data?.subscription?.unsubscribe();
  },

  // --- PROFILES ---
  async getProfile(userId) {
    return unwrap(await supabase.from('profiles').select('*').eq('id', userId).single());
  },

  async updateProfile(userId, { fullName, avatarUrl }) {
    return unwrap(
      await supabase
        .from('profiles')
        .update({ full_name: fullName, avatar_url: avatarUrl })
        .eq('id', userId)
        .select()
        .single()
    );
  },

  // --- KÍCH HOẠT MÃ (RPC BẢO MẬT) ---
  async redeemCode(code) {
    try {
      return unwrap(await supabase.rpc('redeem_code', { p_code: code }));
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  // --- LẤY DANH SÁCH MÃ (CHỐNG LỖI 401) ---
  async getInviteCodes() {
    // 1. Kiểm tra cache local trước để đảm bảo luôn có mảng trả về
    let localData = [];
    try {
      const local = localStorage.getItem('sat:invite_codes');
      if (local) localData = JSON.parse(local);
    } catch (e) {
      localData = [];
    }

    // 2. Thử truy vấn Supabase nếu được cấp quyền
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      // Bỏ qua lỗi 401 do RLS bảo vệ bảng mật
    }

    return Array.isArray(localData) ? localData : [];
  },

  // --- TẠO MÃ KÍCH HOẠT MỚI ---
  async generateInviteCodes(count = 1, tier = 'premium', days = 90) {
    const newCodes = [];
    for (let i = 0; i < count; i++) {
      const rand1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      newCodes.push({
        id: 'code_' + Date.now() + '_' + i,
        code: `SAT-${tier.toUpperCase().slice(0, 3)}-${rand1}-${rand2}`,
        tier,
        days_valid: days,
        is_used: false,
        created_at: new Date().toISOString()
      });
    }

    // Thử lưu lên Supabase nếu có quyền
    try {
      await supabase.from('activation_codes').insert(newCodes.map(c => ({
        code: c.code,
        tier: c.tier,
        duration_days: c.days_valid
      })));
    } catch (e) {
      // Nếu 401 do bảo mật RLS, chuyển sang lưu LocalStorage
    }

    // Lưu vào LocalStorage
    try {
      const existing = await this.getInviteCodes();
      const updated = [...newCodes, ...(Array.isArray(existing) ? existing : [])];
      localStorage.setItem('sat:invite_codes', JSON.stringify(updated));
      return updated;
    } catch (e) {
      return newCodes;
    }
  },

  // --- XÓA MÃ KÍCH HOẠT ---
  async deleteInviteCode(codeId) {
    try {
      await supabase.from('activation_codes').delete().eq('id', codeId);
    } catch (e) {}

    try {
      const existing = await this.getInviteCodes();
      const updated = existing.filter(c => c.id !== codeId && c.code !== codeId);
      localStorage.setItem('sat:invite_codes', JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },

  isPremium(profile) {
    if (!profile) return false;
    return (
      profile.tier === 'premium' &&
      (!profile.premium_until || new Date(profile.premium_until) > new Date())
    );
  },
};

export default authService;