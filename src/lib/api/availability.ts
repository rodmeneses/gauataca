/** Write side: availability polls ("which date works?"). */
import { supabase } from '../supabase';
import { diffSlots, normalizeSlots } from '../availability';
import type { AvailabilityAnswer, AvailabilitySlot, AvailabilitySlotInput } from '../../types';

const slotRows = (pollId: number, slots: AvailabilitySlotInput[]) =>
  slots.map((s) => ({ poll_id: pollId, date: s.date, start_time: s.start, end_time: s.end }));

/** Create a poll with its candidate slots; resolves to the new poll id. */
export async function createAvailabilityPoll(input: { title: string; slots: AvailabilitySlotInput[] }, userId: string): Promise<number | undefined> {
  const { data } = await supabase
    .from('availability_polls')
    .insert({ title: input.title, created_by: userId })
    .select('id')
    .single()
    .throwOnError();
  const id: number | undefined = data?.id;
  if (id === undefined) return undefined;
  await supabase.from('availability_dates').insert(slotRows(id, normalizeSlots(input.slots))).throwOnError();
  return id;
}

/**
 * Rename a poll and change its slots. Unchanged slots keep their answers; a slot whose date
 * or hours changed is a new candidate, so its old answers go with it.
 */
export async function updateAvailabilityPoll(id: number, input: { title: string; slots: AvailabilitySlotInput[] }, current: AvailabilitySlot[]): Promise<void> {
  const { remove, add } = diffSlots(current, normalizeSlots(input.slots));
  await supabase.from('availability_polls').update({ title: input.title }).eq('id', id).throwOnError();
  if (remove.length) await supabase.from('availability_dates').delete().in('id', remove).throwOnError();
  if (add.length) await supabase.from('availability_dates').insert(slotRows(id, add)).throwOnError();
}

/** Set (or, with `null`, clear) the signed-in member's answer for one candidate slot. */
export async function setAvailability(pollId: number, slotId: number, answer: AvailabilityAnswer | null, userId: string): Promise<void> {
  if (answer === null) {
    await supabase.from('availability_votes').delete().eq('slot_id', slotId).eq('profile_id', userId).throwOnError();
    return;
  }
  await supabase
    .from('availability_votes')
    .upsert({ poll_id: pollId, slot_id: slotId, profile_id: userId, answer }, { onConflict: 'slot_id,profile_id' })
    .throwOnError();
}

/** Close a poll (no more answers) or reopen it. */
export async function setAvailabilityClosed(id: number, closed: boolean): Promise<void> {
  await supabase.from('availability_polls').update({ closed }).eq('id', id).throwOnError();
}

/** Delete a poll with its slots and answers. */
export async function deleteAvailabilityPoll(id: number): Promise<void> {
  await supabase.from('availability_polls').delete().eq('id', id).throwOnError();
}
