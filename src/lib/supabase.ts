// ============================================================
// e-APRESIASI KKBDA — Supabase Client
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Ujian sambungan selamat (Read-Only) ke Supabase
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}> {
  try {
    const { data, error } = await supabase
      .from('award_years')
      .select('id, year, is_active')
      .limit(1);

    if (error) {
      return {
        success: false,
        message: `Ralat sambungan Supabase: ${error.message}`,
        error,
      };
    }

    return {
      success: true,
      message: 'Sambungan ke Supabase berjaya (Read-Only query berjaya).',
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Ralat tak dijangka: ${err?.message || err}`,
      error: err,
    };
  }
}
