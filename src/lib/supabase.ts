import { createClient } from '@supabase/supabase-js';

// Fall back to a placeholder so `createClient` never throws when env keys are
// missing. Without credentials the data layer's fetch fails and the app shows
// empty data (never fake data).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
