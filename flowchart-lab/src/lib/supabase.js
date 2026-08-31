// ==============================================================================
// SUPABASE CLIENT & REALTIME CONNECTION LAYER
// Flowchart Quest (Flowchart Lab)
// ==============================================================================
import { createClient } from '@supabase/supabase-js';

// Environment variables with fallback (safe across browser, Vite, and Node)
const getEnv = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {}
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL').trim();
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY').trim();


// Fallback dummy URL to prevent createClient crashes during build if env is temporarily unset
const DEFAULT_URL = supabaseUrl || 'https://placeholder.supabase.co';
const DEFAULT_KEY = supabaseAnonKey || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder')
);

export const supabase = createClient(DEFAULT_URL, DEFAULT_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 20
    }
  }
});

/**
 * Check Supabase Connection Health
 * @returns {Promise<{ ok: boolean, latencyMs?: number, message: string }>}
 */
export const checkSupabaseConnection = async () => {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message: 'Supabase URL หรือ Anon Key ยังไม่ได้กำหนดใน Environment Variables'
    };
  }

  const start = Date.now();
  try {
    const { error } = await supabase.from('classrooms').select('count', { count: 'exact', head: true });
    if (error) throw error;

    return {
      ok: true,
      latencyMs: Date.now() - start,
      message: 'เชื่อมต่อ Supabase PostgreSQL สำเร็จ (Live Real-Time Ready)'
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      message: `ไม่สามารถเชื่อมต่อ Supabase ได้: ${err.message}`
    };
  }
};
