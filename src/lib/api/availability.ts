/** Write side: availability polls ("which date works?"). */
import { supabase } from '../supabase';
import type { AvailabilityAnswer } from '../../types';

/** Create a poll with its candidate dates; resolves to the new poll id. */
export async function createAvailabilityPoll(input: { title: string; dates: string[] }, userId: string): Promise<number | undefined> {
  const { data } = await supabase
    .from('availability_polls')
    .insert({ title: input.title, created_by: userId })
    .select('id')
    .single()
    .throwOnError();
  const id: number | undefined = data?.id;
  if (id === undefined) return undefined;
  const dates = [...new Set(input.dates)];
  await supabase.from('availability_dates').insert(dates.map((date) => ({ poll_id: id, date }))).throwOnError();
  return id;
}

/** Set (or, with `null`, clear) the signed-in member's answer for one candidate date. */
export async function setAvailability(pollId: number, date: string, answer: AvailabilityAnswer | null, userId: string): Promise<void> {
  if (answer === null) {
    await supabase.from('availability_votes').delete().eq('poll_id', pollId).eq('date', date).eq('profile_id', userId).throwOnError();
    return;
  }
  await supabase
    .from('availability_votes')
    .upsert({ poll_id: pollId, date, profile_id: userId, answer }, { onConflict: 'poll_id,date,profile_id' })
    .throwOnError();
}

/** Close a poll (no more answers) or reopen it. */
export async function setAvailabilityClosed(id: number, closed: boolean): Promise<void> {
  await supabase.from('availability_polls').update({ closed }).eq('id', id).throwOnError();
}

/** Delete a poll with its dates and answers. */
export async function deleteAvailabilityPoll(id: number): Promise<void> {
  await supabase.from('availability_polls').delete().eq('id', id).throwOnError();
}
