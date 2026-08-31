import { createClient } from '@supabase/supabase-js';

// Fall back to a placeholder so `createClient` never throws in demo mode
// (no env keys). The data layer guards all queries behind `isDemo`, so the
// placeholder client is never actually used.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'demo-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
