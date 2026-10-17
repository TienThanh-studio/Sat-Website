// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Chặn domain Supabase đã ngưng hoạt động (opgallumeavzruxqqbyt) và key publishable không hợp lệ để tránh lỗi đỏ WebSocket
const isDeadHost =
  rawUrl.includes('opgallumeavzruxqqbyt') ||
  rawKey.startsWith('sb_publishable_') ||
  rawKey === 'your-anon-key';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl.startsWith('https://') &&
  !isDeadHost
);

export const supabase = isSupabaseConfigured
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: false,
      },
    })
  : null;

export default supabase;