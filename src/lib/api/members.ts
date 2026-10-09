/** Members: instruments/vocals, onboarding, calendar feed token. */
import { supabase } from '../supabase';
import type {
  Proficiency, VocalFlag,
} from '../../types';

/** Replace a member's instruments + vocals (delete then insert). */
export async function updateMemberInstruments(
  profileId: string,
  instruments: { id: string; lv: Proficiency }[],
  vocals: VocalFlag[],
): Promise<void> {
  await supabase.from('profile_instruments').delete().eq('profile_id', profileId);
  if (instruments.length) {
    await supabase.from('profile_instruments').insert(
      instruments.map((i) => ({ profile_id: profileId, instrument_id: i.id, proficiency: i.lv })),
    );
  }
  await supabase.from('profile_vocals').delete().eq('profile_id', profileId);
  if (vocals.length) {
    await supabase.from('profile_vocals').insert(vocals.map((v) => ({ profile_id: profileId, flag: v })));
  }
}

/** Complete sign-up onboarding: record instruments/vocals and mark onboarded. */
export async function onboard(
  profileId: string,
  instruments: { id: string; lv: Proficiency }[],
  vocals: VocalFlag[],
): Promise<void> {
  await updateMemberInstruments(profileId, instruments, vocals);
  await supabase.from('profiles').update({ onboarded: true }).eq('id', profileId);
}

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
