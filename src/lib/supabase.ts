import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Placeholder values keep the app from crashing before .env.local is set up;
// the UI shows a setup message instead when isSupabaseConfigured is false.
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseKey || 'missing-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
);
