/** Write side: members. */
import { supabase } from '../supabase';
import { newId } from './shared';
import type { Proficiency, VocalFlag } from '../../types';

/** Create a custom instrument in the catalog; returns its id. */
export async function createInstrument(name: string): Promise<string> {
  const id = newId('i');
  await supabase.from('instruments').insert({ id, name_es: name, name_en: name, is_basic: false }).throwOnError();
  return id;
}

/** Replace a member's instruments + vocals (delete then insert). */
export async function updateMemberInstruments(
  profileId: string,
  instruments: { id: string; lv: Proficiency }[],
  vocals: VocalFlag[],
): Promise<void> {
  await supabase.from('profile_instruments').delete().eq('profile_id', profileId).throwOnError();
  if (instruments.length) {
    await supabase.from('profile_instruments').insert(
      instruments.map((i) => ({ profile_id: profileId, instrument_id: i.id, proficiency: i.lv })),
    ).throwOnError();
  }
  await supabase.from('profile_vocals').delete().eq('profile_id', profileId).throwOnError();
  if (vocals.length) {
    await supabase.from('profile_vocals').insert(vocals.map((v) => ({ profile_id: profileId, flag: v }))).throwOnError();
  }
}

/** Complete sign-up onboarding: record instruments/vocals and mark onboarded. */
export async function onboard(
  profileId: string,
  instruments: { id: string; lv: Proficiency }[],
  vocals: VocalFlag[],
): Promise<void> {
  await updateMemberInstruments(profileId, instruments, vocals);
  await supabase.from('profiles').update({ onboarded: true }).eq('id', profileId).throwOnError();
}
