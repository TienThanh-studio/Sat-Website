import { supabase } from '../lib/supabaseClient';

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const authService = {
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

  async redeemCode(code) {
    return unwrap(await supabase.rpc('redeem_code', { p_code: code }));
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