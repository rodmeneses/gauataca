/** Write side: events. */
import { supabase } from '../supabase';
import { notifyCreated } from '../notify';
import { newId } from './shared';
import { removePhotos, uploadPhoto } from './photos';
import type { EventType, RsvpStatus } from '../../types';
import { syncEventTransactions } from './ledger';

/* -------------------------------------------------------------- mutations */
export async function createEvent(
  input: { title: string; venue: string; date: string; time: string; hours: number; fee: number; cost: number; note: string; type: EventType },
  _userId: string,
): Promise<string> {
  const startsAt = `${input.date}T${input.time || '19:00'}:00Z`;
  const id = newId('x');
  await supabase.from('events').insert({
    id,
    type: input.type,
    state: 'active',
    starts_at: startsAt,
    duration_hours: input.hours || null,
    venue: input.venue,
    fee_cents: Math.round(input.fee * 100),
    cost_cents: Math.round(input.cost * 100),
    attend: 0,
    title_es: input.title,
    title_en: input.title,
    note_es: input.note,
    note_en: input.note,
  }).throwOnError();
  void notifyCreated({ kind: 'event', id });
  return id;
}

/** Update an event's core fields (title / type / date / time / hours / venue / fee / cost / note). */
export async function updateEvent(
  id: string,
  input: { title: string; venue: string; date: string; time: string; hours: number; fee: number; cost: number; note: string; type: EventType },
  userId: string,
): Promise<void> {
  const { data: ev } = await supabase.from('events').select('settled').eq('id', id).single();
  const startsAt = `${input.date}T${input.time || '19:00'}:00Z`;
  await supabase.from('events').update({
    type: input.type,
    starts_at: startsAt,
    duration_hours: input.hours || null,
    venue: input.venue,
    fee_cents: Math.round(input.fee * 100),
    cost_cents: Math.round(input.cost * 100),
    title_es: input.title,
    title_en: input.title,
    note_es: input.note,
    note_en: input.note,
  }).eq('id', id).throwOnError();
  // A settled event's ledger movements mirror its fee/cost — keep them in sync
  // so a retroactive amount change flows through to the income/expense report.
  if (ev?.settled) {
    await syncEventTransactions(id, input.fee, input.cost, userId);
  }
}

/** Pin/unpin an event — pinned events sort to the top of the calendar's upcoming/history lists. */
export async function setEventPinned(id: string, pinned: boolean): Promise<void> {
  await supabase.from('events').update({ pinned }).eq('id', id).throwOnError();
}

/** Cancel or reinstate an event — cancelled events move to the history list. */
export async function setEventState(id: string, state: 'active' | 'cancelled'): Promise<void> {
  await supabase.from('events').update({ state }).eq('id', id).throwOnError();
}

/** Add a recording ("take") of a song during a practice event. */
export async function addTake(eventId: string, songId: string, url: string): Promise<void> {
  const { data } = await supabase.from('takes').select('n').eq('song_id', songId).order('n', { ascending: false }).limit(1);
  const n = (data?.[0]?.n ?? 0) + 1;
  await supabase.from('takes').insert({ id: newId('k'), event_id: eventId, song_id: songId, url, n }).throwOnError();
}

/** Remove a recording ("take"). */
export async function deleteTake(id: string): Promise<void> {
  await supabase.from('takes').delete().eq('id', id).throwOnError();
}

/* ------------------------------------------------------------- event media */
/** Add a photo or video link to an event. */
export async function addEventMedia(
  eventId: string,
  input: { kind: 'photo' | 'video'; labelEs: string; labelEn: string; url: string },
  userId: string,
): Promise<void> {
  await supabase.from('event_media').insert({
    event_id: eventId,
    kind: input.kind,
    label_es: input.labelEs,
    label_en: input.labelEn,
    url: input.url,
    submitted_by: userId || null,
  }).throwOnError();
}

/** Add several uploaded photo URLs to an event in a single insert; resolves true on success. */
export async function addEventPhotos(eventId: string, urls: string[], userId: string): Promise<boolean> {
  if (urls.length === 0) return false;
  const { error } = await supabase.from('event_media').insert(
    urls.map((url) => ({
      event_id: eventId,
      kind: 'photo',
      label_es: '',
      label_en: '',
      url,
      submitted_by: userId || null,
    })),
  );
  // The files are already uploaded; don't leave them orphaned in storage if the rows didn't land.
  if (error) await removePhotos('event-photos', urls);
  return !error;
}

/** Remove an event media row; also deletes the storage object when it's an uploaded photo. */
export async function deleteEventMedia(id: number): Promise<void> {
  const { data: row } = await supabase.from('event_media').select('url').eq('id', id).single();
  await supabase.from('event_media').delete().eq('id', id).throwOnError();
  if (row?.url) await removePhotos('event-photos', [row.url]);
}

/** Upload an event photo to the public `event-photos` bucket; returns its public URL. */
export async function uploadEventPhoto(blob: Blob, thumb?: Blob | null): Promise<string> {
  return uploadPhoto('event-photos', blob, thumb);
}

export async function setRsvp(eventId: string, status: RsvpStatus | null, userId: string): Promise<void> {
  if (status === null) {
    await supabase.from('event_attendance').delete().eq('event_id', eventId).eq('profile_id', userId).throwOnError();
  } else {
    await supabase.from('event_attendance').upsert({
      event_id: eventId,
      profile_id: userId,
      status,
      updated_at: new Date().toISOString(),
    }).throwOnError();
  }
}

/** Create a forum idea; returns its id. */
export async function submitFeedback(
  eventId: string,
  input: { sound: number; perf: number; log: number; energy: number; well: string; improve: string; anon: boolean },
  userId: string,
): Promise<void> {
  await supabase.from('feedback').upsert({
    event_id: eventId,
    profile_id: userId,
    anonymous: input.anon,
    sound: input.sound,
    performance: input.perf,
    logistics: input.log,
    energy: input.energy,
    went_well_es: input.well,
    went_well_en: input.well,
    improve_es: input.improve,
    improve_en: input.improve,
  }).throwOnError();
}

export async function pickPoll(eventId: string, optionIndex: number, userId: string): Promise<void> {
  const { data: polls } = await supabase.from('polls').select('id').eq('event_id', eventId);
  const poll = polls?.[0];
  if (!poll) return;
  const { data: opts } = await supabase.from('poll_options').select('id').eq('poll_id', poll.id).order('id');
  const opt = opts?.[optionIndex];
  if (!opt) return;
  const optIds = (opts ?? []).map((o) => o.id);
  await supabase.from('poll_votes').delete().in('option_id', optIds).eq('profile_id', userId).throwOnError();
  await supabase.from('poll_votes').insert({ option_id: opt.id, profile_id: userId }).throwOnError();
}

export async function setEventSetlist(eventId: string, songIds: string[], _userId: string): Promise<void> {
  await supabase.from('event_songs').delete().eq('event_id', eventId).throwOnError();
  if (songIds.length) {
    await supabase.from('event_songs').insert(
      songIds.map((songId, i) => ({ event_id: eventId, song_id: songId, position: i + 1 })),
    ).throwOnError();
  }
}
