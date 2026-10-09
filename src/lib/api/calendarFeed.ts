/** Secret per-member calendar-feed token. */
import { supabase } from '../supabase';

/* ----------------------------------------------------------- calendar feed */
/** The member's secret calendar-feed token, created on first use. Null if it can't be read or created. */
export async function getCalendarToken(userId: string): Promise<string | null> {
  const read = async () => {
    const { data } = await supabase.from('calendar_tokens').select('token').eq('profile_id', userId).maybeSingle();
    return (data?.token as string | undefined) ?? null;
  };
  const existing = await read();
  if (existing) return existing;
  await supabase.from('calendar_tokens').insert({ profile_id: userId });
  return read();
}

/** Invalidate the current feed URL and issue a new one. */
export async function rotateCalendarToken(userId: string): Promise<string | null> {
  await supabase.from('calendar_tokens').delete().eq('profile_id', userId);
  return getCalendarToken(userId);
}
